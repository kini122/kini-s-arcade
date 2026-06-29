'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const RING_SIZE = 140; // diameter
const RING_RADIUS = RING_SIZE / 2;
const CANVAS_SIZE = 260;
const CENTER = CANVAS_SIZE / 2;
const BALL_RADIUS = 10;
const GATE_COLORS = ['#ff0055', '#0088ff']; // red, blue
const GATE_LABELS = ['R', 'B'];
// Gates at 0, 180 degrees in ring-local coords
const GATE_BASE_ANGLES = [0, 180]; // degrees
const ROTATE_SPEED = 1.5; // degrees per frame
const MAX_HEARTS = 3;

function degToRad(d) { return (d * Math.PI) / 180; }

export default function SpinTrap() {
  const { closeGame, reportScore } = useArcade();

  const [step, setStep] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Visual state (driven from refs for smooth rAF updates)
  const [ringAngle, setRingAngle] = useState(0);
  const [ballsState, setBallsState] = useState([]);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [hitEffect, setHitEffect] = useState(null); // {id, color, success}

  // Refs
  const ringAngleRef = useRef(0);
  const ballsRef = useRef([]); // [{id, x, y, vy, color, colorIdx, active}]
  const scoreRef = useRef(0);
  const heartsRef = useRef(MAX_HEARTS);
  const gameOverRef = useRef(false);
  const rafRef = useRef(null);
  const leftHeldRef = useRef(false);
  const rightHeldRef = useRef(false);
  const spawnTimerRef = useRef(null);
  const ballIdRef = useRef(0);
  const spawnIntervalRef = useRef(2500);
  const frameCountRef = useRef(0);

  const handleGameOver = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    const finalScore = scoreRef.current;
    reportScore(finalScore * 30);
    setStep(1);
  }, [reportScore]);

  const spawnBall = useCallback(() => {
    if (gameOverRef.current) return;
    const colorIdx = Math.floor(Math.random() * 2); // 2 colors
    const id = ballIdRef.current++;
    // Spawn somewhere near center-top, varying x slightly
    const x = CENTER + (Math.random() - 0.5) * 40;
    const newBall = {
      id,
      x,
      y: CENTER - RING_RADIUS - 40, // above ring
      vy: 0.8, // slower drop
      color: GATE_COLORS[colorIdx],
      colorIdx,
      active: true,
    };
    ballsRef.current = [...ballsRef.current, newBall];

    // Schedule next spawn
    if (!gameOverRef.current) {
      const interval = Math.max(1200, spawnIntervalRef.current - frameCountRef.current * 0.3);
      spawnTimerRef.current = setTimeout(spawnBall, interval);
    }
  }, []);

  // Check if a ball's x position (relative to center) matches any gate at current ring angle
  // Returns gate index (0-3) or -1 if no gate near
  const getGateAtX = useCallback((ballX) => {
    // The ball is falling straight down toward center
    // For each gate, compute its world angle = gateBaseAngle + ringAngle
    // Gate world position on ring:
    //   gx = CENTER + RING_RADIUS * sin(worldAngle)
    //   gy = CENTER - RING_RADIUS * cos(worldAngle)
    // Ball enters ring from above (top half). Check gates in top half (gy < CENTER)
    // Actually we check based on the angle of the ball relative to center
    const ballAngleFromCenter = Math.atan2(ballX - CENTER, -(CENTER - RING_RADIUS - 5)) * (180 / Math.PI);
    // Normalize
    const normalizedBallAngle = ((ballAngleFromCenter % 360) + 360) % 360;

    for (let i = 0; i < 2; i++) { // 2 gates
      const worldAngle = ((GATE_BASE_ANGLES[i] + ringAngleRef.current) % 360 + 360) % 360;
      let diff = Math.abs(worldAngle - normalizedBallAngle);
      if (diff > 180) diff = 360 - diff;
      if (diff < 40) return i; // 40 degree tolerance for easier catch
    }
    return -1;
  }, []);

  const gameLoop = useCallback(() => {
    if (gameOverRef.current) return;
    frameCountRef.current += 1;

    // Rotate ring
    if (leftHeldRef.current) ringAngleRef.current -= ROTATE_SPEED;
    if (rightHeldRef.current) ringAngleRef.current += ROTATE_SPEED;
    setRingAngle(ringAngleRef.current);

    // Update balls
    let heartsChanged = false;
    let scoreChanged = false;
    const effectsToShow = [];

    const updatedBalls = ballsRef.current
      .map((b) => {
        if (!b.active) return b;
        const newY = b.y + b.vy;
        // Speed increases over time
        const speed = 0.8 + Math.min(frameCountRef.current * 0.0015, 1.5);
        const finalY = b.y + speed;

        // Check if ball reached ring perimeter from outside
        const distFromCenter = Math.hypot(b.x - CENTER, finalY - CENTER);

        if (distFromCenter <= RING_RADIUS + 5 && distFromCenter >= RING_RADIUS - 5 && finalY < CENTER) {
          // Ball is at ring border (top half) — check gate
          const gateIdx = getGateAtX(b.x);
          if (gateIdx !== -1) {
            // Check color match
            if (gateIdx === b.colorIdx) {
              scoreRef.current += 1;
              scoreChanged = true;
              effectsToShow.push({ id: b.id, color: b.color, success: true, x: b.x, y: finalY });
            } else {
              heartsRef.current -= 1;
              heartsChanged = true;
              effectsToShow.push({ id: b.id, color: '#ff0055', success: false, x: b.x, y: finalY });
              if (heartsRef.current <= 0) {
                // Will trigger game over after loop
              }
            }
            return { ...b, active: false };
          }
        }

        // Ball passed through center or below
        if (finalY > CENTER + RING_RADIUS + 20) {
          return { ...b, active: false }; // missed, no penalty
        }

        return { ...b, y: finalY };
      })
      .filter((b) => b.active);

    ballsRef.current = updatedBalls;

    if (scoreChanged) setScore(scoreRef.current);
    if (heartsChanged) {
      setHearts(heartsRef.current);
      if (heartsRef.current <= 0) {
        setBallsState([]);
        handleGameOver();
        return;
      }
    }

    setBallsState([...updatedBalls]);

    if (effectsToShow.length > 0) {
      setHitEffect(effectsToShow[0]);
      setTimeout(() => setHitEffect(null), 400);
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [getGateAtX, handleGameOver]);

  const startGame = useCallback(() => {
    gameOverRef.current = false;
    scoreRef.current = 0;
    heartsRef.current = MAX_HEARTS;
    ringAngleRef.current = 0;
    ballsRef.current = [];
    ballIdRef.current = 0;
    frameCountRef.current = 0;
    spawnIntervalRef.current = 2500;
    leftHeldRef.current = false;
    rightHeldRef.current = false;

    setScore(0);
    setHearts(MAX_HEARTS);
    setRingAngle(0);
    setBallsState([]);
    setHitEffect(null);
    setGameStarted(false);
    setStep(0);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);

    setCountdown(3);
  }, []);

  // Countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setGameStarted(true);
      rafRef.current = requestAnimationFrame(gameLoop);
      // Start spawning
      spawnTimerRef.current = setTimeout(spawnBall, 1000);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, gameLoop, spawnBall]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, []);

  // Touch/swipe handling on game area
  const touchStartXRef = useRef(null);

  const handleAreaTouchStart = (e) => {
    e.preventDefault();
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleAreaTouchMove = (e) => {
    e.preventDefault();
    if (touchStartXRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartXRef.current;
    if (Math.abs(dx) > 10) {
      ringAngleRef.current += dx * 0.3;
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleAreaTouchEnd = (e) => {
    e.preventDefault();
    touchStartXRef.current = null;
  };

  // Render gates as positioned elements inside the ring div
  // Gate is a small colored gap in the ring border
  const renderGates = () => {
    return GATE_BASE_ANGLES.map((baseAngle, i) => {
      const rad = degToRad(baseAngle - 90); // -90 to start at top
      const gx = RING_RADIUS + RING_RADIUS * Math.cos(rad);
      const gy = RING_RADIUS + RING_RADIUS * Math.sin(rad);
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: gx - 10,
            top: gy - 10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: GATE_COLORS[i],
            boxShadow: `0 0 8px ${GATE_COLORS[i]}, 0 0 4px ${GATE_COLORS[i]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            fontWeight: 'bold',
            color: '#000',
            zIndex: 3,
          }}
        >
          {GATE_LABELS[i]}
        </div>
      );
    });
  };

  const renderHearts = () => {
    const h = [];
    for (let i = 0; i < MAX_HEARTS; i++) {
      h.push(
        <span key={i} style={{ fontSize: 16, opacity: i < hearts ? 1 : 0.2 }}>❤️</span>
      );
    }
    return h;
  };

  return (
    <div className="game-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />

      {step === 0 && (
        <>
          <h2 className="game-title" style={{ color: '#00ffcc', marginBottom: 2 }}>🌀 SPIN TRAP</h2>

          {/* HUD */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: CANVAS_SIZE }}>
            <div style={{ display: 'flex', gap: 2 }}>{renderHearts()}</div>
            <span className="game-label" style={{ color: '#00ffcc' }}>SCORE: {score}</span>
          </div>

          {/* Game area */}
          <div
            style={{
              position: 'relative',
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              background: '#050508',
              border: '1px solid #00ffcc',
              boxShadow: '0 0 10px #00ffcc inset',
              overflow: 'hidden',
              touchAction: 'none',
              userSelect: 'none',
            }}
            onTouchStart={handleAreaTouchStart}
            onTouchMove={handleAreaTouchMove}
            onTouchEnd={handleAreaTouchEnd}
          >
            {/* Ring */}
            <div
              style={{
                position: 'absolute',
                left: CENTER - RING_RADIUS,
                top: CENTER - RING_RADIUS,
                width: RING_SIZE,
                height: RING_SIZE,
                borderRadius: '50%',
                background: 'linear-gradient(to right, rgba(255,0,85,0.2), rgba(0,136,255,0.2))',
                border: '8px solid transparent', // remove solid border since gates cover it mostly
                boxShadow: '0 0 12px rgba(255,255,255,0.2)',
                transform: `rotate(${ringAngle}deg)`,
                zIndex: 2,
              }}
            >
              {/* Half borders to represent 2 gates better */}
              <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '8px solid transparent', borderTopColor: GATE_COLORS[0], borderRightColor: GATE_COLORS[0], transform: 'rotate(-45deg)' }} />
              <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '8px solid transparent', borderBottomColor: GATE_COLORS[1], borderLeftColor: GATE_COLORS[1], transform: 'rotate(-45deg)' }} />

              {renderGates()}
            </div>

            {/* Falling balls */}
            {ballsState.map((b) => (
              <div
                key={b.id}
                style={{
                  position: 'absolute',
                  left: b.x - BALL_RADIUS,
                  top: b.y - BALL_RADIUS,
                  width: BALL_RADIUS * 2,
                  height: BALL_RADIUS * 2,
                  borderRadius: '50%',
                  background: b.color,
                  boxShadow: `0 0 10px ${b.color}, 0 0 4px #fff`,
                  zIndex: 5,
                  pointerEvents: 'none',
                  transition: 'none',
                }}
              />
            ))}

            {/* Hit effect */}
            {hitEffect && (
              <div
                style={{
                  position: 'absolute',
                  left: hitEffect.x - 20,
                  top: hitEffect.y - 20,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: hitEffect.success
                    ? 'rgba(0,255,136,0.4)'
                    : 'rgba(255,0,85,0.4)',
                  zIndex: 10,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                {hitEffect.success ? '✓' : '✗'}
              </div>
            )}

            {/* Color legend */}
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                right: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                zIndex: 8,
              }}
            >
              {GATE_COLORS.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  <span style={{ fontSize: 9, color: c }}>{GATE_LABELS[i]}</span>
                </div>
              ))}
            </div>

            {/* Countdown overlay */}
            {countdown !== null && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(5,5,8,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                }}
              >
                <span style={{ fontSize: 72, color: '#00ffcc', fontWeight: 'bold', textShadow: '0 0 20px #00ffcc' }}>
                  {countdown}
                </span>
              </div>
            )}

            {/* Start overlay */}
            {!gameStarted && countdown === null && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(5,5,8,0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  zIndex: 20,
                }}
              >
                <div style={{ color: '#00ffcc', fontSize: 13, textAlign: 'center', padding: '0 16px', lineHeight: 1.6 }}>
                  Spin the ring!<br/>Match colored balls to gates.<br/>Swipe ← → to rotate.
                </div>
                <button
                  className="btn"
                  style={{ minHeight: 44, fontSize: 14, borderColor: '#00ffcc', color: '#00ffcc' }}
                  onClick={startGame}
                  onTouchStart={(e) => { e.preventDefault(); startGame(); }}
                >
                  START
                </button>
              </div>
            )}

            {/* Game over overlay */}
            {step === 0 && gameOverRef.current && !countdown && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,0,85,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  zIndex: 20,
                }}
              >
                <div style={{ color: '#ff0055', fontSize: 22, fontWeight: 'bold', textShadow: '0 0 10px #ff0055' }}>
                  GAME OVER
                </div>
                <div style={{ color: '#fff', fontSize: 14 }}>Score: {score}</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 4 }}>
            <button
              className="btn"
              style={{
                minHeight: 52,
                minWidth: 70,
                fontSize: 22,
                borderColor: '#00ffcc',
                color: '#00ffcc',
              }}
              onMouseDown={() => { leftHeldRef.current = true; }}
              onMouseUp={() => { leftHeldRef.current = false; }}
              onMouseLeave={() => { leftHeldRef.current = false; }}
              onTouchStart={(e) => { e.preventDefault(); leftHeldRef.current = true; }}
              onTouchEnd={(e) => { e.preventDefault(); leftHeldRef.current = false; }}
            >
              ◀
            </button>
            <span style={{ color: '#00ffcc', fontSize: 11, opacity: 0.7, textAlign: 'center' }}>
              ROTATE<br/>RING
            </span>
            <button
              className="btn"
              style={{
                minHeight: 52,
                minWidth: 70,
                fontSize: 22,
                borderColor: '#00ffcc',
                color: '#00ffcc',
              }}
              onMouseDown={() => { rightHeldRef.current = true; }}
              onMouseUp={() => { rightHeldRef.current = false; }}
              onMouseLeave={() => { rightHeldRef.current = false; }}
              onTouchStart={(e) => { e.preventDefault(); rightHeldRef.current = true; }}
              onTouchEnd={(e) => { e.preventDefault(); rightHeldRef.current = false; }}
            >
              ▶
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 0' }}>
          <h2 className="game-title" style={{ color: '#00ffcc' }}>🌀 SPIN TRAP</h2>
          <div className="result-box">
            <div className="result-title">GAME OVER</div>
            <div className="result-stat">Balls Matched</div>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#00ffcc', textShadow: '0 0 16px #00ffcc' }}>
              {score}
            </div>
            <div className="result-breakdown">Score × 30 = {score * 30} pts</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn"
              style={{ minHeight: 44, borderColor: '#00ffcc', color: '#00ffcc' }}
              onClick={startGame}
              onTouchStart={(e) => { e.preventDefault(); startGame(); }}
            >
              PLAY AGAIN
            </button>
            <button
              className="btn btn-pink"
              style={{ minHeight: 44 }}
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

