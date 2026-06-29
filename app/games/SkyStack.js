'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const CANVAS_W = 260;
const CANVAS_H = 300;
const PLATFORM_H = 16;
const BASE_PLATFORM_W = 80;
const INITIAL_Y_FROM_BOTTOM = 20;

export default function SkyStack() {
  const { closeGame, reportScore } = useArcade();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [perfectMsg, setPerfectMsg] = useState(false);

  const canvasRef = useRef(null);
  const scoreRef = useRef(0);
  const phaseRef = useRef('idle'); // idle, playing, gameover
  const rafRef = useRef(null);
  
  // Game state
  const stackRef = useRef([]);
  const movingRef = useRef(null);
  const cameraYRef = useRef(0);
  
  // Physics / Animation state
  const timeRef = useRef(0);
  const lastTimeRef = useRef(null);
  const droppingRef = useRef(false);
  const dropDataRef = useRef(null); // { x, y }
  const toppleIdxRef = useRef(-1);
  const toppleAngleRef = useRef(0);
  const toppleVYRef = useRef(0);

  const handleGameOver = useCallback(() => {
    if (phaseRef.current === 'gameover') return;
    phaseRef.current = 'gameover';
    
    const finalScore = scoreRef.current;
    setScore(finalScore);
    reportScore(finalScore * 40);

    setTimeout(() => {
      setStep(1);
    }, 1500);
  }, [reportScore]);

  const spawnPlatform = () => {
    const sc = scoreRef.current;
    const speed = 0.002 + Math.min(sc * 0.0001, 0.003); // Faster over time
    const amplitude = (CANVAS_W - BASE_PLATFORM_W) / 2;
    
    movingRef.current = {
      speed,
      amplitude,
      centerX: CANVAS_W / 2 - BASE_PLATFORM_W / 2
    };
  };

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setPerfectMsg(false);
    cameraYRef.current = 0;
    
    // Initial block
    stackRef.current = [{
      x: CANVAS_W / 2 - BASE_PLATFORM_W / 2,
      y: CANVAS_H - INITIAL_Y_FROM_BOTTOM - PLATFORM_H,
      toppleDir: 0
    }];
    
    toppleIdxRef.current = -1;
    toppleAngleRef.current = 0;
    toppleVYRef.current = 0;
    droppingRef.current = false;
    dropDataRef.current = null;
    
    spawnPlatform();
    phaseRef.current = 'playing';
    setStep(0);
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const dropPlatform = useCallback(() => {
    if (phaseRef.current !== 'playing' || droppingRef.current) return;
    droppingRef.current = true;
    
    // Freeze the current moving block's X position
    const sc = scoreRef.current;
    const m = movingRef.current;
    const x = m.centerX + Math.sin(timeRef.current * m.speed) * m.amplitude;
    
    // It spawns at the top of the visible screen (Y = 20)
    dropDataRef.current = { x, y: 20 };
  }, []);

  const gameLoop = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    if (phaseRef.current === 'playing') {
      timeRef.current += delta;
      
      if (droppingRef.current && dropDataRef.current) {
        // Fall down
        dropDataRef.current.y += 0.8 * delta; // drop speed
        
        const topBlock = stackRef.current[stackRef.current.length - 1];
        // The Y target is the top block's Y minus PLATFORM_H (and plus the camera offset)
        // Wait, stackRef y's are absolute world coordinates.
        // We drop it in screen coordinates? No, let's keep drop in world coords.
        
        // Actually, dropDataRef.y is currently in screen coords because it spawns at screen Y=20.
        // Let's convert its screen Y to world Y: worldY = screenY - cameraYRef.current
        const dropWorldY = dropDataRef.current.y - cameraYRef.current;
        const targetWorldY = topBlock.y - PLATFORM_H;
        
        if (dropWorldY >= targetWorldY) {
          // Landed!
          droppingRef.current = false;
          
          let landX = dropDataRef.current.x;
          let bonus = 0;
          
          // Check perfect drop
          if (Math.abs(landX - topBlock.x) < 5) {
            landX = topBlock.x; // snap
            bonus = 2;
            setPerfectMsg(true);
            setTimeout(() => setPerfectMsg(false), 800);
          }
          
          const newBlock = { x: landX, y: targetWorldY, toppleDir: 0 };
          stackRef.current.push(newBlock);
          
          scoreRef.current += 1 + bonus;
          setScore(scoreRef.current);
          
          // Check center of mass for physics toppling
          let toppleIdx = -1;
          let toppleDir = 0;
          let totalMass = 0;
          let comSum = 0;
          
          for (let i = stackRef.current.length - 1; i >= 1; i--) {
            totalMass += 1;
            comSum += stackRef.current[i].x + BASE_PLATFORM_W / 2;
            const comX = comSum / totalMass;
            
            const base = stackRef.current[i - 1];
            if (comX < base.x || comX > base.x + BASE_PLATFORM_W) {
              toppleIdx = i;
              toppleDir = comX < base.x ? -1 : 1;
              break;
            }
          }
          
          if (toppleIdx !== -1) {
            toppleIdxRef.current = toppleIdx;
            stackRef.current.forEach(p => p.toppleDir = toppleDir);
            handleGameOver();
            return;
          }
          
          // Camera scroll: if stack gets too high (world Y gets too small), increase camera offset
          // so that screen Y = worldY + cameraY moves down.
          const topScreenY = targetWorldY + cameraYRef.current;
          if (topScreenY < CANVAS_H * 0.5) {
            // Need to push the stack down visually. 
            // So we increase cameraYRef.current
            cameraYRef.current += (CANVAS_H * 0.5 - topScreenY);
          }
          
          dropDataRef.current = null;
          spawnPlatform();
        }
      }
    } else if (phaseRef.current === 'gameover' && toppleIdxRef.current !== -1) {
      // Topple animation
      const dt = delta / 1000;
      toppleAngleRef.current += 2 * dt;
      toppleVYRef.current += 400 * dt * dt;
      if (toppleAngleRef.current > Math.PI / 2) toppleAngleRef.current = Math.PI / 2;
    }

    render();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [handleGameOver]);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const cam = cameraYRef.current;
    
    // Draw stack
    stackRef.current.forEach((p, i) => {
      // world to screen
      const screenY = p.y + cam;
      if (screenY > CANVAS_H + PLATFORM_H || screenY < -PLATFORM_H) return;
      
      ctx.save();
      if (toppleIdxRef.current !== -1 && i >= toppleIdxRef.current) {
        const pivotBlock = stackRef.current[toppleIdxRef.current - 1];
        const pivotX = p.toppleDir > 0 ? pivotBlock.x + BASE_PLATFORM_W : pivotBlock.x;
        const pivotY = pivotBlock.y + cam;
        
        ctx.translate(pivotX, pivotY);
        ctx.rotate(toppleAngleRef.current * p.toppleDir);
        ctx.translate(-pivotX, -pivotY);
        ctx.translate(0, toppleVYRef.current);
      }
      
      const alpha = 0.4 + (i / stackRef.current.length) * 0.6;
      ctx.fillStyle = `rgba(0,255,136,${alpha * 0.7})`;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = i === stackRef.current.length - 1 ? 10 : 2;
      ctx.fillRect(p.x, screenY, BASE_PLATFORM_W, PLATFORM_H);
      
      ctx.fillStyle = `rgba(0,255,200,${alpha * 0.5})`;
      ctx.fillRect(p.x, screenY, BASE_PLATFORM_W, 2);
      ctx.restore();
    });
    
    // Draw moving/dropping platform
    if (phaseRef.current === 'playing') {
      let x, y;
      if (droppingRef.current && dropDataRef.current) {
        x = dropDataRef.current.x;
        y = dropDataRef.current.y;
      } else if (movingRef.current) {
        const m = movingRef.current;
        x = m.centerX + Math.sin(timeRef.current * m.speed) * m.amplitude;
        y = 20; // Fixed spawn height on screen
      }
      
      if (x !== undefined && y !== undefined) {
        ctx.fillStyle = 'rgba(0, 255, 225, 0.9)';
        ctx.shadowColor = '#00ffe1';
        ctx.shadowBlur = 15;
        ctx.fillRect(x, y, BASE_PLATFORM_W, PLATFORM_H);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, BASE_PLATFORM_W, 2);
        ctx.shadowBlur = 0;
      }
    }
  };

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);
  
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        dropPlatform();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dropPlatform]);

  return (
    <div>
      <h2 className="game-title" style={{ color: '#00ff88' }}>🏗️ SKY STACK</h2>
      <StepIndicator total={TOTAL_STEPS} current={step} />

      {step === 0 && (
        <div className="game-step" style={{ padding: '0 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="game-label" style={{ color: '#00ff88' }}>SCORE: {score}</span>
          </div>

          <div 
            style={{ position: 'relative' }}
            onPointerDown={dropPlatform}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                display: 'block',
                margin: '0 auto',
                backgroundColor: '#020305',
                border: `1px solid ${phaseRef.current === 'gameover' ? 'var(--neon-pink)' : '#00ff88'}`,
                boxShadow: phaseRef.current === 'gameover' ? '0 0 15px var(--neon-pink) inset' : '0 0 10px #00ff88 inset',
                cursor: 'crosshair',
                touchAction: 'none'
              }}
            />

            {phaseRef.current === 'idle' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <button className="btn btn-sm" style={{ borderColor: '#00ff88', color: '#00ff88' }} onClick={(e) => { e.stopPropagation(); startGame(); }}>START STACK</button>
              </div>
            )}

            {perfectMsg && (
              <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', animation: 'fade-slide-up 0.8s forwards' }}>
                <span style={{ color: '#fff', textShadow: '0 0 10px #00ff88', fontWeight: 'bold', fontSize: 18, fontStyle: 'italic' }}>PERFECT!</span>
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 12 }}>
            Tap anywhere to drop the platform
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="game-step">
          <div className="result-box">
            <div className="result-title">CONSTRUCTION ENDED</div>
            <div className="result-stat">{score}</div>
            <p className="result-text">Floors Built</p>
          </div>
          <button className="btn" style={{ borderColor: '#00ff88', color: '#00ff88', marginBottom: 12 }} onClick={startGame}>BUILD AGAIN</button>
          <button className="btn btn-pink" onClick={closeGame}>EXIT MACHINE</button>
        </div>
      )}
    </div>
  );
}
