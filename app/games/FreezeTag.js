'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const COLS = 6;
const ROWS = 7;
const CELL_SIZE = 40;
const COLORS = ['red', 'blue', 'green', 'yellow'];
// Goal column for each color (bottom row)
const GOAL_COLS = { red: 0, blue: 2, green: 4, yellow: 5 };
// Extra goal mappings so every color has a dedicated column (we have 6 cols, 4 colors)
// col 0=red, col 1=red, col 2=blue, col 3=blue, col 4=green, col 5=yellow
const COL_COLOR = ['red', 'red', 'blue', 'blue', 'green', 'yellow'];

const COLOR_NEON = {
  red: '#ff0055',
  blue: '#00aaff',
  green: '#00ff88',
  yellow: '#ffea00',
};

const COLOR_GLOW = {
  red: 'rgba(255,0,85,0.6)',
  blue: 'rgba(0,170,255,0.6)',
  green: 'rgba(0,255,136,0.6)',
  yellow: 'rgba(255,234,0,0.6)',
};

const TOTAL_STEPS = 2;

let _shapeId = 0;
const nextId = () => ++_shapeId;

function makeEmptyGrid() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ color: null, frozen: false, shapeId: null }))
  );
}

export default function FreezeTag() {
  const { closeGame, reportScore } = useArcade();
  const [step, setStep] = useState(0);

  // Game state
  const [grid, setGrid] = useState(() => makeEmptyGrid());
  const [movingShapes, setMovingShapes] = useState([]);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [gamePhase, setGamePhase] = useState('idle'); // idle | countdown | playing | over
  const [countdown, setCountdown] = useState(3);
  const [frozenCellsFlash, setFrozenCellsFlash] = useState(new Set());

  // Refs for game loop
  const gridRef = useRef(makeEmptyGrid());
  const movingShapesRef = useRef([]);
  const scoreRef = useRef(0);
  const heartsRef = useRef(3);
  const gameOverRef = useRef(false);
  const phaseRef = useRef('idle');
  const tickIntervalRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const countdownRef = useRef(null);
  const spawnSpeedRef = useRef(2000);
  const tickSpeedRef = useRef(700);
  const tickSpeedTimerRef = useRef(null);
  const spawnSpeedTimerRef = useRef(null);

  const syncGrid = useCallback(() => {
    setGrid(gridRef.current.map(row => row.map(cell => ({ ...cell }))));
  }, []);

  const syncShapes = useCallback(() => {
    setMovingShapes([...movingShapesRef.current]);
  }, []);

  const handleGameOver = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    phaseRef.current = 'over';
    clearInterval(tickIntervalRef.current);
    clearInterval(spawnIntervalRef.current);
    clearTimeout(tickSpeedTimerRef.current);
    clearTimeout(spawnSpeedTimerRef.current);
    reportScore(scoreRef.current * 40);
    setGamePhase('over');
    setTimeout(() => {
      setScore(scoreRef.current);
      setStep(1);
    }, 1200);
  }, [reportScore]);

  const spawnShape = useCallback(() => {
    if (gameOverRef.current) return;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    // Randomly choose direction
    const direction = Math.random() < 0.5 ? 'right' : 'down';
    let x, y;
    if (direction === 'right') {
      x = 0;
      y = Math.floor(Math.random() * (ROWS - 1)); // not last row (goal row)
    } else {
      x = Math.floor(Math.random() * COLS);
      y = 0;
    }
    // Check if starting cell is occupied
    if (gridRef.current[y][x].color !== null) return;

    const id = nextId();
    const shape = { id, color, x, y, direction };
    // Place in grid
    const newGrid = gridRef.current.map(r => r.map(c => ({ ...c })));
    newGrid[y][x] = { color, frozen: false, shapeId: id };
    gridRef.current = newGrid;
    movingShapesRef.current = [...movingShapesRef.current, shape];
    syncGrid();
    syncShapes();
  }, [syncGrid, syncShapes]);

  const tickShapes = useCallback(() => {
    if (gameOverRef.current) return;

    const newGrid = gridRef.current.map(r => r.map(c => ({ ...c })));
    const newShapes = [];
    let scoreGain = 0;
    let livesLost = 0;
    const toFreeze = [];

    for (const shape of movingShapesRef.current) {
      const { id, color, x, y, direction } = shape;
      // Clear current cell
      if (newGrid[y][x].shapeId === id) {
        newGrid[y][x] = { color: null, frozen: false, shapeId: null };
      }

      let nx = x;
      let ny = y;
      if (direction === 'right') nx = x + 1;
      else ny = y + 1;

      // Out of bounds
      if (nx >= COLS || ny >= ROWS) {
        // Check if this is the goal row (ny === ROWS means it went past last row)
        // Goal row is row ROWS-1. Shape was at row ROWS-1 moving down → now at ROWS → out
        // Or shape was at col COLS-1 moving right → out
        // For scoring: last row is goal. If shape was on last row and moving down it exits bottom
        // We already scored when it lands on last row in a prior tick, so just remove
        continue;
      }

      // Check target cell
      const targetCell = newGrid[ny][nx];

      // Goal zone check: last row
      if (ny === ROWS - 1 && direction === 'down') {
        // Check color match
        const colGoalColor = COL_COLOR[nx];
        if (color === colGoalColor) {
          scoreGain += 1;
        } else {
          livesLost += 1;
        }
        // Shape disappears
        continue;
      }

      // Moving right, check if reaching a goal column at bottom row
      if (direction === 'right' && ny === ROWS - 1) {
        // shapes moving right on goal row — we shouldn't have shapes here
        // just move normally, no special handling
      }

      // Target occupied?
      if (targetCell.color !== null) {
        // Freeze the shape at current position
        toFreeze.push({ id, color, x, y });
        newGrid[y][x] = { color, frozen: true, shapeId: id };
        continue;
      }

      // Move shape
      newGrid[ny][nx] = { color, frozen: false, shapeId: id };
      newShapes.push({ ...shape, x: nx, y: ny });
    }

    // Apply freezes (already done above for blocked shapes, remove from moving)
    // toFreeze shapes are removed from newShapes (they're not added)

    // Check grid fill: count occupied non-goal cells
    let filledCount = 0;
    const nonGoalCells = COLS * (ROWS - 1);
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newGrid[r][c].color !== null) filledCount++;
      }
    }

    gridRef.current = newGrid;
    movingShapesRef.current = newShapes;
    syncGrid();
    syncShapes();

    if (scoreGain > 0) {
      scoreRef.current += scoreGain;
      setScore(scoreRef.current);
    }

    if (livesLost > 0) {
      heartsRef.current = Math.max(0, heartsRef.current - livesLost);
      setHearts(heartsRef.current);
      if (heartsRef.current <= 0) {
        handleGameOver();
        return;
      }
    }

    if (filledCount >= nonGoalCells - 2) {
      handleGameOver();
    }
  }, [syncGrid, syncShapes, handleGameOver]);

  const startTickInterval = useCallback((speed) => {
    clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = setInterval(() => {
      if (!gameOverRef.current) tickShapes();
    }, speed);
  }, [tickShapes]);

  const startSpawnInterval = useCallback((speed) => {
    clearInterval(spawnIntervalRef.current);
    spawnIntervalRef.current = setInterval(() => {
      if (!gameOverRef.current) spawnShape();
    }, speed);
  }, [spawnShape]);

  const startGame = useCallback(() => {
    // Reset everything
    gameOverRef.current = false;
    phaseRef.current = 'countdown';
    scoreRef.current = 0;
    heartsRef.current = 3;
    _shapeId = 0;
    gridRef.current = makeEmptyGrid();
    movingShapesRef.current = [];
    tickSpeedRef.current = 700;
    spawnSpeedRef.current = 2000;
    setGrid(makeEmptyGrid());
    setMovingShapes([]);
    setScore(0);
    setHearts(3);
    setStep(0);
    setGamePhase('countdown');
    setCountdown(3);

    clearInterval(tickIntervalRef.current);
    clearInterval(spawnIntervalRef.current);
    clearTimeout(tickSpeedTimerRef.current);
    clearTimeout(spawnSpeedTimerRef.current);
    clearInterval(countdownRef.current);

    let c = 3;
    countdownRef.current = setInterval(() => {
      c -= 1;
      if (c <= 0) {
        clearInterval(countdownRef.current);
        phaseRef.current = 'playing';
        setGamePhase('playing');
        // Start game loops
        startTickInterval(tickSpeedRef.current);
        startSpawnInterval(spawnSpeedRef.current);
        // Speed up over time
        const speedUp = () => {
          if (gameOverRef.current) return;
          tickSpeedRef.current = Math.max(250, tickSpeedRef.current - 50);
          spawnSpeedRef.current = Math.max(800, spawnSpeedRef.current - 150);
          startTickInterval(tickSpeedRef.current);
          startSpawnInterval(spawnSpeedRef.current);
          tickSpeedTimerRef.current = setTimeout(speedUp, 8000);
        };
        tickSpeedTimerRef.current = setTimeout(speedUp, 8000);
      } else {
        setCountdown(c);
      }
    }, 1000);
  }, [startTickInterval, startSpawnInterval]);

  // Freeze shape on tap
  const handleCellTap = useCallback((row, col, e) => {
        if (phaseRef.current !== 'playing') return;
    const cell = gridRef.current[row][col];
    if (!cell.color || cell.frozen) return;

    // Find the moving shape at this cell
    const shapeIdx = movingShapesRef.current.findIndex(
      s => s.x === col && s.y === row
    );
    if (shapeIdx === -1) return;

    const newGrid = gridRef.current.map(r => r.map(c => ({ ...c })));
    newGrid[row][col] = { ...newGrid[row][col], frozen: true };
    gridRef.current = newGrid;

    const newShapes = movingShapesRef.current.filter((_, i) => i !== shapeIdx);
    movingShapesRef.current = newShapes;

    syncGrid();
    syncShapes();

    // Flash effect
    const key = `${row}-${col}`;
    setFrozenCellsFlash(prev => new Set([...prev, key]));
    setTimeout(() => {
      setFrozenCellsFlash(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 400);
  }, [syncGrid, syncShapes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(tickIntervalRef.current);
      clearInterval(spawnIntervalRef.current);
      clearTimeout(tickSpeedTimerRef.current);
      clearTimeout(spawnSpeedTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  const gridWidth = COLS * CELL_SIZE;
  const gridHeight = ROWS * CELL_SIZE;

  const renderGrid = () => {
    return grid.map((row, ri) => (
      row.map((cell, ci) => {
        const isGoalRow = ri === ROWS - 1;
        const goalColor = COL_COLOR[ci];
        const flashKey = `${ri}-${ci}`;
        const isFlashing = frozenCellsFlash.has(flashKey);

        let bgColor = '#0a0a14';
        let border = '1px solid #1a1a2e';
        let boxShadow = 'none';
        let glyph = null;

        if (isGoalRow && !cell.color) {
          bgColor = `rgba(${goalColor === 'red' ? '255,0,85' : goalColor === 'blue' ? '0,170,255' : goalColor === 'green' ? '0,255,136' : '255,234,0'},0.08)`;
          border = `1px solid ${COLOR_NEON[goalColor]}44`;
          glyph = <span style={{ fontSize: 10, color: COLOR_NEON[goalColor], opacity: 0.7 }}>▼</span>;
        }

        if (cell.color) {
          bgColor = cell.frozen
            ? `${COLOR_NEON[cell.color]}99`
            : COLOR_NEON[cell.color];
          border = `1px solid ${COLOR_NEON[cell.color]}`;
          boxShadow = `0 0 ${cell.frozen ? 4 : 8}px ${COLOR_NEON[cell.color]}`;
          if (isFlashing) boxShadow = `0 0 16px #fff, 0 0 8px ${COLOR_NEON[cell.color]}`;
        }

        return (
          <div
            key={`${ri}-${ci}`}
            onClick={(e) => handleCellTap(ri, ci, e)}
            onTouchStart={(e) => handleCellTap(ri, ci, e)}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: bgColor,
              border,
              boxShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: cell.color && !cell.frozen ? 'pointer' : 'default',
              transition: 'background-color 0.1s, box-shadow 0.1s',
              userSelect: 'none',
              touchAction: 'none',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {cell.frozen && cell.color && (
              <span style={{ fontSize: 14, color: '#fff', opacity: 0.7 }}>❄</span>
            )}
            {!cell.color && glyph}
          </div>
        );
      })
    ));
  };

  if (step === 1) {
    return (
      <div className="game-step" style={{ textAlign: 'center', padding: '20px 10px' }}>
        <StepIndicator total={TOTAL_STEPS} current={1} />
        <h2 className="game-title" style={{ color: '#00aaff' }}>🧊 FREEZE TAG</h2>
        <div className="result-box" style={{ margin: '16px auto', maxWidth: 260 }}>
          <div className="result-title">GAME OVER</div>
          <div className="result-stat" style={{ fontSize: 36, color: '#00aaff' }}>{score}</div>
          <div className="result-text">shapes sorted</div>
          <div className="result-breakdown" style={{ marginTop: 8 }}>
            Score × 40 = <span style={{ color: '#00ff88' }}>{score * 40} pts</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
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
    );
  }

  return (
    <div className="game-step" style={{ textAlign: 'center', padding: '8px 4px' }}>
      <StepIndicator total={TOTAL_STEPS} current={0} />
      <h2 className="game-title" style={{ color: '#00aaff', marginBottom: 6 }}>🧊 FREEZE TAG</h2>

      {/* HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: gridWidth, margin: '0 auto 6px' }}>
        <div style={{ color: '#00aaff', fontFamily: 'monospace', fontSize: 13 }}>
          SCORE: <span style={{ color: '#00ff88' }}>{score}</span>
        </div>
        <div style={{ fontSize: 16 }}>
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} style={{ opacity: i < hearts ? 1 : 0.2, marginLeft: 2 }}>❤️</span>
          ))}
        </div>
      </div>

      {/* Game Area */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
            border: '1px solid #00aaff',
            boxShadow: '0 0 10px #00aaff inset',
            backgroundColor: '#050508',
            touchAction: 'none',
          }}
        >
          {renderGrid()}
        </div>

        {/* Goal row labels */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: CELL_SIZE,
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
          pointerEvents: 'none',
        }}>
          {COL_COLOR.map((c, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: COLOR_NEON[c],
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: 0,
            }}>
            </div>
          ))}
        </div>

        {/* Countdown overlay */}
        {gamePhase === 'countdown' && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(5,5,8,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 10,
          }}>
            <div style={{ fontSize: 72, color: '#00aaff', fontFamily: 'monospace', lineHeight: 1, textShadow: '0 0 20px #00aaff' }}>
              {countdown}
            </div>
            <div style={{ color: '#00ff88', fontSize: 13, marginTop: 8 }}>GET READY</div>
          </div>
        )}

        {/* Start overlay */}
        {gamePhase === 'idle' && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(5,5,8,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 10,
            gap: 10,
          }}>
            <div style={{ color: '#00aaff', fontSize: 13, fontFamily: 'monospace', textAlign: 'center', padding: '0 12px' }}>
              TAP shapes to FREEZE them.<br />
              Match colors to goal zones!
            </div>
            <button
              className="btn"
              style={{ minHeight: 44, fontSize: 14 }}
              onClick={startGame}
              
            >
              START GAME
            </button>
          </div>
        )}

        {/* Game over overlay */}
        {gamePhase === 'over' && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(255,0,85,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 10,
          }}>
            <div style={{ color: '#fff', fontSize: 22, fontFamily: 'monospace', textShadow: '0 0 10px #ff0055' }}>
              FROZEN OUT!
            </div>
            <div style={{ color: '#ffea00', fontSize: 14, marginTop: 6 }}>Score: {score}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        {COLORS.map(c => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, backgroundColor: COLOR_NEON[c], borderRadius: 2, boxShadow: `0 0 4px ${COLOR_NEON[c]}` }} />
            <span style={{ fontSize: 10, color: COLOR_NEON[c], fontFamily: 'monospace', textTransform: 'uppercase' }}>{c}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: '#444', fontFamily: 'monospace' }}>
        ❄ = frozen &nbsp;|&nbsp; ▼ = goal zone
      </div>
    </div>
  );
}

