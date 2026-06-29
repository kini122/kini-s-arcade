'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const LANES = 4;
const GAME_W = 260;
const GAME_H = 300;
const TILE_W = GAME_W / LANES; // 65px
const TILE_H = 50;
const PLAYER_SIZE = 28;
const PLAYER_Y = GAME_H - 70;
const SPAWN_INTERVAL = 90; // px between tile rows
const TOTAL_STEPS = 2;

export default function VoltDash() {
  const { closeGame, reportScore } = useArcade();

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | countdown | playing | gameover
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [displayLane, setDisplayLane] = useState(1);

  const canvasRef = useRef(null);
  const phaseRef = useRef('idle');
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const currentLaneRef = useRef(1);
  const tilesRef = useRef([]);
  const speedRef = useRef(1.5);
  const tilePassedCountRef = useRef(0);
  const nextSpawnYRef = useRef(0); // next y position to spawn tiles at
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  // ── helpers ────────────────────────────────────────────────────────────────
  function spawnRow(yPos) {
    // 1-2 dead lanes per row
    const deadCount = Math.random() < 0.5 ? 1 : 2;
    const deadLanes = new Set();
    while (deadLanes.size < deadCount) {
      deadLanes.add(Math.floor(Math.random() * LANES));
    }
    const row = [];
    for (let lane = 0; lane < LANES; lane++) {
      row.push({ lane, y: yPos, alive: !deadLanes.has(lane) });
    }
    return row;
  }

  function initTiles() {
    const tiles = [];
    // Pre-populate screen with rows from top
    for (let y = -TILE_H; y <= GAME_H + TILE_H; y += SPAWN_INTERVAL) {
      tiles.push(...spawnRow(y));
    }
    tilesRef.current = tiles;
    nextSpawnYRef.current = -TILE_H - SPAWN_INTERVAL;
  }

  // ── draw ───────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, GAME_W, GAME_H);

    // Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Lane dividers
    ctx.strokeStyle = 'rgba(0,255,136,0.12)';
    ctx.lineWidth = 1;
    for (let l = 1; l < LANES; l++) {
      ctx.beginPath();
      ctx.moveTo(l * TILE_W, 0);
      ctx.lineTo(l * TILE_W, GAME_H);
      ctx.stroke();
    }

    // Draw tiles
    for (const tile of tilesRef.current) {
      const x = tile.lane * TILE_W;
      const y = tile.y;
      if (y > GAME_H + TILE_H || y < -TILE_H * 2) continue;

      if (tile.alive) {
        // Glowing tile
        ctx.fillStyle = '#0a2010';
        ctx.fillRect(x + 2, y + 2, TILE_W - 4, TILE_H - 4);

        // Glow border
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE_W - 6, TILE_H - 6);
        ctx.shadowBlur = 0;

        // Inner glow bar
        ctx.fillStyle = 'rgba(0,255,136,0.15)';
        ctx.fillRect(x + 6, y + TILE_H / 2 - 3, TILE_W - 12, 6);
      } else {
        // Dead tile
        ctx.fillStyle = '#181820';
        ctx.fillRect(x + 2, y + 2, TILE_W - 4, TILE_H - 4);

        ctx.strokeStyle = '#333340';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, TILE_W - 6, TILE_H - 6);

        // Crack pattern
        ctx.strokeStyle = '#ff004488';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const cx = x + TILE_W / 2;
        const cy = y + TILE_H / 2;
        ctx.moveTo(cx - 10, cy - 8);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + 8, cy - 10);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 6, cy + 10);
        ctx.stroke();
      }
    }

    // Player
    const px = currentLaneRef.current * TILE_W + TILE_W / 2 - PLAYER_SIZE / 2;
    const py = PLAYER_Y;

    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffea00';
    ctx.fillRect(px, py, PLAYER_SIZE, PLAYER_SIZE);

    // Player inner detail
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff7aa';
    ctx.fillRect(px + 6, py + 4, 8, 8);
    ctx.fillRect(px + 16, py + 16, 6, 6);

    // Score overlay
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`TILES: ${scoreRef.current}`, 6, 18);

    // Speed indicator
    ctx.fillStyle = 'rgba(0,255,136,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText(`SPD ${speedRef.current.toFixed(1)}`, GAME_W - 60, 18);
  }, []);

  // ── game loop ──────────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp) => {
    if (gameOverRef.current) return;

    if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
    lastTimeRef.current = timestamp;

    const speed = speedRef.current;
    const tiles = tilesRef.current;

    // Move tiles downward
    for (const tile of tiles) {
      tile.y += speed;
    }

    // Spawn new rows at top when needed
    if (tiles.length === 0 || (nextSpawnYRef.current + speed) > -TILE_H) {
      nextSpawnYRef.current += speed;
      if (nextSpawnYRef.current >= -TILE_H) {
        nextSpawnYRef.current = -TILE_H - SPAWN_INTERVAL;
        tiles.push(...spawnRow(-TILE_H));
      }
    } else {
      nextSpawnYRef.current += speed;
    }

    // Remove tiles that scrolled off bottom
    tilesRef.current = tiles.filter(t => t.y < GAME_H + TILE_H);

    // Check collision: dead tile overlapping player
    const playerLane = currentLaneRef.current;
    for (const tile of tilesRef.current) {
      if (
        tile.lane === playerLane &&
        !tile.alive &&
        tile.y + TILE_H > PLAYER_Y + 4 &&
        tile.y < PLAYER_Y + PLAYER_SIZE - 4
      ) {
        handleGameOver();
        return;
      }
    }

    // Count tiles that have passed the player (bottom of tile goes past player bottom)
    const newPassed = tilesRef.current.filter(t => t.alive && t.y > PLAYER_Y + PLAYER_SIZE).length;
    // Count by checking tiles scrolling off
    const justPassed = tilesRef.current.filter(t => t.y >= GAME_H && t.y < GAME_H + speed + 2 && t.alive).length;
    if (justPassed > 0) {
      scoreRef.current += justPassed;
      tilePassedCountRef.current += justPassed;
      setScore(scoreRef.current);
      // Speed up every 10 tiles
      speedRef.current = 1.5 + Math.floor(tilePassedCountRef.current / 10) * 0.05;
    }

    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw]);

  // ── game over ──────────────────────────────────────────────────────────────
  function handleGameOver() {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    reportScore(scoreRef.current * 5);
    setPhase('gameover');
    phaseRef.current = 'gameover';

    // Draw game over overlay
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255,0,85,0.4)';
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_W / 2, GAME_H / 2 - 10);
      ctx.fillStyle = '#ff4466';
      ctx.font = '14px monospace';
      ctx.fillText(`${scoreRef.current} tiles passed`, GAME_W / 2, GAME_H / 2 + 18);
      ctx.textAlign = 'left';
    }

    setTimeout(() => setStep(1), 1400);
  }

  // ── start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    gameOverRef.current = false;
    scoreRef.current = 0;
    tilePassedCountRef.current = 0;
    speedRef.current = 1.5;
    currentLaneRef.current = 1;
    lastTimeRef.current = null;
    setScore(0);
    setDisplayLane(1);
    setPhase('countdown');
    phaseRef.current = 'countdown';
    setCountdown(3);
    setStep(0);
    initTiles();
  }, []);

  // ── countdown effect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) {
      setPhase('playing');
      phaseRef.current = 'playing';
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Start RAF when playing
  useEffect(() => {
    if (phase === 'playing') {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (phase !== 'playing' && rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [phase, gameLoop]);

  // Draw idle state
  useEffect(() => {
    if (phase === 'idle') draw();
  }, [phase, draw]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gameOverRef.current = true;
    };
  }, []);

  // ── lane switch ────────────────────────────────────────────────────────────
  const moveLeft = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (phaseRef.current !== 'playing') return;
    currentLaneRef.current = Math.max(0, currentLaneRef.current - 1);
    setDisplayLane(currentLaneRef.current);
  }, []);

  const moveRight = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (phaseRef.current !== 'playing') return;
    currentLaneRef.current = Math.min(LANES - 1, currentLaneRef.current + 1);
    setDisplayLane(currentLaneRef.current);
  }, []);

  // ── keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') moveLeft(null);
      if (e.key === 'ArrowRight') moveRight(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [moveLeft, moveRight]);

  // ── canvas touch (split screen left/right) ─────────────────────────────────
  const handleCanvasTouch = useCallback((e) => {
    e.preventDefault();
    if (phaseRef.current !== 'playing') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const relX = touch.clientX - rect.left;
    if (relX < GAME_W / 2) {
      moveLeft(null);
    } else {
      moveRight(null);
    }
  }, [moveLeft, moveRight]);

  const handleCanvasClick = useCallback((e) => {
    if (phaseRef.current !== 'playing') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    if (relX < GAME_W / 2) {
      moveLeft(null);
    } else {
      moveRight(null);
    }
  }, [moveLeft, moveRight]);

  return (
    <div className="game-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, userSelect: 'none' }}>
      <StepIndicator total={TOTAL_STEPS} current={step} />

      {step === 0 && (
        <>
          <h2 className="game-title" style={{ color: '#ffea00', marginBottom: 2 }}>⚡ VOLT DASH</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 2 }}>
            <span className="game-label">TILES: <b style={{ color: '#ffea00' }}>{score}</b></span>
            <span className="game-label">SPEED: <b style={{ color: '#00ff88' }}>{speedRef.current.toFixed(1)}</b></span>
          </div>

          {/* Game canvas */}
          <div style={{ position: 'relative', touchAction: 'none' }}>
            <canvas
              ref={canvasRef}
              width={GAME_W}
              height={GAME_H}
              style={{
                display: 'block',
                border: '1px solid #ffea00',
                boxShadow: '0 0 10px #ffea00 inset',
                borderRadius: 6,
                cursor: phase === 'playing' ? 'pointer' : 'default',
                touchAction: 'none',
              }}
              onClick={handleCanvasClick}
              onTouchStart={handleCanvasTouch}
            />

            {/* START overlay */}
            {phase === 'idle' && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.88)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, gap: 12,
              }}>
                <p style={{ color: '#ffea00', fontSize: 13, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                  Avoid DEAD tiles (dark + cracks)<br />
                  Tap left/right to switch lanes<br />
                  <span style={{ color: '#00ff88', fontSize: 11 }}>← → keys also work</span>
                </p>
                <button
                  className="btn"
                  style={{ minHeight: 44 }}
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
                position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.88)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6,
              }}>
                <span style={{ fontSize: 72, color: '#ffea00', fontWeight: 900, textShadow: '0 0 30px #ffea00' }}>
                  {countdown === 0 ? 'GO!' : countdown}
                </span>
              </div>
            )}
          </div>

          {/* Lane control buttons */}
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <button
              className="btn"
              style={{ minHeight: 44, minWidth: 80, fontSize: 22 }}
              onClick={moveLeft}
              onTouchStart={moveLeft}
            >
              ◀
            </button>
            <button
              className="btn"
              style={{ minHeight: 44, minWidth: 80, fontSize: 22 }}
              onClick={moveRight}
              onTouchStart={moveRight}
            >
              ▶
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, margin: 0 }}>
            Tap canvas halves or ← → keys to switch lanes
          </p>
        </>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 16 }}>
          <h2 className="game-title" style={{ color: '#ffea00' }}>⚡ VOLT DASH</h2>
          <div className="result-box">
            <div className="result-title">RUN COMPLETE</div>
            <div className="result-stat">{score}</div>
            <div className="result-text">tiles survived</div>
            <div className="result-breakdown">
              Final Score: <b style={{ color: '#ffea00' }}>{score * 5}</b>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn"
              style={{ minHeight: 44 }}
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

