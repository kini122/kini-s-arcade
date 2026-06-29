'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const GRID_SIZE = 4;

export default function Grid2048() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [grid, setGrid] = useState([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const initGrid = () => {
        let newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
        return addRandomTile(addRandomTile(newGrid));
    };

    const addRandomTile = (currentGrid) => {
        let emptyCells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (currentGrid[r][c] === 0) emptyCells.push({ r, c });
            }
        }
        if (emptyCells.length === 0) return currentGrid;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const newGrid = JSON.parse(JSON.stringify(currentGrid));
        newGrid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
        return newGrid;
    };

    const startGame = () => {
        setScore(0);
        setIsGameOver(false);
        setGrid(initGrid());
        setGameStarted(true);
        setStep(0);
    };

    const handleGameOver = () => {
        if (typeof reportScore === "function") reportScore(Math.floor(score / 5));
        setIsGameOver(true);
        setGameStarted(false);
        setTimeout(() => setStep(1), 1500);
    };

    const move = (direction) => {
        if (!gameStarted || isGameOver) return;

        let newGrid = JSON.parse(JSON.stringify(grid));
        let moved = false;
        let pointsEarned = 0;

        const slideLine = (line) => {
            let arr = line.filter(val => val);
            let missing = GRID_SIZE - arr.length;
            let zeros = Array(missing).fill(0);
            return arr.concat(zeros);
        };

        const combineLine = (line) => {
            for (let i = 0; i < GRID_SIZE - 1; i++) {
                if (line[i] !== 0 && line[i] === line[i + 1]) {
                    line[i] *= 2;
                    pointsEarned += line[i];
                    line[i + 1] = 0;
                }
            }
            return line;
        };

        for (let i = 0; i < GRID_SIZE; i++) {
            let row = [];
            if (direction === 'LEFT' || direction === 'RIGHT') {
                row = newGrid[i];
                if (direction === 'RIGHT') row.reverse();
            } else {
                for (let j = 0; j < GRID_SIZE; j++) row.push(newGrid[j][i]);
                if (direction === 'DOWN') row.reverse();
            }

            let originalRow = [...row];
            row = slideLine(row);
            row = combineLine(row);
            row = slideLine(row);

            if (direction === 'RIGHT' || direction === 'DOWN') row.reverse();

            for (let j = 0; j < GRID_SIZE; j++) {
                if (direction === 'LEFT' || direction === 'RIGHT') {
                    if (newGrid[i][j] !== row[j]) moved = true;
                    newGrid[i][j] = row[j];
                } else {
                    if (newGrid[j][i] !== row[j]) moved = true;
                    newGrid[j][i] = row[j];
                }
            }
        }

        if (moved) {
            newGrid = addRandomTile(newGrid);
            setGrid(newGrid);
            setScore(s => s + pointsEarned);
            checkGameOver(newGrid);
        }
    };

    const checkGameOver = (currentGrid) => {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (currentGrid[r][c] === 0) return;
                if (r < GRID_SIZE - 1 && currentGrid[r][c] === currentGrid[r + 1][c]) return;
                if (c < GRID_SIZE - 1 && currentGrid[r][c] === currentGrid[r][c + 1]) return;
            }
        }
        handleGameOver();
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted || isGameOver) return;
            // Prevent default scrolling for arrows
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                
            }
            if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); } move('UP');
            if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); } move('DOWN');
            if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); } move('LEFT');
            if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); } move('RIGHT');
        };
        window.addEventListener('keydown', handleKeyDown, { passive: false });
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameStarted, isGameOver, grid]);

    // Touch Swipe Support
    const touchStartRef = useRef({ x: null, y: null });

    const handleTouchStart = (e) => {
        touchStartRef.current.x = e.touches[0].clientX;
        touchStartRef.current.y = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (!touchStartRef.current.x || !touchStartRef.current.y) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartRef.current.x;
        const dy = touchEndY - touchStartRef.current.y;

        // Ensure minimum swipe distance to prevent accidental taps
        if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0) move('RIGHT');
                else move('LEFT');
            } else {
                // Vertical swipe
                if (dy > 0) move('DOWN');
                else move('UP');
            }
        }

        touchStartRef.current = { x: null, y: null };
    };

    const getColor = (val) => {
        if (val === 0) return '#111';
        if (val === 2) return '#222';
        if (val === 4) return '#333';
        if (val === 8) return '#00ffcc';
        if (val === 16) return '#00cca3';
        if (val === 32) return '#00997a';
        if (val === 64) return '#ffea00';
        if (val === 128) return '#cca300';
        if (val === 256) return '#ffaa00';
        if (val === 512) return '#ff5500';
        if (val === 1024) return 'var(--neon-pink)';
        return '#fff'; // 2048+
    };

    return (
        <div>
            <h2 className="game-title">🧩 GRID 2048</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">SCORE: {score}</span>
                        <span className="game-label" style={{ color: isGameOver ? 'var(--neon-pink)' : 'var(--neon)' }}>
                            {isGameOver ? 'GRIDLOCKED' : 'MERGING'}
                        </span>
                    </div>

                    <div 
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            position: 'relative',
                            width: '240px',
                            height: '240px',
                            margin: '0 auto',
                            backgroundColor: '#050508',
                            border: `1px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '4px',
                            padding: '4px',
                            boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px var(--neon) inset',
                            touchAction: 'none' // Prevent pull-to-refresh on mobile
                        }}
                    >
                        {!gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                <button className="btn btn-sm" onClick={startGame}>
                                    INITIALIZE GRID
                                </button>
                            </div>
                        )}

                        {gameStarted && grid.map((row, r) => (
                            row.map((val, c) => (
                                <div 
                                    key={`${r}-${c}`}
                                    style={{
                                        backgroundColor: getColor(val),
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: val <= 4 ? '#aaa' : (val >= 8 && val <= 64 ? '#000' : '#fff'),
                                        fontWeight: 'bold',
                                        fontSize: val > 1000 ? '14px' : '18px',
                                        textShadow: val >= 1024 ? '0 0 5px var(--neon-pink)' : 'none',
                                        transition: 'background-color 0.1s'
                                    }}
                                >
                                    {val > 0 ? val : ''}
                                </div>
                            ))
                        ))}

                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.4)', zIndex: 20 }}>
                                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>
                                    LOCKED
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {gameStarted && !isGameOver && (
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: 10 }}>
                            Swipe or use Arrow Keys to merge
                        </p>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">GRID ANALYSIS</div>
                        <div className="result-stat">{score}</div>
                        <p className="result-text">Data Merged</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Highest Tile: {grid.length > 0 ? Math.max(...grid.flat()) : 0}<br/>
                            Status: MEMORY FULL
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        FORMAT & RESTART
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
