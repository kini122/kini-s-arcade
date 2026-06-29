'use client';

import { useState } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const GRID_SIZE = 5;
const NUM_MINES = 5;

export default function DataMiner() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [grid, setGrid] = useState([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWin, setIsWin] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [safeCellsLeft, setSafeCellsLeft] = useState(0);

    const initializeGrid = () => {
        let newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        let minesPlaced = 0;
        
        while (minesPlaced < NUM_MINES) {
            const r = Math.floor(Math.random() * GRID_SIZE);
            const c = Math.floor(Math.random() * GRID_SIZE);
            if (newGrid[r][c] !== 'M') {
                newGrid[r][c] = 'M';
                minesPlaced++;
            }
        }

        // Calculate neighbors
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (newGrid[r][c] === 'M') continue;
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (r+i >= 0 && r+i < GRID_SIZE && c+j >= 0 && c+j < GRID_SIZE) {
                            if (newGrid[r+i][c+j] === 'M') count++;
                        }
                    }
                }
                newGrid[r][c] = count;
            }
        }

        // Object format: { value, revealed, flagged }
        const formattedGrid = newGrid.map(row => 
            row.map(val => ({ value: val, revealed: false, flagged: false }))
        );

        setGrid(formattedGrid);
        setSafeCellsLeft((GRID_SIZE * GRID_SIZE) - NUM_MINES);
        setScore(0);
        setIsGameOver(false);
        setIsWin(false);
        setGameStarted(true);
        setStep(0);
    };

    const revealCell = (r, c) => {
        if (!gameStarted || isGameOver || grid[r][c].revealed || grid[r][c].flagged) return;

        let newGrid = [...grid];
        const cell = newGrid[r][c];

        if (cell.value === 'M') {
            // Hit a mine
            setIsGameOver(true);
            setIsWin(false);
            // Reveal all mines
            newGrid = newGrid.map(row => row.map(cell => cell.value === 'M' ? { ...cell, revealed: true } : cell));
            setGrid(newGrid);
            setTimeout(() => setStep(1), 1500);
            return;
        }

        // DFS reveal
        let cellsToReveal = [[r, c]];
        let newlyRevealed = 0;

        while (cellsToReveal.length > 0) {
            const [currR, currC] = cellsToReveal.pop();
            const currCell = newGrid[currR][currC];
            
            if (!currCell.revealed && !currCell.flagged) {
                currCell.revealed = true;
                newlyRevealed++;

                if (currCell.value === 0) {
                    for (let i = -1; i <= 1; i++) {
                        for (let j = -1; j <= 1; j++) {
                            const nr = currR + i;
                            const nc = currC + j;
                            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                                cellsToReveal.push([nr, nc]);
                            }
                        }
                    }
                }
            }
        }

        setGrid(newGrid);
        setScore(s => s + newlyRevealed * 10);
        
        const newSafeLeft = safeCellsLeft - newlyRevealed;
        setSafeCellsLeft(newSafeLeft);

        if (newSafeLeft === 0) {
            // Win
            setIsGameOver(true);
            setIsWin(true);
            setTimeout(() => setStep(1), 1500);
        }
    };

    const toggleFlag = (e, r, c) => {
        
        if (!gameStarted || isGameOver || grid[r][c].revealed) return;

        let newGrid = [...grid];
        newGrid[r][c].flagged = !newGrid[r][c].flagged;
        setGrid(newGrid);
    };

    return (
        <div>
            <h2 className="game-title">⛏️ DATA MINER</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">DATA: {score}</span>
                        <span className="game-label" style={{ color: isGameOver ? (isWin ? 'var(--neon)' : 'var(--neon-pink)') : 'var(--neon)' }}>
                            {isGameOver ? (isWin ? 'CLEARED' : 'CORRUPTED') : 'MINING'}
                        </span>
                    </div>

                    {!gameStarted ? (
                        <div style={{ minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <button className="btn" onClick={initializeGrid}>START SCAN</button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                            gap: '4px',
                            backgroundColor: '#050508',
                            padding: '10px',
                            border: `1px solid ${isGameOver && !isWin ? 'var(--neon-pink)' : 'var(--neon)'}`,
                            maxWidth: '260px',
                            margin: '0 auto',
                            opacity: isGameOver && !isWin ? 0.8 : 1
                        }}>
                            {grid.map((row, r) => (
                                row.map((cell, c) => (
                                    <div 
                                        key={`${r}-${c}`}
                                        onClick={() => revealCell(r, c)}
                                        onContextMenu={(e) => toggleFlag(e, r, c)}
                                        style={{
                                            aspectRatio: '1',
                                            backgroundColor: cell.revealed ? '#000' : '#111',
                                            border: `1px solid ${cell.revealed ? '#333' : 'var(--neon)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: cell.revealed ? 'default' : 'pointer',
                                            color: cell.value === 'M' ? 'var(--neon-pink)' : '#fff',
                                            fontWeight: 'bold',
                                            fontSize: '18px'
                                        }}
                                    >
                                        {cell.revealed && cell.value === 'M' && '💀'}
                                        {cell.revealed && cell.value > 0 && cell.value}
                                        {!cell.revealed && cell.flagged && '🚩'}
                                    </div>
                                ))
                            ))}
                        </div>
                    )}
                    
                    {gameStarted && !isGameOver && (
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: 15 }}>
                            Long press / Right click to flag viruses.
                        </p>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">{isWin ? 'SECTOR CLEARED' : 'SYSTEM CRASH'}</div>
                        <div className="result-stat" style={{ color: isWin ? 'var(--neon)' : 'var(--neon-pink)' }}>{score}</div>
                        <p className="result-text">Data extracted</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Viruses Flagged: {grid.flat().filter(c => c.flagged && c.value === 'M').length}/{NUM_MINES}<br/>
                            Safe Cells Left: {safeCellsLeft}<br/>
                            Status: {isWin ? 'SECURE' : 'FATAL ERROR'}
                        </div>
                    </div>
                    <button className="btn" onClick={initializeGrid} style={{ marginBottom: 12 }}>
                        SCAN NEW SECTOR
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
