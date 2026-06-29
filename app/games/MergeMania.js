'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const COLS = 5;
const ROWS = 6;
const COLORS = ['red', 'orange', 'yellow', 'green', 'cyan'];
const COLOR_HEX = {
  red: '#ff4466',
  orange: '#ff8800',
  yellow: '#ffea00',
  green: '#00ff88',
  cyan: '#00ffcc',
};
const COLOR_POINTS = { red: 1, orange: 2, yellow: 4, green: 8, cyan: 16 };
const NEXT_COLOR = { red: 'orange', orange: 'yellow', yellow: 'green', green: 'cyan', cyan: null };
const TOTAL_STEPS = 2;

function makeEmptyGrid() {
  return Array.from({ length: COLS }, () => Array(ROWS).fill(null));
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default function MergeMania() {
  const { closeGame, reportScore } = useArcade();

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | countdown | playing | gameover
  const [countdown, setCountdown] = useState(3);
  const [grid, setGrid] = useState(makeEmptyGrid());
  const [nextColor, setNextColor] = useState(randomColor());
  const [score, setScore] = useState(0);
  const [gameOverMsg, setGameOverMsg] = useState('');

  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const nextColorRef = useRef(nextColor);
  const gridRef = useRef(makeEmptyGrid());

  // keep refs in sync
  useEffect(() => { nextColorRef.current = nextColor; }, [nextColor]);

  // ── countdown ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) {
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // ── start ──────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const g = makeEmptyGrid();
    gridRef.current = g;
    scoreRef.current = 0;
    gameOverRef.current = false;
    const nc = randomColor();
    nextColorRef.current = nc;
    setGrid(g.map(col => [...col]));
    setNextColor(nc);
    setScore(0);
    setGameOverMsg('');
    setCountdown(3);
    setPhase('countdown');
    setStep(0);
  }, []);

  // ── merge logic ────────────────────────────────────────────────────────────
  // BFS flood-fill: find all connected same-color groups of size >= 2
  function findMergeGroups(g) {
    const visited = Array.from({ length: COLS }, () => Array(ROWS).fill(false));
    const groups = [];

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (!g[c][r] || visited[c][r]) continue;
        const color = g[c][r];
        const group = [];
        const queue = [[c, r]];
        visited[c][r] = true;
        while (queue.length) {
          const [cc, rr] = queue.shift();
          group.push([cc, rr]);
          const neighbors = [[cc - 1, rr], [cc + 1, rr], [cc, rr - 1], [cc, rr + 1]];
          for (const [nc2, nr] of neighbors) {
            if (nc2 >= 0 && nc2 < COLS && nr >= 0 && nr < ROWS && !visited[nc2][nr] && g[nc2][nr] === color) {
              visited[nc2][nr] = true;
              queue.push([nc2, nr]);
            }
          }
        }
        if (group.length >= 2) groups.push({ color, cells: group });
      }
    }
    return groups;
  }

  // Apply gravity: compact each column so no nulls below cells
  function applyGravity(g) {
    const ng = makeEmptyGrid();
    for (let c = 0; c < COLS; c++) {
      let slot = 0;
      for (let r = 0; r < ROWS; r++) {
        if (g[c][r] !== null) {
          ng[c][slot] = g[c][r];
          slot++;
        }
      }
    }
    return ng;
  }

  // Run chain merges until no more
  function runMerges(g) {
    let current = g.map(col => [...col]);
    let totalPoints = 0;
    let changed = true;

    while (changed) {
      changed = false;
      const groups = findMergeGroups(current);
      if (groups.length === 0) break;

      for (const { color, cells } of groups) {
        changed = true;
        const next = NEXT_COLOR[color];

        // Earn points for each cell that merges
        const pts = COLOR_POINTS[color] * cells.length;
        totalPoints += pts;

        // Remove all cells in the group
        for (const [cc, rr] of cells) {
          current[cc][rr] = null;
        }

        if (next !== null) {
          // Place ONE bubble of next color at the lowest cell of the group
          // Find the cell with the lowest row index (bottom-most)
          const bottomCell = cells.reduce((best, cell) => cell[1] < best[1] ? cell : best, cells[0]);
          current[bottomCell[0]][bottomCell[1]] = next;
        }
      }

      // Apply gravity after each merge pass
      current = applyGravity(current);
    }

    return { grid: current, points: totalPoints };
  }

  // ── drop bubble ────────────────────────────────────────────────────────────
  const dropBubble = useCallback((col) => {
    if (gameOverRef.current || phase !== 'playing') return;

    const g = gridRef.current.map(c => [...c]);
    const color = nextColorRef.current;

    // Find top-most empty row in this column
    let placed = false;
    for (let r = 0; r < ROWS; r++) {
      if (g[col][r] === null) {
        g[col][r] = color;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Column is full — immediate game over
      handleGameOver(gridRef.current);
      return;
    }

    // Run merges
    const { grid: mergedGrid, points } = runMerges(g);

    // Check overflow (any column >= ROWS cells filled)
    let overflow = false;
    for (let c = 0; c < COLS; c++) {
      let count = 0;
      for (let r = 0; r < ROWS; r++) {
        if (mergedGrid[c][r] !== null) count++;
      }
      if (count >= ROWS) { overflow = true; break; }
    }

    scoreRef.current += points;
    setScore(scoreRef.current);

    const nc = randomColor();
    nextColorRef.current = nc;
    setNextColor(nc);
    gridRef.current = mergedGrid;
    setGrid(mergedGrid.map(c => [...c]));

    if (overflow) {
      handleGameOver(mergedGrid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── game over ──────────────────────────────────────────────────────────────
  function handleGameOver(g) {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    reportScore(scoreRef.current * 10);
    setPhase('gameover');
    setGameOverMsg('OVERFLOW!');
    setTimeout(() => setStep(1), 1200);
  }

  // ── keyboard support ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (phase !== 'playing') return;
      const keys = ['1', '2', '3', '4', '5'];
      const idx = keys.indexOf(e.key);
      if (idx !== -1) dropBubble(idx);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, dropBubble]);

  // ── column fill height for overflow warning ────────────────────────────────
  function colCount(c) {
    return grid[c].filter(v => v !== null).length;
  }

  // ── render ─────────────────────────────────────────────────────────────────
  const CELL = 40; // px per cell
  const GAP = 4;
  const GRID_W = COLS * CELL + (COLS - 1) * GAP;
  const GRID_H = ROWS * CELL + (ROWS - 1) * GAP;

  const renderCell = (col, row) => {
    // row 0 = bottom, render from top (row ROWS-1 down to 0)
    const color = grid[col][row];
    return (
      <div
        key={`${col}-${row}`}
        style={{
          width: CELL,
          height: CELL,
          borderRadius: '50%',
          background: color ? COLOR_HEX[color] : 'rgba(255,255,255,0.04)',
          boxShadow: color ? `0 0 10px ${COLOR_HEX[color]}, 0 0 20px ${COLOR_HEX[color]}55` : 'none',
          border: color ? `2px solid ${COLOR_HEX[color]}cc` : '1px solid rgba(255,255,255,0.08)',
          transition: 'background 0.15s, box-shadow 0.15s',
          flexShrink: 0,
        }}
      />
    );
  };

  return (
    <div className="game-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, userSelect: 'none' }}>
      <StepIndicator total={TOTAL_STEPS} current={step} />

      {step === 0 && (
        <>
          <h2 className="game-title" style={{ color: '#00ffcc', marginBottom: 2 }}>🫧 MERGE MANIA</h2>

          {/* Score bar */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 2 }}>
            <span className="game-label">SCORE: <b style={{ color: '#ffea00' }}>{score}</b></span>
          </div>

          {/* Next bubble preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="game-label" style={{ fontSize: 11 }}>NEXT:</span>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: COLOR_HEX[nextColor],
              boxShadow: `0 0 10px ${COLOR_HEX[nextColor]}`,
              border: `2px solid ${COLOR_HEX[nextColor]}`,
            }} />
          </div>

          {/* Game area */}
          <div style={{
            position: 'relative',
            width: GRID_W + 16,
            height: GRID_H + 16,
            background: '#050508',
            border: '1px solid #00ffcc',
            boxShadow: '0 0 10px #00ffcc inset',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
          }}>
            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
              gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
              gap: GAP,
            }}>
              {/* Render rows top-to-bottom, but grid is row 0 = bottom, so invert display */}
              {Array.from({ length: ROWS }, (_, displayRow) => {
                const row = ROWS - 1 - displayRow; // row 5 on top, row 0 on bottom
                return Array.from({ length: COLS }, (_, col) => renderCell(col, row));
              })}
            </div>

            {/* START overlay */}
            {phase === 'idle' && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.88)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, gap: 12,
              }}>
                <p style={{ color: '#00ffcc', fontSize: 13, textAlign: 'center', margin: 0 }}>
                  Tap columns to drop bubbles!<br />Match 2+ same colors to merge.
                </p>
                <button
                  className="btn"
                  style={{ minHeight: 44 }}
                  onClick={startGame}
                  
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
                borderRadius: 8,
              }}>
                <span style={{ fontSize: 72, color: '#00ffcc', fontWeight: 900, textShadow: '0 0 30px #00ffcc' }}>
                  {countdown === 0 ? 'GO!' : countdown}
                </span>
              </div>
            )}

            {/* Game Over overlay */}
            {phase === 'gameover' && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255,0,85,0.4)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, gap: 8,
              }}>
                <span style={{ fontSize: 28, color: '#ff0055', fontWeight: 900 }}>GAME OVER</span>
                <span style={{ color: '#ff4466', fontSize: 16 }}>{gameOverMsg}</span>
              </div>
            )}
          </div>

          {/* Column drop buttons */}
          {(phase === 'playing' || phase === 'gameover') && (
            <div style={{ display: 'flex', gap: GAP, marginTop: 6 }}>
              {Array.from({ length: COLS }, (_, c) => {
                const count = colCount(c);
                const full = count >= ROWS;
                return (
                  <button
                    key={c}
                    onClick={() => dropBubble(c)}
                    
                    style={{
                      width: CELL,
                      minHeight: 44,
                      background: full ? 'rgba(255,0,85,0.3)' : 'rgba(0,255,204,0.1)',
                      border: `1px solid ${full ? '#ff0055' : '#00ffcc'}`,
                      color: full ? '#ff0055' : '#00ffcc',
                      borderRadius: 4,
                      fontSize: 18,
                      cursor: full ? 'not-allowed' : 'pointer',
                      touchAction: 'none',
                      padding: '4px 0',
                      lineHeight: 1,
                    }}
                    disabled={full || phase !== 'playing'}
                    aria-label={`Drop in column ${c + 1}`}
                  >
                    ▼
                  </button>
                );
              })}
            </div>
          )}

          {/* Idle — show buttons row placeholder */}
          {phase === 'idle' && (
            <div style={{ display: 'flex', gap: GAP, marginTop: 6, opacity: 0.3, pointerEvents: 'none' }}>
              {Array.from({ length: COLS }, (_, c) => (
                <div key={c} style={{ width: CELL, minHeight: 44, border: '1px solid #00ffcc', borderRadius: 4 }} />
              ))}
            </div>
          )}

          {/* Key hints */}
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, margin: 0 }}>Keys 1-5 to drop • Match 2+ to merge</p>
        </>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 16 }}>
          <h2 className="game-title" style={{ color: '#00ffcc' }}>🫧 MERGE MANIA</h2>
          <div className="result-box">
            <div className="result-title">GAME OVER</div>
            <div className="result-stat">{score}</div>
            <div className="result-text">merge points</div>
            <div className="result-breakdown">
              Final Score: <b style={{ color: '#ffea00' }}>{score * 10}</b>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
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

