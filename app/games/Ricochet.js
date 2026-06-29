'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const CANVAS_SIZE = 260;
const BALL_RADIUS = 7;
const TARGET_RADIUS = 14;
const BALL_SPEED = 5;
const TOTAL_STEPS = 2;

function generateTargets() {
  const count = 4 + Math.floor(Math.random() * 3); // 4-6
  const targets = [];
  const margin = TARGET_RADIUS + 10;
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let t;
    do {
      t = {
        id: i,
        x: margin + Math.random() * (CANVAS_SIZE - margin * 2),
        y: margin + Math.random() * (CANVAS_SIZE / 2 - margin),
        radius: TARGET_RADIUS,
        hit: false,
      };
      attempts++;
    } while (
      attempts < 50 &&
      targets.some(
        (o) => Math.hypot(o.x - t.x, o.y - t.y) < TARGET_RADIUS * 2.5
      )
    );
    targets.push(t);
  }
  return targets;
}

export default function Ricochet() {
  const { closeGame, reportScore } = useArcade();
  const [step, setStep] = useState(0);
  const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(3);
  const [bonusShots, setBonusShots] = useState(0);
  const [targets, setTargets] = useState([]);
  const [ball, setBall] = useState(null); // {x, y, vx, vy} or null
  const [aimLine, setAimLine] = useState(null); // {x1,y1,x2,y2} or null
  const [isAiming, setIsAiming] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const scoreRef = useRef(0);
  const shotsRef = useRef(3);
  const bonusShotsRef = useRef(0);
  const targetsRef = useRef([]);
  const ballRef = useRef(null);
  const gameOverRef = useRef(false);
  const rafRef = useRef(null);
  const areaRef = useRef(null);
  const aimStartRef = useRef(null); // {x, y} origin on canvas
  const isAimingRef = useRef(false);

  // Sync targetsRef with state
  const setTargetsSync = useCallback((newTargets) => {
    targetsRef.current = newTargets;
    setTargets([...newTargets]);
  }, []);

  const handleGameOver = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const finalScore = scoreRef.current;
    reportScore(finalScore * 50);
    setGameOver(true);
    setStep(1);
  }, [reportScore]);

  const spawnRound = useCallback(() => {
    const newTargets = generateTargets();
    setTargetsSync(newTargets);
  }, [setTargetsSync]);

  const gameLoop = useCallback(() => {
    if (gameOverRef.current) return;
    const b = ballRef.current;
    if (!b) {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    let { x, y, vx, vy } = b;
    x += vx;
    y += vy;

    // Wall bounces
    if (x - BALL_RADIUS < 0) { x = BALL_RADIUS; vx = -vx; }
    if (x + BALL_RADIUS > CANVAS_SIZE) { x = CANVAS_SIZE - BALL_RADIUS; vx = -vx; }
    if (y - BALL_RADIUS < 0) { y = BALL_RADIUS; vy = -vy; }

    // Ball fell off bottom
    if (y - BALL_RADIUS > CANVAS_SIZE) {
      ballRef.current = null;
      setBall(null);
      // Check game over
      const currentShots = shotsRef.current;
      const currentBonus = bonusShotsRef.current;
      const remainingTargets = targetsRef.current.filter((t) => !t.hit);
      if (currentShots <= 0 && currentBonus <= 0 && remainingTargets.length > 0) {
        handleGameOver();
        return;
      }
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Target collisions
    let hitOccurred = false;
    const updatedTargets = targetsRef.current.map((t) => {
      if (t.hit) return t;
      const dist = Math.hypot(x - t.x, y - t.y);
      if (dist < t.radius + BALL_RADIUS) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        hitOccurred = true;
        return { ...t, hit: true };
      }
      return t;
    });

    if (hitOccurred) {
      setTargetsSync(updatedTargets);
      const allHit = updatedTargets.every((t) => t.hit);
      if (allHit) {
        // Bonus shots + new round
        bonusShotsRef.current += 1;
        shotsRef.current = 3;
        setBonusShots(bonusShotsRef.current);
        setShots(shotsRef.current);
        ballRef.current = null;
        setBall(null);
        spawnRound();
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }
    }

    ballRef.current = { x, y, vx, vy };
    setBall({ x, y, vx, vy });
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [handleGameOver, setTargetsSync, spawnRound]);

  const startGame = useCallback(() => {
    // Reset all state
    gameOverRef.current = false;
    scoreRef.current = 0;
    shotsRef.current = 3;
    bonusShotsRef.current = 0;
    ballRef.current = null;
    isAimingRef.current = false;

    setScore(0);
    setShots(3);
    setBonusShots(0);
    setBall(null);
    setAimLine(null);
    setIsAiming(false);
    setGameOver(false);
    setGameStarted(false);
    setStep(0);

    const newTargets = generateTargets();
    setTargetsSync(newTargets);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setCountdown(3);
  }, [setTargetsSync]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setGameStarted(true);
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, gameLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const getCanvasPos = (e) => {
    const rect = areaRef.current.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const ballOrigin = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE - 20 };

  const handlePointerDown = (e) => {
    if (!gameStarted || gameOverRef.current || ballRef.current) return;
    if (shotsRef.current <= 0 && bonusShotsRef.current <= 0) return;
        const pos = getCanvasPos(e);
    isAimingRef.current = true;
    setIsAiming(true);
    aimStartRef.current = pos;
    // Show aim line
    setAimLine({ x1: ballOrigin.x, y1: ballOrigin.y, x2: pos.x, y2: pos.y });
  };

  const handlePointerMove = (e) => {
    if (!isAimingRef.current) return;
        const pos = getCanvasPos(e);
    setAimLine({ x1: ballOrigin.x, y1: ballOrigin.y, x2: pos.x, y2: pos.y });
  };

  const handlePointerUp = (e) => {
    if (!isAimingRef.current) return;
        isAimingRef.current = false;
    setIsAiming(false);
    setAimLine(null);

    const pos = getCanvasPos(e);
    const dx = pos.x - ballOrigin.x;
    const dy = pos.y - ballOrigin.y;
    const len = Math.hypot(dx, dy);
    if (len < 5) return; // too short, ignore

    // Only allow shooting upward (dy < 0) or to sides
    const nx = dx / len;
    const ny = dy / len;

    // Spend a shot
    if (bonusShotsRef.current > 0) {
      bonusShotsRef.current -= 1;
      setBonusShots(bonusShotsRef.current);
    } else {
      shotsRef.current -= 1;
      setShots(shotsRef.current);
    }

    ballRef.current = {
      x: ballOrigin.x,
      y: ballOrigin.y,
      vx: nx * BALL_SPEED,
      vy: ny * BALL_SPEED,
    };
    setBall({ ...ballRef.current });
  };

  // Aim line dots
  const renderAimDots = () => {
    if (!aimLine) return null;
    const dots = [];
    const dx = aimLine.x2 - aimLine.x1;
    const dy = aimLine.y2 - aimLine.y1;
    const len = Math.hypot(dx, dy);
    if (len < 5) return null;
    const nx = dx / len;
    const ny = dy / len;
    const numDots = Math.min(8, Math.floor(len / 18));
    for (let i = 1; i <= numDots; i++) {
      const px = ballOrigin.x + nx * i * 18;
      const py = ballOrigin.y + ny * i * 18;
      dots.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: px - 3,
            top: py - 3,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(0,255,136,0.6)',
            pointerEvents: 'none',
          }}
        />
      );
    }
    return dots;
  };

  const renderShotDots = () => {
    const total = shotsRef.current + bonusShotsRef.current;
    const dots = [];
    for (let i = 0; i < Math.min(total, 10); i++) {
      dots.push(
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: i < shotsRef.current ? 'var(--neon)' : '#ffea00',
            margin: '0 3px',
            display: 'inline-block',
          }}
        />
      );
    }
    return dots;
  };

  return (
    <div className="game-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />

      {step === 0 && (
        <>
          <h2 className="game-title" style={{ color: 'var(--neon)', marginBottom: 4 }}>🎯 RICOCHET</h2>

          {/* Game area */}
          <div
            ref={areaRef}
            style={{
              position: 'relative',
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              background: '#050508',
              border: '1px solid var(--neon)',
              boxShadow: '0 0 10px var(--neon) inset',
              overflow: 'hidden',
              touchAction: 'none',
              cursor: gameStarted && !ballRef.current && !gameOver ? 'crosshair' : 'default',
              userSelect: 'none',
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            {/* Targets */}
            {targets.map((t) =>
              !t.hit ? (
                <div
                  key={t.id}
                  style={{
                    position: 'absolute',
                    left: t.x - t.radius,
                    top: t.y - t.radius,
                    width: t.radius * 2,
                    height: t.radius * 2,
                    borderRadius: '50%',
                    background: 'rgba(0,255,136,0.15)',
                    border: '2px solid var(--neon)',
                    boxShadow: '0 0 8px var(--neon)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'var(--neon)',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                  }}
                >
                  ●
                </div>
              ) : null
            )}

            {/* Ball */}
            {ball && (
              <div
                style={{
                  position: 'absolute',
                  left: ball.x - BALL_RADIUS,
                  top: ball.y - BALL_RADIUS,
                  width: BALL_RADIUS * 2,
                  height: BALL_RADIUS * 2,
                  borderRadius: '50%',
                  background: '#ffea00',
                  boxShadow: '0 0 10px #ffea00, 0 0 4px #fff',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              />
            )}

            {/* Ball origin marker (when no ball in flight) */}
            {!ball && gameStarted && !gameOver && (
              <div
                style={{
                  position: 'absolute',
                  left: ballOrigin.x - BALL_RADIUS,
                  top: ballOrigin.y - BALL_RADIUS,
                  width: BALL_RADIUS * 2,
                  height: BALL_RADIUS * 2,
                  borderRadius: '50%',
                  background: '#ffea00',
                  boxShadow: '0 0 10px #ffea00',
                  opacity: 0.8,
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              />
            )}

            {/* Aim dots */}
            {renderAimDots()}

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
                <span style={{ fontSize: 72, color: 'var(--neon)', fontWeight: 'bold', textShadow: '0 0 20px var(--neon)' }}>
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
                <div style={{ color: 'var(--neon)', fontSize: 13, textAlign: 'center', padding: '0 16px', lineHeight: 1.5 }}>
                  Aim & fire at targets!<br/>Bounce off walls to score.
                </div>
                <button
                  className="btn"
                  style={{ minHeight: 44, fontSize: 14 }}
                  onClick={startGame}
                  
                >
                  START
                </button>
              </div>
            )}

            {/* Game over overlay */}
            {gameOver && (
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

          {/* HUD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="game-label">SHOTS:</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>{renderShotDots()}</div>
            <span className="game-label" style={{ marginLeft: 8 }}>SCORE: {score}</span>
          </div>
          {bonusShots > 0 && (
            <div style={{ color: '#ffea00', fontSize: 11, textShadow: '0 0 6px #ffea00' }}>
              +{bonusShots} BONUS SHOTS
            </div>
          )}

          {gameOver && (
            <button
              className="btn"
              style={{ minHeight: 44, marginTop: 4 }}
              onClick={startGame}
              
            >
              PLAY AGAIN
            </button>
          )}
        </>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 0' }}>
          <h2 className="game-title" style={{ color: 'var(--neon)' }}>🎯 RICOCHET</h2>
          <div className="result-box">
            <div className="result-title">ROUND OVER</div>
            <div className="result-stat">Targets Hit</div>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: 'var(--neon)', textShadow: '0 0 16px var(--neon)' }}>
              {score}
            </div>
            <div className="result-breakdown">Score × 50 = {score * 50} pts</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn"
              style={{ minHeight: 44 }}
              onClick={startGame}
              
            >
              PLAY AGAIN
            </button>
            <button
              className="btn btn-pink"
              style={{ minHeight: 44 }}
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

