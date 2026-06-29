'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;

// Recursive backtracker maze generation
function generateMaze(width, height) {
  const maze = Array.from({ length: height }, () => Array(width).fill(1)); // 1 = wall, 0 = path
  
  function carve(x, y) {
    maze[y][x] = 0;
    const dirs = [
      [0, -2], [2, 0], [0, 2], [-2, 0] // Up, Right, Down, Left
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < width && ny > 0 && ny < height && maze[ny][nx] === 1) {
        maze[y + dy / 2][x + dx / 2] = 0; // carve wall between
        carve(nx, ny);
      }
    }
  }

  // Ensure odd dimensions for proper wall/path grid
  carve(1, 1);
  
  // Start and End
  maze[1][1] = 0; // start
  maze[height - 2][width - 2] = 0; // goal
  
  return maze;
}

export default function NeonMaze() {
  const { closeGame, reportScore } = useArcade();
  const [step, setStep] = useState(0);

  const [level, setLevel] = useState(1);
  const [maze, setMaze] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const timerRef = useRef(null);
  
  const getMazeSize = (lvl) => {
    const size = 5 + (lvl - 1) * 4; // 5, 9, 13, 17, 21
    return { w: Math.min(size, 21), h: Math.min(size, 21) };
  };

  const getLevelTime = (lvl) => 15 + lvl * 10; // 25s, 35s, 45s, 55s, 65s

  const startLevel = useCallback((lvl) => {
    const size = getMazeSize(lvl);
    const newMaze = generateMaze(size.w, size.h);
    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
    setTimeLeft(getLevelTime(lvl));
  }, []);

  const startGame = useCallback(() => {
    gameOverRef.current = false;
    scoreRef.current = 0;
    levelRef.current = 1;
    setScore(0);
    setLevel(1);
    setIsGameOver(false);
    setGameStarted(false);
    setStep(0);
    startLevel(1);

    if (timerRef.current) clearInterval(timerRef.current);

    setCountdown(3);
    let c = 3;
    const ci = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(ci);
        setGameStarted(true);
        // Start game timer
        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) {
              clearInterval(timerRef.current);
              handleGameOver();
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [startLevel]);

  const handleGameOver = () => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    reportScore(scoreRef.current);
    setIsGameOver(true);
    setTimeout(() => setStep(1), 1500);
  };

  const move = useCallback((dx, dy) => {
    if (!gameStarted || isGameOver || countdown > 0) return;
    
    setPlayerPos(pos => {
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      
      // Check collision
      if (ny >= 0 && ny < maze.length && nx >= 0 && nx < maze[0].length && maze[ny][nx] === 0) {
        // Reached goal?
        if (nx === maze[0].length - 2 && ny === maze.length - 2) {
          // Level complete
          scoreRef.current += (levelRef.current * 100) + (timeLeft * 5);
          setScore(scoreRef.current);
          
          if (levelRef.current >= 5) {
            handleGameOver();
          } else {
            levelRef.current++;
            setLevel(levelRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            
            setGameStarted(false);
            setCountdown(2);
            let c = 2;
            const ci = setInterval(() => {
              c--;
              setCountdown(c);
              if (c <= 0) {
                clearInterval(ci);
                startLevel(levelRef.current);
                setGameStarted(true);
                timerRef.current = setInterval(() => {
                  setTimeLeft(t => {
                    if (t <= 1) {
                      clearInterval(timerRef.current);
                      handleGameOver();
                      return 0;
                    }
                    return t - 1;
                  });
                }, 1000);
              }
            }, 800);
          }
          return { x: nx, y: ny };
        }
        return { x: nx, y: ny };
      }
      return pos;
    });
  }, [gameStarted, isGameOver, countdown, maze, timeLeft, startLevel]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') move(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's') move(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') move(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') move(1, 0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Calculate cell size to fit 260x260
  const cols = maze[0]?.length || 5;
  const rows = maze.length || 5;
  const cellSize = Math.floor(260 / Math.max(cols, rows));
  const offset = (260 - (cols * cellSize)) / 2;

  // Touch swipe handling
  const touchStartRef = useRef(null);
  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) move(dx > 0 ? 1 : -1, 0);
    } else {
      if (Math.abs(dy) > 30) move(0, dy > 0 ? 1 : -1);
    }
    touchStartRef.current = null;
  };

  return (
    <div>
      <h2 className="game-title" style={{ color: '#00ffcc' }}>🧩 NEON MAZE</h2>
      <StepIndicator total={TOTAL_STEPS} current={step} />

      {step === 0 && (
        <div className="game-step" style={{ padding: '0 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="game-label">LVL {level}/5</span>
            <span className="game-label">TIME: {timeLeft}s</span>
            <span className="game-label" style={{ color: '#00ffcc' }}>SCORE: {score}</span>
          </div>

          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              position: 'relative', width: 260, height: 260, margin: '0 auto',
              backgroundColor: '#050508',
              border: `1px solid ${isGameOver ? 'var(--neon-pink)' : '#00ffcc'}`,
              overflow: 'hidden',
              boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px #00ffcc inset',
              touchAction: 'none'
            }}
          >
            {/* Start overlay */}
            {!gameStarted && !isGameOver && level === 1 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <button className="btn btn-sm" style={{ borderColor: '#00ffcc', color: '#00ffcc' }} onClick={(e) => { e.stopPropagation(); startGame(); }}>ENTER MAZE</button>
              </div>
            )}

            {/* Countdown */}
            {!gameStarted && countdown > 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <span style={{ color: '#00ffcc', fontSize: 48, fontWeight: 'bold', textShadow: '0 0 10px #00ffcc' }}>{countdown}</span>
              </div>
            )}

            {/* Maze Grid */}
            {(gameStarted || isGameOver) && maze.map((row, y) => (
              row.map((cell, x) => {
                if (cell === 1) { // Wall
                  return <div key={`${x}-${y}`} style={{
                    position: 'absolute',
                    left: offset + x * cellSize,
                    top: offset + y * cellSize,
                    width: cellSize + 1,
                    height: cellSize + 1,
                    backgroundColor: '#1a1a2e',
                    boxShadow: '0 0 5px #00ffff22 inset'
                  }} />
                }
                return null;
              })
            ))}

            {/* Goal */}
            {(gameStarted || isGameOver) && maze.length > 0 && (
              <div style={{
                position: 'absolute',
                left: offset + (cols - 2) * cellSize,
                top: offset + (rows - 2) * cellSize,
                width: cellSize,
                height: cellSize,
                backgroundColor: '#ffea00',
                boxShadow: '0 0 10px #ffea00',
                borderRadius: '2px',
                animation: 'pulse 1s infinite'
              }} />
            )}

            {/* Player */}
            {(gameStarted || isGameOver) && maze.length > 0 && (
              <div style={{
                position: 'absolute',
                left: offset + playerPos.x * cellSize + cellSize * 0.1,
                top: offset + playerPos.y * cellSize + cellSize * 0.1,
                width: cellSize * 0.8,
                height: cellSize * 0.8,
                backgroundColor: '#00ffcc',
                boxShadow: '0 0 10px #00ffcc',
                borderRadius: '50%',
                transition: 'left 0.1s, top 0.1s'
              }} />
            )}

            {/* Game over overlay */}
            {isGameOver && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.4)', zIndex: 20 }}>
                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 22, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>
                  {level >= 5 ? 'ESCAPED!' : 'TIME UP'}
                </span>
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 12 }}>
            Swipe or use arrow keys to navigate
          </div>
          
          {/* Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, width: 160, margin: '12px auto 0' }}>
            <div />
            <button className="btn" style={{ padding: '8px 0', borderColor: '#00ffcc', color: '#00ffcc' }} onClick={() => move(0, -1)} onTouchStart={(e) => { e.preventDefault(); move(0, -1); }}>▲</button>
            <div />
            <button className="btn" style={{ padding: '8px 0', borderColor: '#00ffcc', color: '#00ffcc' }} onClick={() => move(-1, 0)} onTouchStart={(e) => { e.preventDefault(); move(-1, 0); }}>◀</button>
            <button className="btn" style={{ padding: '8px 0', borderColor: '#00ffcc', color: '#00ffcc' }} onClick={() => move(0, 1)} onTouchStart={(e) => { e.preventDefault(); move(0, 1); }}>▼</button>
            <button className="btn" style={{ padding: '8px 0', borderColor: '#00ffcc', color: '#00ffcc' }} onClick={() => move(1, 0)} onTouchStart={(e) => { e.preventDefault(); move(1, 0); }}>▶</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="game-step">
          <div className="result-box">
            <div className="result-title">MAZE REPORT</div>
            <div className="result-stat">{score}</div>
            <p className="result-text">Total Points</p>
            <div className="result-breakdown" style={{ marginTop: 16 }}>
              Levels Cleared: {level > 5 ? 5 : level - 1}/5<br />
              Status: {level > 5 ? 'MASTER ESCAPIST' : 'LOST IN THE GRID'}
            </div>
          </div>
          <button className="btn" style={{ borderColor: '#00ffcc', color: '#00ffcc', marginBottom: 12 }} onClick={startGame}>PLAY AGAIN</button>
          <button className="btn btn-pink" onClick={closeGame}>EXIT MACHINE</button>
        </div>
      )}
    </div>
  );
}
