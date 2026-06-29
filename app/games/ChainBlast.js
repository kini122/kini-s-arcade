'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const COLS = 7;
const ROWS = 7;
const CELL_SIZE = 36;
const COLORS = ['red', 'orange', 'yellow', 'green', 'cyan'];
const TOTAL_ROUNDS = 5;
const BLASTS_PER_ROUND = 5;
const TOTAL_STEPS = 2;

const COLOR_NEON = {
  red: '#ff0055',
  orange: '#ff6600',
  yellow: '#ffea00',
  green: '#00ff88',
  cyan: '#00ffcc',
};

let nextId = 1;

function randomColor(round) {
  const count = round === 1 ? 3 : (round === 2 ? 4 : 5);
  return COLORS[Math.floor(Math.random() * count)];
}

function makeGrid(round = 1) {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ id: nextId++, color: randomColor(round) }))
  );
}

function getMultiplier(chainSize) {
  if (chainSize >= 15) return 4;
  if (chainSize >= 10) return 3;
  if (chainSize >= 5) return 2;
  return 1;
}

function floodFill(grid, startR, startC) {
  const target = grid[startR][startC];
  if (!target || !target.color) return [];
  const targetColor = target.color;
  
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const queue = [[startR, startC]];
  visited[startR][startC] = true;
  const result = [];
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    result.push([r, c]);
    const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc]) {
        if (grid[nr][nc] && grid[nr][nc].color === targetColor) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
  }
  return result;
}

function applyGravity(grid, round) {
  const newGrid = grid.map(row => [...row]);
  for (let c = 0; c < COLS; c++) {
    const cells = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newGrid[r][c] !== null) cells.push(newGrid[r][c]);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      if (cells.length > 0) {
        newGrid[r][c] = cells.shift();
      } else {
        newGrid[r][c] = { id: nextId++, color: randomColor(round) };
      }
    }
  }
  return newGrid;
}

export default function ChainBlast() {
  const { closeGame, reportScore } = useArcade();
  const [step, setStep] = useState(0);

  const [grid, setGrid] = useState(() => makeGrid(1));
  const [poppingIds, setPoppingIds] = useState(new Set()); 
  const [blastsLeft, setBlastsLeft] = useState(BLASTS_PER_ROUND);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScore, setRoundScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScores, setRoundScores] = useState([]);
  const [lastChain, setLastChain] = useState(null);
  const [gamePhase, setGamePhase] = useState('idle');
  const [isAnimating, setIsAnimating] = useState(false);

  const gridRef = useRef(makeGrid(1));
  const blastsRef = useRef(BLASTS_PER_ROUND);
  const roundRef = useRef(1);
  const roundScoreRef = useRef(0);
  const totalScoreRef = useRef(0);
  const roundScoresRef = useRef([]);
  const gameOverRef = useRef(false);
  const phaseRef = useRef('idle');
  const animTimeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(animTimeoutRef.current);
  }, []);

  const handleGameOver = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    phaseRef.current = 'over';
    reportScore(totalScoreRef.current * 5);
    setGamePhase('over');
    setTimeout(() => {
      setTotalScore(totalScoreRef.current);
      setStep(1);
    }, 600);
  }, [reportScore]);

  const startNextRound = useCallback(() => {
    if (roundRef.current >= TOTAL_ROUNDS) {
      handleGameOver();
      return;
    }
    roundRef.current += 1;
    roundScoreRef.current = 0;
    blastsRef.current = BLASTS_PER_ROUND;
    const newGrid = makeGrid(roundRef.current);
    gridRef.current = newGrid;
    setGrid(newGrid.map(r => [...r]));
    setCurrentRound(roundRef.current);
    setRoundScore(0);
    setBlastsLeft(BLASTS_PER_ROUND);
    setLastChain(null);
    setGamePhase('playing');
    phaseRef.current = 'playing';
  }, [handleGameOver]);

  const endRound = useCallback(() => {
    phaseRef.current = 'roundEnd';
    setGamePhase('roundEnd');
    totalScoreRef.current += roundScoreRef.current;
    roundScoresRef.current = [...roundScoresRef.current, roundScoreRef.current];
    setTotalScore(totalScoreRef.current);
    setRoundScores([...roundScoresRef.current]);
  }, []);

  const handleCellTap = useCallback((row, col, e) => {
    if (e && e.type === 'touchstart') e.preventDefault();
    if (phaseRef.current !== 'playing' || isAnimating || blastsRef.current <= 0 || gameOverRef.current) return;

    const cell = gridRef.current[row][col];
    if (!cell) return;

    const chain = floodFill(gridRef.current, row, col);
    if (chain.length === 0) return;

    const chainSize = chain.length;
    const multiplier = getMultiplier(chainSize);
    const points = chainSize * multiplier;

    const poppingSet = new Set(chain.map(([r, c]) => gridRef.current[r][c].id));
    setPoppingIds(poppingSet);
    setIsAnimating(true);
    setLastChain({ size: chainSize, multiplier, points });

    animTimeoutRef.current = setTimeout(() => {
      const newGrid = gridRef.current.map(r => [...r]);
      for (const [r, c] of chain) {
        newGrid[r][c] = null;
      }
      const gravGrid = applyGravity(newGrid, roundRef.current);
      gridRef.current = gravGrid;
      setGrid(gravGrid.map(r => [...r]));
      setPoppingIds(new Set());
      setIsAnimating(false);

      roundScoreRef.current += points;
      setRoundScore(roundScoreRef.current);
      blastsRef.current -= 1;
      setBlastsLeft(blastsRef.current);

      if (blastsRef.current <= 0) {
        endRound();
      }
    }, 250); // faster pop animation
  }, [isAnimating, endRound]);

  const startGame = useCallback(() => {
    gameOverRef.current = false;
    phaseRef.current = 'playing';
    roundRef.current = 1;
    roundScoreRef.current = 0;
    totalScoreRef.current = 0;
    blastsRef.current = BLASTS_PER_ROUND;
    roundScoresRef.current = [];
    const newGrid = makeGrid(1);
    gridRef.current = newGrid;
    setGrid(newGrid.map(r => [...r]));
    setBlastsLeft(BLASTS_PER_ROUND);
    setCurrentRound(1);
    setRoundScore(0);
    setTotalScore(0);
    setRoundScores([]);
    setLastChain(null);
    setPoppingIds(new Set());
    setStep(0);
    setGamePhase('playing');
    setIsAnimating(false);
    clearTimeout(animTimeoutRef.current);
  }, []);

  const gridWidth = COLS * CELL_SIZE + (COLS - 1) * 3 + 12;
  const gridHeight = ROWS * CELL_SIZE + (ROWS - 1) * 3 + 12;

  const renderGrid = () => {
    const elements = [];
    
    // Render static empty slots
    for (let r=0; r<ROWS; r++) {
      for (let c=0; c<COLS; c++) {
        elements.push(
          <div key={`empty-${r}-${c}`} style={{
            position: 'absolute',
            top: 6 + r * (CELL_SIZE + 3),
            left: 6 + c * (CELL_SIZE + 3),
            width: CELL_SIZE, height: CELL_SIZE,
            backgroundColor: '#0a0a14',
            border: '1px solid #1a1a2e',
            borderRadius: '50%',
            boxSizing: 'border-box'
          }} />
        );
      }
    }

    // Render bubbles
    grid.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (!cell) return;
        const isPopping = poppingIds.has(cell.id);
        const bg = isPopping ? '#ffffff' : COLOR_NEON[cell.color];
        const border = `1px solid ${isPopping ? '#fff' : COLOR_NEON[cell.color]}`;
        const boxShadow = isPopping ? `0 0 20px #fff, 0 0 10px ${COLOR_NEON[cell.color]}` : `0 0 6px ${COLOR_NEON[cell.color]}`;
        const scale = isPopping ? 'scale(1.2)' : 'scale(1)';

        elements.push(
          <div
            key={cell.id}
            onClick={(e) => handleCellTap(ri, ci, e)}
            onTouchStart={(e) => handleCellTap(ri, ci, e)}
            style={{
              position: 'absolute',
              top: 6 + ri * (CELL_SIZE + 3),
              left: 6 + ci * (CELL_SIZE + 3),
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: bg,
              border,
              boxShadow,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !isAnimating ? 'pointer' : 'default',
              transform: scale,
              transition: 'top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.15s, background-color 0.15s, box-shadow 0.15s',
              userSelect: 'none',
              touchAction: 'none',
              boxSizing: 'border-box',
              zIndex: isPopping ? 5 : 2
            }}
          />
        );
      });
    });
    return elements;
  };

  if (step === 1) {
    return (
      <div className="game-step" style={{ textAlign: 'center', padding: '20px 10px' }}>
        <StepIndicator total={TOTAL_STEPS} current={1} />
        <h2 className="game-title" style={{ color: '#ffea00' }}>🎆 CHAIN BLAST</h2>
        <div className="result-box" style={{ margin: '12px auto', maxWidth: 260 }}>
          <div className="result-title">BLAST COMPLETE!</div>
          <div className="result-stat" style={{ fontSize: 40, color: '#ffea00' }}>{totalScore}</div>
          <div className="result-text">total bubbles popped</div>
          <div style={{ marginTop: 10, borderTop: '1px solid #1a1a2e', paddingTop: 10 }}>
            {roundScores.map((rs, i) => (
              <div key={i} className="result-breakdown" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Round {i + 1}</span>
                <span style={{ color: '#00ff88' }}>+{rs}</span>
              </div>
            ))}
          </div>
          <div className="result-breakdown" style={{ marginTop: 8 }}>
            Total × 5 = <span style={{ color: '#00ff88' }}>{totalScore * 5} pts</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
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
    );
  }

  return (
    <div className="game-step" style={{ textAlign: 'center', padding: '8px 4px' }}>
      <StepIndicator total={TOTAL_STEPS} current={0} />
      <h2 className="game-title" style={{ color: '#ffea00', marginBottom: 4 }}>🎆 CHAIN BLAST</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: gridWidth, margin: '0 auto 6px', padding: '0 2px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa' }}>
          ROUND <span style={{ color: '#ffea00' }}>{currentRound}</span>/{TOTAL_ROUNDS}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa' }}>
          SCORE <span style={{ color: '#00ff88' }}>{roundScore}</span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa' }}>
          TOTAL <span style={{ color: '#00ffcc' }}>{totalScore}</span>
        </div>
      </div>
      <div style={{ height: 20, marginBottom: 4 }}>
        {lastChain && gamePhase === 'playing' && (
          <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
            <span style={{ color: '#ffea00' }}>CHAIN {lastChain.size}</span>
            {lastChain.multiplier > 1 && <span style={{ color: '#ff6600' }}> ×{lastChain.multiplier}</span>}
            <span style={{ color: '#00ff88' }}> +{lastChain.points}</span>
          </div>
        )}
      </div>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          style={{
            position: 'relative',
            width: gridWidth,
            height: gridHeight,
            border: '1px solid #ffea00',
            boxShadow: '0 0 10px #ffea00 inset',
            backgroundColor: '#050508',
            touchAction: 'none',
          }}
        >
          {renderGrid()}
        </div>
        {gamePhase === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,5,8,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, zIndex: 10 }}>
            <div style={{ color: '#ffea00', fontSize: 13, fontFamily: 'monospace', textAlign: 'center', padding: '0 12px', lineHeight: 1.6 }}>
              TAP a bubble to BLAST it.<br/>Chain same-color neighbors!<br/><span style={{ color: '#ff6600' }}>5+ chain = ×2 bonus!</span>
            </div>
            <button className="btn" style={{ minHeight: 44, fontSize: 14 }} onClick={startGame} onTouchStart={(e) => { e.preventDefault(); startGame(); }}>START BLAST</button>
          </div>
        )}
        {gamePhase === 'roundEnd' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,5,8,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, zIndex: 10 }}>
            <div style={{ color: '#ffea00', fontSize: 18, fontFamily: 'monospace', textShadow: '0 0 10px #ffea00' }}>ROUND {currentRound} DONE!</div>
            <div style={{ color: '#00ff88', fontSize: 14, fontFamily: 'monospace' }}>+{roundScore} pts</div>
            {currentRound < TOTAL_ROUNDS ? (
              <button className="btn" style={{ minHeight: 44 }} onClick={startNextRound} onTouchStart={(e) => { e.preventDefault(); startNextRound(); }}>ROUND {currentRound + 1} →</button>
            ) : (
              <button className="btn" style={{ minHeight: 44 }} onClick={handleGameOver} onTouchStart={(e) => { e.preventDefault(); handleGameOver(); }}>SEE RESULTS</button>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa' }}>BLASTS:</span>
        {Array.from({ length: BLASTS_PER_ROUND }, (_, i) => (
          <span key={i} style={{ fontSize: 16, opacity: i < blastsLeft ? 1 : 0.15, transition: 'opacity 0.2s', filter: i < blastsLeft ? 'drop-shadow(0 0 4px #ffea00)' : 'none' }}>💥</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        {COLORS.map((c, i) => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 3, opacity: (currentRound === 1 && i >= 3) || (currentRound === 2 && i >= 4) ? 0.3 : 1 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLOR_NEON[c], boxShadow: `0 0 4px ${COLOR_NEON[c]}` }} />
            <span style={{ fontSize: 9, color: COLOR_NEON[c], fontFamily: 'monospace' }}>{c.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
