'use client';
import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const W = 260, H = 300;
const CROWD_Y = 240;
const TOTAL_GATES = 8;
const TOTAL_ROUNDS = 5;

const GATE_POOL = [
  { label: '+5', effect: c => c + 5 },
  { label: '+10', effect: c => c + 10 },
  { label: '-3', effect: c => Math.max(0, c - 3) },
  { label: '×2', effect: c => c * 2 },
  { label: '÷2', effect: c => Math.max(1, Math.floor(c / 2)) },
];

function randomGates(round) {
  // 2-3 gates side by side, at least one good option in early rounds
  const count = round < 3 ? 2 : 3;
  const shuffled = [...GATE_POOL].sort(() => Math.random() - 0.5).slice(0, count);
  const width = W / count;
  return shuffled.map((g, i) => ({
    ...g,
    x: i * width,
    w: width,
    id: Math.random()
  }));
}

export default function CrowdSurge() {
  const { closeGame, reportScore } = useArcade();
  const [step, setStep] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [crowdCount, setCrowdCount] = useState(10);
  const [round, setRound] = useState(1);
  const [gatesPassed, setGatesPassed] = useState(0);
  const [score, setScore] = useState(0);
  const [showRoundComplete, setShowRoundComplete] = useState(false);

  // Gate visual state
  const [currentGates, setCurrentGates] = useState([]);
  const [gateY, setGateY] = useState(-60);
  const [crowdX, setCrowdX] = useState(W / 2);
  const [targetX, setTargetX] = useState(W / 2);
  const [lastGateLabel, setLastGateLabel] = useState('');

  const crowdCountRef = useRef(10);
  const roundRef = useRef(1);
  const gatePassedRef = useRef(0);
  const gateYRef = useRef(-60);
  const crowdXRef = useRef(W / 2);
  const targetXRef = useRef(W / 2);
  const currentGatesRef = useRef([]);
  const gameOverRef = useRef(false);
  const speedRef = useRef(2);
  const animRef = useRef(null);
  const gateActiveRef = useRef(false); // gate currently on screen

  const doStartGame = () => {
    crowdCountRef.current = 10;
    roundRef.current = 1;
    gatePassedRef.current = 0;
    gameOverRef.current = false;
    gateActiveRef.current = false;
    speedRef.current = 2;
    crowdXRef.current = W / 2;
    targetXRef.current = W / 2;
    setCrowdCount(10);
    setRound(1);
    setGatesPassed(0);
    setScore(10);
    setShowRoundComplete(false);
    setIsGameOver(false);
    setCrowdX(W / 2);
    setTargetX(W / 2);
    setCurrentGates([]);
    gateYRef.current = -60;
    setGateY(-60);
    setLastGateLabel('');

    setCountdown(3);
    let c = 3;
    const ci = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(ci);
        spawnGate();
        animRef.current = requestAnimationFrame(gameLoop);
      }
    }, 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    setStep(0);
    doStartGame();
  };

  const handleGameOver = (final) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    reportScore(final * 20);
    setScore(final);
    setCrowdCount(final);
    setIsGameOver(true);
    setTimeout(() => setStep(1), 1500);
  };

  const spawnGate = () => {
    if (gameOverRef.current) return;
    const gates = randomGates(roundRef.current);
    currentGatesRef.current = gates;
    setCurrentGates(gates);
    gateYRef.current = -60;
    setGateY(-60);
    gateActiveRef.current = true;
  };

  const gameLoop = () => {
    if (gameOverRef.current) return;

    // Smoothly move crowd toward target
    crowdXRef.current += (targetXRef.current - crowdXRef.current) * 0.1;
    setCrowdX(crowdXRef.current);

    if (gateActiveRef.current) {
      gateYRef.current += speedRef.current;
      setGateY(gateYRef.current);

      // Check collision when gate reaches crowd
      if (gateYRef.current + 60 >= CROWD_Y && gateYRef.current <= CROWD_Y + 30) {
        // Find which gate the crowd is over
        const cx = crowdXRef.current;
        let hit = null;
        for (const g of currentGatesRef.current) {
          if (cx >= g.x && cx <= g.x + g.w) { hit = g; break; }
        }
        if (hit) {
          gateActiveRef.current = false;
          setCurrentGates([]);
          const newCount = hit.effect(crowdCountRef.current);
          crowdCountRef.current = newCount;
          setCrowdCount(newCount);
          setLastGateLabel(hit.label);
          gatePassedRef.current++;
          setGatesPassed(gatePassedRef.current);

          if (newCount <= 0) {
            handleGameOver(0);
            return;
          }

          if (gatePassedRef.current >= TOTAL_GATES) {
            // Round complete
            if (roundRef.current >= TOTAL_ROUNDS) {
              handleGameOver(crowdCountRef.current);
              return;
            }
            roundRef.current++;
            setRound(roundRef.current);
            gatePassedRef.current = 0;
            setGatesPassed(0);
            speedRef.current += 0.5;
            setShowRoundComplete(true);
            if (animRef.current) cancelAnimationFrame(animRef.current);
            return;
          }

          // Spawn next gate after a delay
          setTimeout(() => {
            if (!gameOverRef.current) {
              spawnGate();
            }
          }, 800);
        }
      }

      // Gate scrolled off bottom
      if (gateYRef.current > H + 20) {
        gateActiveRef.current = false;
        setCurrentGates([]);
        // Missed gate — no penalty, spawn next
        setTimeout(() => {
          if (!gameOverRef.current) spawnGate();
        }, 400);
      }
    }

    animRef.current = requestAnimationFrame(gameLoop);
  };

  const steer = (dir) => {
    if (!gameStarted || isGameOver || countdown > 0) return;
    const step = 50;
    targetXRef.current = Math.max(20, Math.min(W - 20, targetXRef.current + (dir === 'left' ? -step : step)));
    setTargetX(targetXRef.current);
  };

  const handleCanvasTap = (e) => {
    if (!gameStarted || isGameOver || countdown > 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    if (x < W / 2) steer('left');
    else steer('right');
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') steer('left');
      if (e.key === 'ArrowRight' || e.key === 'd') steer('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameStarted, isGameOver, countdown]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // Crowd dot positions (cap visual at 30)
  const dotCount = Math.min(crowdCount, 30);
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const angle = (i / dotCount) * Math.PI * 2;
    const r = Math.min(5 + dotCount * 0.4, 20);
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  });

  return (
    <div>
      <h2 className="game-title">🔥 CROWD SURGE</h2>
      <StepIndicator total={TOTAL_STEPS} current={step} />

      {step === 0 && (
        <div className="game-step" style={{ padding: '0 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="game-label">CROWD: {crowdCount}</span>
            <span className="game-label">ROUND {round}/{TOTAL_ROUNDS} — GATE {Math.min(gatesPassed, TOTAL_GATES)}/{TOTAL_GATES}</span>
          </div>

          <div
            onClick={handleCanvasTap}
            onTouchStart={(e) => { e.preventDefault(); handleCanvasTap(e); }}
            style={{
              position: 'relative', width: W, height: H, margin: '0 auto',
              backgroundColor: '#050508',
              border: `1px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
              overflow: 'hidden',
              boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px var(--neon) inset',
              touchAction: 'none'
            }}
          >
            {/* Road stripes */}
            {[0.25, 0.5, 0.75].map((x, i) => (
              <div key={i} style={{ position: 'absolute', left: W * x - 1, top: 0, width: 2, height: '100%', backgroundColor: '#1a1a1a', borderRight: '1px dashed #333' }} />
            ))}

            {/* Start overlay */}
            {!gameStarted && !isGameOver && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); startGame(); }}>SURGE!</button>
              </div>
            )}

            {/* Countdown */}
            {gameStarted && countdown > 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <span style={{ color: 'var(--neon)', fontSize: 48, fontWeight: 'bold', textShadow: '0 0 10px var(--neon)' }}>{countdown}</span>
              </div>
            )}

            {/* Round complete overlay */}
            {showRoundComplete && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <div style={{ color: '#ffea00', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>ROUND {round - 1} CLEAR!</div>
                <div style={{ color: '#aaa', fontSize: 14, marginBottom: 16 }}>Crowd: {crowdCount}</div>
                <button className="btn btn-sm" onClick={(e) => {
                  e.stopPropagation();
                  setShowRoundComplete(false);
                  gatePassedRef.current = 0;
                  setTimeout(() => {
                    spawnGate();
                    animRef.current = requestAnimationFrame(gameLoop);
                  }, 500);
                }}>NEXT ROUND ▶</button>
              </div>
            )}

            {/* Gates */}
            {currentGates.map((g) => (
              <div key={g.id} style={{
                position: 'absolute', left: g.x, top: gateY,
                width: g.w - 4, height: 50, margin: 2,
                border: `2px solid ${g.label.startsWith('+') || g.label === '×2' ? '#00ff88' : g.label === '÷2' ? '#ffea00' : '#ff4466'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 'bold', fontSize: 18,
                backgroundColor: 'rgba(0,0,0,0.5)',
                boxShadow: g.label.startsWith('+') || g.label === '×2' ? '0 0 10px #00ff88' : g.label === '÷2' ? '0 0 10px #ffea00' : '0 0 10px #ff4466'
              }}>{g.label}</div>
            ))}

            {/* Gate label flash */}
            {lastGateLabel && !gateActiveRef.current && (
              <div style={{ position: 'absolute', top: CROWD_Y - 30, left: '50%', transform: 'translateX(-50%)', color: '#ffea00', fontWeight: 'bold', fontSize: 20, textShadow: '0 0 10px #ffea00' }}>{lastGateLabel}</div>
            )}

            {/* Crowd */}
            {gameStarted && (
              <div style={{ position: 'absolute', left: crowdX, top: CROWD_Y, transform: 'translate(-50%, -50%)' }}>
                {dots.map((d, i) => (
                  <div key={i} style={{
                    position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: `hsl(${(i * 37) % 360}, 100%, 65%)`,
                    left: d.x, top: d.y, transform: 'translate(-50%,-50%)'
                  }} />
                ))}
                <div style={{ position: 'absolute', left: '50%', top: -20, transform: 'translateX(-50%)', color: '#fff', fontSize: 12, fontWeight: 'bold', whiteSpace: 'nowrap' }}>{crowdCount}</div>
              </div>
            )}

            {/* Game over overlay */}
            {isGameOver && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.4)', zIndex: 20 }}>
                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 22, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>
                  {crowdCount <= 0 ? 'CROWD GONE' : 'FINISHED!'}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          {gameStarted && !isGameOver && countdown <= 0 && !showRoundComplete && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn" style={{ flex: 1, padding: '14px 0' }}
                onMouseDown={() => steer('left')} onTouchStart={(e) => { e.preventDefault(); steer('left'); }}>◀ LEFT</button>
              <button className="btn" style={{ flex: 1, padding: '14px 0' }}
                onMouseDown={() => steer('right')} onTouchStart={(e) => { e.preventDefault(); steer('right'); }}>RIGHT ▶</button>
            </div>
          )}
          {gameStarted && !isGameOver && countdown <= 0 && (
            <p style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 6 }}>Tap left/right or use A/D to steer</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="game-step">
          <div className="result-box">
            <div className="result-title">SURGE REPORT</div>
            <div className="result-stat">{score}</div>
            <p className="result-text">Crowd Remaining</p>
            <div className="result-breakdown" style={{ marginTop: 16 }}>
              Rounds cleared: {Math.max(0, round - 1)}/{TOTAL_ROUNDS}<br />
              Status: {score > 30 ? 'UNSTOPPABLE' : score > 10 ? 'SURVIVED' : 'CRUSHED'}
            </div>
          </div>
          <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>PLAY AGAIN</button>
          <button className="btn btn-pink" onClick={closeGame}>EXIT MACHINE</button>
        </div>
      )}
    </div>
  );
}
