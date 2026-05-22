'use client';

import { useState, useEffect, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2; // Step 0: Play, Step 1: Game Over
const GRID_SIZE = 15;
const INITIAL_SNAKE = [[7, 7], [7, 6], [7, 5]];
const INITIAL_DIRECTION = [0, 1];

export default function NeonSnake() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [direction, setDirection] = useState(INITIAL_DIRECTION);
    const [food, setFood] = useState([3, 10]);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [speed, setSpeed] = useState(150);

    const generateFood = useCallback((currentSnake) => {
        let newFood;
        while (true) {
            newFood = [
                Math.floor(Math.random() * GRID_SIZE),
                Math.floor(Math.random() * GRID_SIZE)
            ];
            // eslint-disable-next-line no-loop-func
            if (!currentSnake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1])) {
                break;
            }
        }
        setFood(newFood);
    }, []);

    const startGame = () => {
        setSnake(INITIAL_SNAKE);
        setDirection(INITIAL_DIRECTION);
        setScore(0);
        setIsGameOver(false);
        setGameStarted(true);
        setStep(0);
        generateFood(INITIAL_SNAKE);
        setSpeed(150);
    };

    const handleGameOver = () => {
        reportScore(scoreRef.current * 20);
        setIsGameOver(true);
        setGameStarted(false);
        setTimeout(() => setStep(1), 1000); // Wait 1s before showing result screen
    };

    useEffect(() => {
        if (!gameStarted || isGameOver) return;

        const moveSnake = () => {
            setSnake(prevSnake => {
                const head = prevSnake[0];
                const newHead = [head[0] + direction[0], head[1] + direction[1]];

                // Wall collision
                if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) {
                    handleGameOver();
                    return prevSnake;
                }

                // Self collision
                if (prevSnake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
                    handleGameOver();
                    return prevSnake;
                }

                const newSnake = [newHead, ...prevSnake];

                // Food collision
                if (newHead[0] === food[0] && newHead[1] === food[1]) {
                    setScore(s => s + 10);
                    setSpeed(s => Math.max(50, s - 5)); // Speed up slightly
                    generateFood(newSnake);
                } else {
                    newSnake.pop(); // Remove tail if no food eaten
                }

                return newSnake;
            });
        };

        const intervalId = setInterval(moveSnake, speed);
        return () => clearInterval(intervalId);
    }, [gameStarted, isGameOver, direction, food, speed, generateFood]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted || isGameOver) return;
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    if (direction[0] !== 1) setDirection([-1, 0]);
                    break;
                case 'ArrowDown':
                case 's':
                    if (direction[0] !== -1) setDirection([1, 0]);
                    break;
                case 'ArrowLeft':
                case 'a':
                    if (direction[1] !== 1) setDirection([0, -1]);
                    break;
                case 'ArrowRight':
                case 'd':
                    if (direction[1] !== -1) setDirection([0, 1]);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [direction, gameStarted, isGameOver]);

    // Mobile D-Pad Handlers
    const handleDPad = (dRow, dCol) => {
        if (!gameStarted || isGameOver) return;
        if (direction[0] === -dRow && direction[1] === -dCol) return; // Cannot reverse
        setDirection([dRow, dCol]);
    };

    return (
        <div>
            <h2 className="game-title">🐍 NEON SNAKE</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, padding: '0 20px' }}>
                        <span className="game-label">SCORE: {score}</span>
                        <span className="game-label" style={{ color: isGameOver ? 'var(--neon-pink)' : 'var(--neon)' }}>
                            {isGameOver ? 'CRASHED' : 'SYSTEM OK'}
                        </span>
                    </div>

                    <div style={{
                        width: '100%',
                        maxWidth: '280px',
                        aspectRatio: '1',
                        margin: '0 auto',
                        backgroundColor: '#0a0a0f',
                        border: `2px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                        boxShadow: isGameOver ? '0 0 15px var(--neon-pink)' : '0 0 10px var(--neon)',
                        position: 'relative'
                    }}>
                        {!gameStarted && !isGameOver && (
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10
                            }}>
                                <button className="btn btn-sm" onClick={startGame}>START</button>
                            </div>
                        )}
                        
                        {/* Render grid items */}
                        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                            const row = Math.floor(idx / GRID_SIZE);
                            const col = idx % GRID_SIZE;
                            const isSnake = snake.some(segment => segment[0] === row && segment[1] === col);
                            const isHead = snake[0][0] === row && snake[0][1] === col;
                            const isFood = food[0] === row && food[1] === col;

                            return (
                                <div key={idx} style={{
                                    backgroundColor: isHead ? '#fff' : isSnake ? 'var(--neon)' : isFood ? 'var(--neon-pink)' : 'transparent',
                                    borderRadius: isFood ? '50%' : isSnake ? '2px' : '0',
                                    boxShadow: isFood ? '0 0 8px var(--neon-pink)' : isSnake ? '0 0 4px var(--neon)' : 'none',
                                    margin: '1px'
                                }} />
                            );
                        })}
                    </div>

                    {/* D-Pad for Mobile */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20, opacity: gameStarted ? 1 : 0.3 }}>
                        <button className="btn" style={{ padding: '8px 20px', minWidth: 0, marginBottom: 5 }} onClick={() => handleDPad(-1, 0)}>↑</button>
                        <div style={{ display: 'flex', gap: 40 }}>
                            <button className="btn" style={{ padding: '8px 20px', minWidth: 0 }} onClick={() => handleDPad(0, -1)}>←</button>
                            <button className="btn" style={{ padding: '8px 20px', minWidth: 0 }} onClick={() => handleDPad(0, 1)}>→</button>
                        </div>
                        <button className="btn" style={{ padding: '8px 20px', minWidth: 0, marginTop: 5 }} onClick={() => handleDPad(1, 0)}>↓</button>
                    </div>
                </div>
            )}

            {/* Step 1: Game Over */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">SNAKE TERMINATED</div>
                        <div className="result-stat">{score}</div>
                        <p className="result-text">Points obtained</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Length: {snake.length} segments<br/>
                            Speed Reached: {Math.floor((150 - speed) / 5)}<br/>
                            Status: OFFLINE
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        PLAY AGAIN
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
