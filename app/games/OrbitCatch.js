'use client';
import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const W = 260, H = 280;
const CX = W / 2, CY = H / 2;

const BASE_BASE_PLANETS = [{id:0,orbitR:50,speed:0.025,color:'#ff4466',size:8,catchR:22},{id:1,orbitR:85,speed:0.015,color:'#ffea00',size:10,catchR:26},{id:2,orbitR:118,speed:0.009,color:'#00ffcc',size:12,catchR:30}];

export default function OrbitCatch() {
  const { closeGame, reportScore } = useArcade();
  const [step, setStep] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [score, setScore] = useState(0);
  const [renderTick, setRenderTick] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const levelRef = useRef(1);
  const speedMultRef = useRef(1);

  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const animRef = useRef(null);

  // Planet angles
  const planetAnglesRef = useRef(BASE_PLANETS.map(() => Math.random() * Math.PI * 2));

  // Satellite state
  const satRef = useRef({
    attached: true,
    hostPlanetId: 0,
    orbitAngle: 0,    // angle around host planet
    x: 0, y: 0,
    vx: 0, vy: 0,
  });

  const startGame = () => {
    gameOverRef.current = false;
    scoreRef.current = 0;
    setScore(0); setLevel(1); setShowLevelUp(false); levelRef.current = 1; speedMultRef.current = 1;
    setIsGameOver(false);
    setGameStarted(true);
    setStep(0);

    // Reset planets and satellite
    planetAnglesRef.current = BASE_PLANETS.map((_, i) => (i * Math.PI * 2) / BASE_PLANETS.length);
    satRef.current = { attached: true, hostPlanetId: 0, orbitAngle: 0, x: 0, y: 0, vx: 0, vy: 0 };

    if (animRef.current) cancelAnimationFrame(animRef.current);

    setCountdown(3);
    let c = 3;
    const ci = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(ci);
        animRef.current = requestAnimationFrame(gameLoop);
      }
    }, 1000);
  };

  const handleGameOver = () => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    reportScore(scoreRef.current * 60);
    setIsGameOver(true);
    setTimeout(() => setStep(1), 1500);
  };

  const getPlanetPos = (planetIdx) => {
    const p = BASE_PLANETS[planetIdx];
    const angle = planetAnglesRef.current[planetIdx];
    return { x: CX + p.orbitR * Math.cos(angle), y: CY + p.orbitR * Math.sin(angle) };
  };

  const release = () => {
    if (!gameStarted || isGameOver || countdown > 0) return;
    const sat = satRef.current;
    if (!sat.attached) return; // already detached

    const hostId = sat.hostPlanetId;
    const hostPos = getPlanetPos(hostId);
    const hostPlanet = BASE_PLANETS[hostId];

    // Current satellite position
    const sx = hostPos.x + Math.cos(sat.orbitAngle) * (hostPlanet.size + 6);
    const sy = hostPos.y + Math.sin(sat.orbitAngle) * (hostPlanet.size + 6);

    // Tangential velocity (perpendicular to radius)
    const tangentAngle = sat.orbitAngle + Math.PI / 2;
    const speed = hostPlanet.speed * speedMultRef.current * hostPlanet.orbitR * 1.4; // proportional to orbital speed
    const vx = Math.cos(tangentAngle) * speed;
    const vy = Math.sin(tangentAngle) * speed;

    satRef.current = { ...sat, attached: false, x: sx, y: sy, vx, vy };
  };

  const gameLoop = () => {
    if (gameOverRef.current) return;

    // Update planet angles
    BASE_PLANETS.forEach((p, i) => { const actualSpeed = p.speed * speedMultRef.current;
      planetAnglesRef.current[i] += actualSpeed;
    });

    const sat = satRef.current;

    if (sat.attached) {
      // Orbit around host planet
      const hostPlanet = BASE_PLANETS[sat.hostPlanetId];
      satRef.current.orbitAngle += hostPlanet.speed * speedMultRef.current * 1.5;
      const hostPos = getPlanetPos(sat.hostPlanetId);
      satRef.current.x = hostPos.x + Math.cos(satRef.current.orbitAngle) * (hostPlanet.size + 6);
      satRef.current.y = hostPos.y + Math.sin(satRef.current.orbitAngle) * (hostPlanet.size + 6);
    } else {
      // Fly in straight line
      satRef.current.x += sat.vx;
      satRef.current.y += sat.vy;

      // Check if off-screen
      if (sat.x < -20 || sat.x > W + 20 || sat.y < -20 || sat.y > H + 20) {
        handleGameOver();
        return;
      }

      // Check attachment to any planet (excluding current host)
      for (let i = 0; i < BASE_PLANETS.length; i++) {
        if (i === sat.hostPlanetId) continue;
        const pPos = getPlanetPos(i);
        const dist = Math.hypot(sat.x - pPos.x, sat.y - pPos.y);
        if (dist < BASE_PLANETS[i].catchR) {
          // Attach!
          const angle = Math.atan2(sat.y - pPos.y, sat.x - pPos.x);
          satRef.current = {
            attached: true,
            hostPlanetId: i,
            orbitAngle: angle,
            x: sat.x,
            y: sat.y,
            vx: 0, vy: 0
          };
          scoreRef.current++;
          setScore(scoreRef.current);
          if (scoreRef.current % 5 === 0) {
            levelRef.current++;
            setLevel(levelRef.current);
            speedMultRef.current += 0.25;
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 1500);
          }
          break;
        }
      }
    }

    setRenderTick(t => t + 1);
    animRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); release(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameStarted, isGameOver, countdown]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // Build render snapshot
  const sat = satRef.current;
  const planetPositions = BASE_PLANETS.map((_, i) => getPlanetPos(i));

  return (
    <div>
      <h2 className="game-title">🪐 ORBIT CATCH</h2>
      <StepIndicator total={TOTAL_STEPS} current={step} />

      {step === 0 && (
        <div className="game-step" style={{ padding: '0 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="game-label">HOPS: {score}</span>
            <span className="game-label" style={{ color: isGameOver ? 'var(--neon-pink)' : 'var(--neon)' }}>
              {isGameOver ? 'LOST IN SPACE' : 'ORBITING'}
            </span>
          </div>

          <div
            onClick={release}
            onTouchStart={(e) => { e.preventDefault(); release(); }}
            style={{
              position: 'relative', width: W, height: H, margin: '0 auto',
              backgroundColor: '#020208',
              border: `1px solid ${isGameOver ? 'var(--neon-pink)' : '#00ffcc'}`,
              overflow: 'hidden',
              boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px #00ffcc inset',
              touchAction: 'none', cursor: 'crosshair'
            }}
          >
            {/* Star field dots */}
            {[...Array(25)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute', borderRadius: '50%',
                width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1,
                backgroundColor: '#fff', opacity: 0.3 + (i % 5) * 0.1,
                left: `${(i * 43 + 17) % 100}%`, top: `${(i * 71 + 31) % 100}%`
              }} />
            ))}

            {/* Start overlay */}
            {!gameStarted && !isGameOver && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <button className="btn btn-sm" style={{ borderColor: '#00ffcc', color: '#00ffcc' }} onClick={(e) => { e.stopPropagation(); startGame(); }}>LAUNCH</button>
              </div>
            )}

            {/* Countdown */}
            {gameStarted && countdown > 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <span style={{ color: '#00ffcc', fontSize: 48, fontWeight: 'bold', textShadow: '0 0 10px #00ffcc' }}>{countdown}</span>
              </div>
            )}

            {gameStarted && !isGameOver && countdown <= 0 && score === 0 && sat.attached && (<div style={{position:'absolute', top:20, width:'100%', textAlign:'center', color:'#00ffcc', fontSize:12, fontWeight:'bold', textShadow:'0 0 5px #00ffcc'}}>TAP TO LAUNCH TO NEXT ORBIT</div>)}
            {showLevelUp && (<div style={{position:'absolute', top:'40%', width:'100%', textAlign:'center', color:'#ffea00', fontSize:24, fontWeight:'bold', textShadow:'0 0 10px #ffea00', zIndex:30}}>LEVEL UP!<br/><span style={{fontSize:14}}>SPEED INCREASED</span></div>)}
            {/* Orbit rings */}
            {BASE_PLANETS.map((p) => (
              <div key={p.id} style={{
                position: 'absolute',
                left: CX - p.orbitR, top: CY - p.orbitR,
                width: p.orbitR * 2, height: p.orbitR * 2,
                borderRadius: '50%',
                border: `1px solid ${p.color}22`,
                boxSizing: 'border-box'
              }} />
            ))}

            {/* Star */}
            <div style={{
              position: 'absolute', left: CX - 8, top: CY - 8,
              width: 16, height: 16, borderRadius: '50%',
              backgroundColor: '#ffea00',
              boxShadow: '0 0 20px #ffea00, 0 0 40px #ffaa00'
            }} />

            {/* Planets */}
            {(gameStarted || isGameOver) && BASE_PLANETS.map((p, i) => (
              <div key={p.id} style={{
                position: 'absolute',
                left: planetPositions[i].x - p.size,
                top: planetPositions[i].y - p.size,
                width: p.size * 2, height: p.size * 2,
                borderRadius: '50%',
                backgroundColor: p.color,
                boxShadow: `0 0 10px ${p.color}`
              }} />
            ))}

            {/* Satellite */}
            {(gameStarted || isGameOver) && (
              <div style={{
                position: 'absolute',
                left: sat.x - 5, top: sat.y - 5,
                width: 10, height: 10,
                borderRadius: '50%',
                backgroundColor: '#fff',
                boxShadow: '0 0 8px #fff, 0 0 16px #aaf',
                zIndex: 5
              }} />
            )}

            {/* Game over overlay */}
            {isGameOver && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.4)', zIndex: 20 }}>
                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 22, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>ADRIFT</span>
              </div>
            )}
          </div>

          {gameStarted && !isGameOver && countdown <= 0 && (
            <p style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 8 }}>Tap or press SPACE to hop between planets</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="game-step">
          <div className="result-box">
            <div className="result-title">FLIGHT REPORT</div>
            <div className="result-stat">{score}</div>
            <p className="result-text">Successful Hops</p>
            <div className="result-breakdown" style={{ marginTop: 16 }}>
              Rating: {score < 5 ? 'Rookie Pilot' : score < 15 ? 'Cosmonaut' : 'Orbital Master'}<br />
              Status: LOST IN SPACE
            </div>
          </div>
          <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>FLY AGAIN</button>
          <button className="btn btn-pink" onClick={closeGame}>EXIT MACHINE</button>
        </div>
      )}
    </div>
  );
}
