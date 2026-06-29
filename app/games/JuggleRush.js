'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const CANVAS_W = 260;
const CANVAS_H = 300;
const GRAVITY = 0.15;
const BALL_RADIUS = 12;
const JUGGLE_VY = -8;
const MAX_BALLS = 5;
const BALL_COLORS = ['#00ff88', '#ff0055', '#00ffcc', '#ffea00', '#ff88ff'];

let ballIdCounter = 0;

function makeBall(id, existingBalls) {
  // Spawn at random x near top, not overlapping others
  let x = BALL_RADIUS + Math.random() * (CANVAS_W - BALL_RADIUS * 2);
  return {
    id,
    x,
    y: BALL_RADIUS + 10,
    vx: (Math.random() * 3 + 1.5) * (Math.random() < 0.5 ? 1 : -1),
    vy: Math.random() * 2,
    color: BALL_COLORS[id % BALL_COLORS.length],
    radius: BALL_RADIUS,
  };
}

export default function JuggleRush() {
  const { closeGame, reportScore } = useArcade();
  const TOTAL_STEPS = 2;

  const canvasRef = useRef(null);
  const gameOverRef = useRef(false);
  const rafRef = useRef(null);
  const scoreRef = useRef(0);
  const heartsRef = useRef(3);
  const ballsRef = useRef([]);
  const lastTimestampRef = useRef(null);
  const phaseRef = useRef('idle');
  const countdownRef = useRef(3);
  const countdownTimerRef = useRef(null);
  const scoreTimerRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const lastScoreTickRef = useRef(0); // for per-second scoring

  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState('idle');

  // ── spawn ball ─────────────────────────────────────────────────────────────
  const spawnBall = useCallback(() => {
    if (ballsRef.current.length >= MAX_BALLS) return;
    const id = ++ballIdCounter;
    const ball = makeBall(id, ballsRef.current);
    ballsRef.current = [...ballsRef.current, ball];
  }, []);

  // ── game over ──────────────────────────────────────────────────────────────
  const handleGameOver = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    phaseRef.current = 'gameover';
    setPhase('gameover');

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (scoreTimerRef.current) clearInterval(scoreTimerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);

    const finalScore = scoreRef.current;
    setScore(finalScore);
    reportScore(finalScore * 15);

    setTimeout(() => setStep(1), 1200);
  }, [reportScore]);

  // ── game loop ──────────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp) => {
    if (gameOverRef.current) return;
    if (phaseRef.current !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const delta = Math.min((timestamp - lastTimestampRef.current) / 16.67, 3); // normalized frames
    lastTimestampRef.current = timestamp;

    // Score tick: +1 per second, proportional to delta
    const elapsedSec = timestamp / 1000;
    const secTick = Math.floor(elapsedSec);
    if (secTick > lastScoreTickRef.current && ballsRef.current.length > 0) {
      lastScoreTickRef.current = secTick;
      scoreRef.current += ballsRef.current.length;
      setScore(scoreRef.current);
    }

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,0,85,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_H; i += 25) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_W, i);
      ctx.stroke();
    }

    // Bottom danger zone
    ctx.fillStyle = 'rgba(255,0,85,0.08)';
    ctx.fillRect(0, CANVAS_H - 20, CANVAS_W, 20);
    ctx.strokeStyle = 'rgba(255,0,85,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_H - 20);
    ctx.lineTo(CANVAS_W, CANVAS_H - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Physics update & render balls
    const updatedBalls = [];
    let heartLost = false;

    for (let i = 0; i < ballsRef.current.length; i++) {
      let b = { ...ballsRef.current[i] };

      // Apply gravity and velocity
      b.vy += GRAVITY * delta;
      b.x += b.vx * delta;
      b.y += b.vy * delta;

      // Wall bounces
      if (b.x - b.radius < 0) {
        b.x = b.radius;
        b.vx = Math.abs(b.vx);
      } else if (b.x + b.radius > CANVAS_W) {
        b.x = CANVAS_W - b.radius;
        b.vx = -Math.abs(b.vx);
      }

      // Ceiling bounce
      if (b.y - b.radius < 0) {
        b.y = b.radius;
        b.vy = Math.abs(b.vy);
      }

      // Bottom: lose heart
      if (b.y + b.radius > CANVAS_H) {
        heartsRef.current = Math.max(0, heartsRef.current - 1);
        setHearts(heartsRef.current);
        heartLost = true;

        if (heartsRef.current <= 0) {
          // Draw remaining balls before ending
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.fill();
          handleGameOver();
          return;
        } else {
          // Reset ball to top
          b.x = BALL_RADIUS + Math.random() * (CANVAS_W - BALL_RADIUS * 2);
          b.y = BALL_RADIUS + 10;
          b.vx = (Math.random() * 3 + 1.5) * (Math.random() < 0.5 ? 1 : -1);
          b.vy = 1;
        }
      }

      // Draw ball
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();

      // Shine
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.28, b.y - b.radius * 0.28, b.radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();
      ctx.restore();

      updatedBalls.push(b);
    }

    ballsRef.current = updatedBalls;

    // HUD: hearts
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    for (let h = 0; h < 3; h++) {
      ctx.fillStyle = h < heartsRef.current ? '#ff0055' : 'rgba(255,0,85,0.2)';
      ctx.fillText('♥', 6 + h * 20, 16);
    }

    // HUD: score
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${scoreRef.current} pts`, CANVAS_W - 6, 16);
    ctx.textAlign = 'left';

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [handleGameOver]);

  // ── juggle on click/touch ──────────────────────────────────────────────────
  const handleInteract = useCallback((clientX, clientY) => {
    if (phaseRef.current !== 'playing') return;
    if (gameOverRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    // Scale for canvas vs display size
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const canvasX = cx * scaleX;
    const canvasY = cy * scaleY;

    const updatedBalls = ballsRef.current.map((b) => {
      const dist = Math.hypot(canvasX - b.x, canvasY - b.y);
      if (dist <= b.radius + 10) {
        return { ...b, vy: JUGGLE_VY };
      }
      return b;
    });
    ballsRef.current = updatedBalls;
  }, []);

  const handleCanvasClick = (e) => {
    handleInteract(e.clientX, e.clientY);
  };

  const handleCanvasTouch = (e) => {
    
    const touch = e.changedTouches[0];
    if (touch) handleInteract(touch.clientX, touch.clientY);
  };

  // ── start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    gameOverRef.current = false;
    phaseRef.current = 'countdown';
    setPhase('countdown');
    setStep(0);
    setScore(0);
    setHearts(3);
    heartsRef.current = 3;
    scoreRef.current = 0;
    ballsRef.current = [];
    lastTimestampRef.current = null;
    lastScoreTickRef.current = 0;
    ballIdCounter = 0;
    countdownRef.current = 3;
    setCountdown(3);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (scoreTimerRef.current) clearInterval(scoreTimerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        clearInterval(countdownTimerRef.current);
        phaseRef.current = 'playing';
        setPhase('playing');

        // Spawn first ball
        spawnBall();
        lastTimestampRef.current = null;
        rafRef.current = requestAnimationFrame(gameLoop);

        // Spawn additional balls every 5 seconds
        spawnTimerRef.current = setInterval(() => {
          if (!gameOverRef.current && phaseRef.current === 'playing') {
            spawnBall();
          }
        }, 5000);
      }
    }, 1000);
  }, [gameLoop, spawnBall]);

  // ── cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (scoreTimerRef.current) clearInterval(scoreTimerRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, []);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="game-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />

      {step === 0 && (
        <>
          <h2 className="game-title" style={{ color: '#ff0055', marginBottom: 4 }}>🎪 JUGGLE RUSH</h2>

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
                border: '1px solid #ff0055',
                boxShadow: '0 0 10px #ff0055 inset',
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
                <div style={{ fontSize: 36 }}>🎪</div>
                <div style={{ color: '#ff0055', fontFamily: 'monospace', fontSize: 13, textAlign: 'center', lineHeight: 1.6, padding: '0 16px' }}>
                  Tap the balls to keep<br />
                  them in the air!<br />
                  <span style={{ color: '#ffea00' }}>3 hearts — don't drop!</span>
                </div>
                <button
                  className="btn btn-pink"
                  style={{ minHeight: 44, padding: '10px 28px', fontSize: 14 }}
                  onClick={startGame}
                  
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
                  color: '#ff0055', textShadow: '0 0 20px #ff0055',
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
                <div style={{ fontSize: 28, fontWeight: 900, color: '#ff0055', fontFamily: 'monospace' }}>DROPPED!</div>
                <div style={{ color: '#ffaacc', fontFamily: 'monospace', fontSize: 14 }}>Score: {score}</div>
              </div>
            )}

            {/* Hearts display overlay (playing) */}
            {phase === 'playing' && (
              <div style={{
                position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                color: 'rgba(255,0,85,0.4)', fontFamily: 'monospace', fontSize: 10,
                pointerEvents: 'none', whiteSpace: 'nowrap',
              }}>
                TAP balls to juggle
              </div>
            )}
          </div>

          {/* Score / Hearts below canvas */}
          <div style={{ display: 'flex', gap: 20, color: '#ff0055', fontFamily: 'monospace', fontSize: 13, letterSpacing: 1 }}>
            <span>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ color: i < hearts ? '#ff0055' : 'rgba(255,0,85,0.2)', marginRight: 3 }}>♥</span>
              ))}
            </span>
            <span style={{ color: '#00ff88' }}>SCORE: {score}</span>
          </div>
        </>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '10px 0' }}>
          <h2 className="game-title" style={{ color: '#ff0055' }}>🎪 JUGGLE RUSH</h2>
          <div className="result-box" style={{ borderColor: '#ff0055', boxShadow: '0 0 12px #ff0055 inset', minWidth: 220 }}>
            <div className="result-title" style={{ color: '#ff0055' }}>GAME OVER</div>
            <div className="result-stat" style={{ color: '#ff88aa', fontSize: 22, margin: '8px 0' }}>
              {score} PTS
            </div>
            <div className="result-text" style={{ color: 'rgba(255,0,85,0.6)', fontSize: 12 }}>
              Final Score: {score * 15} pts
            </div>
            <div className="result-breakdown" style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {score >= 40 ? '🏆 Juggling Master!' : score >= 20 ? '⭐ Great Juggler!' : '💪 Keep Juggling!'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-pink"
              style={{ minHeight: 44, padding: '10px 22px' }}
              onClick={startGame}
              
            >
              PLAY AGAIN
            </button>
            <button
              className="btn"
              style={{ minHeight: 44, padding: '10px 22px' }}
              onClick={closeGame}
              
            >
              EXIT MACHINE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

