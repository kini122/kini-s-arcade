'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const CANVAS_W = 260;
const CANVAS_H = 300;
const PLATFORM_H = 14;
const BASE_PLATFORM_W = 120;
const INITIAL_Y_FROM_BOTTOM = 20; // first stack platform sits 20px from bottom
const MOVING_Y = 28; // y from top of visible area where the moving platform sits

export default function SkyStack() {
  const { closeGame, reportScore } = useArcade();
  const TOTAL_STEPS = 2;

  const canvasRef = useRef(null);
  const gameOverRef = useRef(false);
  const rafRef = useRef(null);
  const scoreRef = useRef(0);
  const stackRef = useRef([]);
  const movingRef = useRef(null); // { x, width }
  const cameraYRef = useRef(0); // how many px we've scrolled up
  const timeRef = useRef(0);
  const lastTimestampRef = useRef(null);
  const phaseRef = useRef('idle'); // idle | countdown | playing | gameover
  const toppleIndexRef = useRef(-1); // index where stack breaks
  const toppleAngleRef = useRef(0); // angle of falling part
  const toppleVYRef = useRef(0); // vertical velocity of falling part
  const countdownRef = useRef(3);
  const countdownTimerRef = useRef(null);
  const scoreTimerRef = useRef(null);
  const droppingRef = useRef(false); // is platform currently dropping?
  const dropYRef = useRef(0); // current y of dropping platform
  const dropTargetYRef = useRef(0); // target y for dropping platform
  const droppingDataRef = useRef(null); // {x, width} of dropping platform

  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState('idle'); // idle | countdown | playing | gameover
  const [perfectMsg, setPerfectMsg] = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────────
  const getOscillationRange = (sc) => Math.max(20, 80 - sc * 5);
  const getOscillationSpeed = (sc) => 1.5 + sc * 0.12;

  const initStack = () => {
    const firstPlatform = {
      x: (CANVAS_W - BASE_PLATFORM_W) / 2,
      y: CANVAS_H - INITIAL_Y_FROM_BOTTOM - PLATFORM_H,
      width: BASE_PLATFORM_W,
    };
    stackRef.current = [firstPlatform];
    cameraYRef.current = 0;
    scoreRef.current = 0;
    timeRef.current = 0;
    lastTimestampRef.current = null;
    droppingRef.current = false;
    droppingDataRef.current = null;
    toppleIndexRef.current = -1;
    toppleAngleRef.current = 0;
    toppleVYRef.current = 0;
    spawnMovingPlatform();
  };

  const spawnMovingPlatform = () => {
    const top = stackRef.current[stackRef.current.length - 1];
    const w = top.width;
    movingRef.current = {
      x: (CANVAS_W - w) / 2,
      width: w,
    };
  };

  const getMovingY = () => {
    // Moving platform is always at MOVING_Y from top of visible canvas
    return MOVING_Y;
  };

  const getStackTopScreenY = () => {
    const top = stackRef.current[stackRef.current.length - 1];
    return top.y - cameraYRef.current;
  };

  // ── drop logic ────────────────────────────────────────────────────────────
  const dropPlatform = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    if (droppingRef.current) return;
    if (gameOverRef.current) return;

    const moving = movingRef.current;
    if (!moving) return;

    // Start drop animation
    droppingRef.current = true;
    droppingDataRef.current = { x: moving.x, width: moving.width };
    dropYRef.current = getMovingY();
    dropTargetYRef.current = getStackTopScreenY() - PLATFORM_H; // land on top
    movingRef.current = null;
  }, []);

  // ── game loop ─────────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp) => {
    if (gameOverRef.current) return;
    if (phaseRef.current !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const delta = (timestamp - lastTimestampRef.current) / 1000; // seconds
    lastTimestampRef.current = timestamp;
    timeRef.current += delta;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw grid lines for depth
    ctx.strokeStyle = 'rgba(0,255,136,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_H; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_W, i);
      ctx.stroke();
    }

    const sc = scoreRef.current;
    const cam = cameraYRef.current;

    // Draw stack platforms
    stackRef.current.forEach((p, i) => {
      const screenY = p.y - cam;
      if (screenY > CANVAS_H + PLATFORM_H || screenY < -PLATFORM_H) return;
      const alpha = 0.4 + (i / stackRef.current.length) * 0.6;
      
      ctx.save();
      if (toppleIndexRef.current !== -1 && i >= toppleIndexRef.current) {
        // Apply toppling physics
        const pivotX = p.toppleDir > 0 ? stackRef.current[toppleIndexRef.current - 1].x + BASE_PLATFORM_W : stackRef.current[toppleIndexRef.current - 1].x;
        const pivotY = stackRef.current[toppleIndexRef.current - 1].y;
        ctx.translate(pivotX, pivotY - cam);
        ctx.rotate(toppleAngleRef.current * p.toppleDir);
        ctx.translate(-pivotX, -(pivotY - cam));
        // Add vertical fall
        ctx.translate(0, toppleVYRef.current);
      }

      ctx.fillStyle = `rgba(0,255,136,${alpha * 0.7})`;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x, screenY, p.width, PLATFORM_H);
      ctx.shadowBlur = 0;
      // top highlight
      ctx.fillStyle = `rgba(0,255,200,${alpha * 0.5})`;
      ctx.fillRect(p.x, screenY, p.width, 2);
      ctx.restore();
    });

    // Animate dropping platform
    if (droppingRef.current && droppingDataRef.current) {
      const dropSpeed = 300; // px per second
      dropYRef.current += dropSpeed * delta;

      if (dropYRef.current >= dropTargetYRef.current) {
        // Resolve collision
        droppingRef.current = false;
        const dp = droppingDataRef.current;
        const top = stackRef.current[stackRef.current.length - 1];
        const landY = top.y - PLATFORM_H;

        // Perfect drop check
        const dpCenter = dp.x + dp.width / 2;
        const topCenter = top.x + top.width / 2;
        let bonus = 0;
        if (Math.abs(dpCenter - topCenter) <= 5) {
          bonus = 2;
          dp.x = top.x; // Snap to center
          setPerfectMsg(true);
          setTimeout(() => setPerfectMsg(false), 800);
        }

        const newPlatform = { x: dp.x, y: landY, width: BASE_PLATFORM_W };
        stackRef.current = [...stackRef.current, newPlatform];

        // Center of mass calculation
        // We check from the top down. For each block i (starting from the one we just placed),
        // we calculate the COM of it and all blocks above it. If that COM is outside the bounds
        // of block i-1, it topples!
        let toppleIdx = -1;
        let toppleDir = 0;
        let totalMass = 0;
        let comSum = 0;
        
        for (let i = stackRef.current.length - 1; i >= 1; i--) {
          totalMass += 1;
          comSum += stackRef.current[i].x + BASE_PLATFORM_W / 2;
          const comX = comSum / totalMass;
          
          const baseBlock = stackRef.current[i - 1];
          if (comX < baseBlock.x || comX > baseBlock.x + BASE_PLATFORM_W) {
            toppleIdx = i;
            toppleDir = comX < baseBlock.x ? -1 : 1;
            break;
          }
        }

        if (toppleIdx !== -1) {
          toppleIndexRef.current = toppleIdx;
          stackRef.current.forEach(p => p.toppleDir = toppleDir);
          handleGameOver();
          return;
        }

        scoreRef.current += 1 + bonus;
        setScore(scoreRef.current);

        // Camera scroll
        const stackTopScreenY = newPlatform.y - cameraYRef.current;
        if (stackTopScreenY < CANVAS_H * 0.5) {
          cameraYRef.current += CANVAS_H * 0.5 - stackTopScreenY;
        }

        droppingDataRef.current = null;
        spawnMovingPlatform();
      } else {
        // Draw dropping platform
        ctx.fillStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 12;
        ctx.fillRect(droppingDataRef.current.x, dropYRef.current, droppingDataRef.current.width, PLATFORM_H);
        ctx.shadowBlur = 0;
      }
    }

    // Draw moving platform
    if (movingRef.current && !droppingRef.current) {
      const range = getOscillationRange(sc);
      const speed = getOscillationSpeed(sc);
      const top = stackRef.current[stackRef.current.length - 1];
      const centerX = top.x + top.width / 2;
      const newX = centerX - movingRef.current.width / 2 + Math.sin(timeRef.current * speed) * range;
      movingRef.current = { ...movingRef.current, x: newX };

      const my = getMovingY();
      ctx.fillStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 16;
      ctx.fillRect(newX, my, movingRef.current.width, PLATFORM_H);
      ctx.shadowBlur = 0;
      // Glow top strip
      ctx.fillStyle = 'rgba(200,255,255,0.7)';
      ctx.fillRect(newX, my, movingRef.current.width, 2);
    }

    // Draw score on canvas
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`STACK: ${scoreRef.current}`, CANVAS_W - 6, 14);
    ctx.textAlign = 'left';

    // Topple animation
    if (phaseRef.current === 'gameover' && toppleIndexRef.current !== -1) {
      toppleAngleRef.current += 2 * delta; // rotate
      toppleVYRef.current += 400 * delta * delta; // fall down
      if (toppleAngleRef.current > Math.PI / 2) {
        toppleAngleRef.current = Math.PI / 2;
      }
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ── game over ─────────────────────────────────────────────────────────────
  const handleGameOver = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    phaseRef.current = 'gameover';
    setPhase('gameover');

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const finalScore = scoreRef.current;
    setScore(finalScore);
    reportScore(finalScore * 40);

    setTimeout(() => {
      setStep(1);
    }, 1800); // give time to watch it fall
  }, [reportScore]);

  // ── start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    gameOverRef.current = false;
    phaseRef.current = 'countdown';
    setPhase('countdown');
    setStep(0);
    setScore(0);
    setPerfectMsg(false);
    countdownRef.current = 3;
    setCountdown(3);

    initStack();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        clearInterval(countdownTimerRef.current);
        phaseRef.current = 'playing';
        setPhase('playing');
        lastTimestampRef.current = null;
        rafRef.current = requestAnimationFrame(gameLoop);
      }
    }, 1000);
  }, [gameLoop]);

  // ── input handlers ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        dropPlatform();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dropPlatform]);

  // ── cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (scoreTimerRef.current) clearInterval(scoreTimerRef.current);
    };
  }, []);

  const handleCanvasClick = () => {
    if (phaseRef.current === 'playing') dropPlatform();
  };

  const handleCanvasTouch = (e) => {
    e.preventDefault();
    if (phaseRef.current === 'playing') dropPlatform();
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="game-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />

      {step === 0 && (
        <>
          <h2 className="game-title" style={{ color: '#00ff88', marginBottom: 4 }}>🏗️ SKY STACK</h2>

          <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onClick={handleCanvasClick}
              onTouchStart={handleCanvasTouch}
              style={{
                display: 'block',
                background: '#050508',
                border: '1px solid #00ff88',
                boxShadow: '0 0 10px #00ff88 inset',
                touchAction: 'none',
                cursor: 'pointer',
              }}
            />

            {/* Start overlay */}
            {phase === 'idle' && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(5,5,8,0.88)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 14,
              }}>
                <div style={{ fontSize: 36 }}>🏗️</div>
                <div style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: 13, textAlign: 'center', lineHeight: 1.6, padding: '0 16px' }}>
                  Drop platforms to stack.<br />
                  Overhangs get sliced off!<br />
                  <span style={{ color: '#ffea00' }}>Perfect drop = +2 bonus</span>
                </div>
                <button
                  className="btn"
                  style={{ minHeight: 44, padding: '10px 28px', fontSize: 14 }}
                  onClick={startGame}
                  onTouchStart={(e) => { e.preventDefault(); startGame(); }}
                >
                  START
                </button>
              </div>
            )}

            {/* Countdown overlay */}
            {phase === 'countdown' && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(5,5,8,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{
                  fontSize: 72, fontWeight: 900, fontFamily: 'monospace',
                  color: '#00ffcc', textShadow: '0 0 20px #00ffcc',
                }}>
                  {countdown}
                </span>
              </div>
            )}

            {/* Game over overlay */}
            {phase === 'gameover' && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,0,85,0.4)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#ff0055', fontFamily: 'monospace' }}>FELL OFF!</div>
                <div style={{ color: '#ffaacc', fontFamily: 'monospace', fontSize: 14 }}>Stack: {score}</div>
              </div>
            )}

            {/* Perfect message */}
            {perfectMsg && phase === 'playing' && (
              <div style={{
                position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)',
                color: '#ffea00', fontFamily: 'monospace', fontWeight: 900, fontSize: 16,
                textShadow: '0 0 10px #ffea00', pointerEvents: 'none',
                animation: 'none',
              }}>
                ✨ PERFECT!
              </div>
            )}

            {/* Tap hint */}
            {phase === 'playing' && (
              <div style={{
                position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                color: 'rgba(0,255,136,0.4)', fontFamily: 'monospace', fontSize: 10,
                pointerEvents: 'none', whiteSpace: 'nowrap',
              }}>
                TAP / SPACE to drop
              </div>
            )}
          </div>

          {/* Score display below canvas */}
          <div style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: 13, letterSpacing: 2 }}>
            SCORE: {score}
          </div>
        </>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '10px 0' }}>
          <h2 className="game-title" style={{ color: '#00ff88' }}>🏗️ SKY STACK</h2>
          <div className="result-box" style={{ borderColor: '#00ff88', boxShadow: '0 0 12px #00ff88 inset', minWidth: 220 }}>
            <div className="result-title" style={{ color: '#00ff88' }}>GAME OVER</div>
            <div className="result-stat" style={{ color: '#00ffcc', fontSize: 22, margin: '8px 0' }}>
              {score} STACKS
            </div>
            <div className="result-text" style={{ color: 'rgba(0,255,136,0.6)', fontSize: 12 }}>
              Score: {score * 40} pts
            </div>
            <div className="result-breakdown" style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {score >= 15 ? '🏆 Master Stacker!' : score >= 8 ? '⭐ Great Stack!' : '💪 Keep Practicing!'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn"
              style={{ minHeight: 44, padding: '10px 22px' }}
              onClick={startGame}
              onTouchStart={(e) => { e.preventDefault(); startGame(); }}
            >
              PLAY AGAIN
            </button>
            <button
              className="btn btn-pink"
              style={{ minHeight: 44, padding: '10px 22px' }}
              onClick={closeGame}
              onTouchStart={(e) => { e.preventDefault(); closeGame(); }}
            >
              EXIT MACHINE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

