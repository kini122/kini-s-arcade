'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const GAME_WIDTH = 260;
const GAME_HEIGHT = 200;
const GROUND_Y = 160;
const PLAYER_SIZE = 20;

export default function CyberRun() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    
    // Countdown state
    const [countdown, setCountdown] = useState(0);

    // Player state
    const [playerY, setPlayerY] = useState(GROUND_Y);
    // Obstacle state
    const [obstacleX, setObstacleX] = useState(GAME_WIDTH);

    const playerYRef = useRef(GROUND_Y);
    const velocityYRef = useRef(0);
    const isJumpingRef = useRef(false);

    const obstacleXRef = useRef(GAME_WIDTH);
    // SLOWED DOWN: Initial speed changed from 3 to 2
    const speedRef = useRef(2); 
    const gameOverRef = useRef(false);
    const scoreRef = useRef(0);

    const animationRef = useRef(null);

    const startGame = () => {
        setScore(0);
        scoreRef.current = 0;
        setIsGameOver(false);
        gameOverRef.current = false;
        setGameStarted(true);
        setStep(0);
        
        setPlayerY(GROUND_Y);
        playerYRef.current = GROUND_Y;
        velocityYRef.current = 0;
        isJumpingRef.current = false;

        setObstacleX(GAME_WIDTH);
        obstacleXRef.current = GAME_WIDTH;
        speedRef.current = 2; // SLOWED DOWN

        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        
        // Start countdown
        setCountdown(3);
        let currentCount = 3;
        const countInterval = setInterval(() => {
            currentCount -= 1;
            setCountdown(currentCount);
            if (currentCount <= 0) {
                clearInterval(countInterval);
                animationRef.current = requestAnimationFrame(gameLoop);
            }
        }, 1000);
    };

    const handleGameOver = () => {
        if (typeof reportScore === 'function') reportScore(Math.floor(scoreRef.current / 10));
        setIsGameOver(true);
        gameOverRef.current = true;
        setGameStarted(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setTimeout(() => setStep(1), 1500);
    };

    const jump = () => {
        if (!gameStarted || isGameOver || countdown > 0) return;
        if (!isJumpingRef.current) {
            isJumpingRef.current = true;
            velocityYRef.current = -8; // Jump strength
        }
    };

    const gameLoop = () => {
        if (gameOverRef.current) return;

        // --- UPDATE PLAYER ---
        if (isJumpingRef.current) {
            playerYRef.current += velocityYRef.current;
            velocityYRef.current += 0.4; // Gravity

            if (playerYRef.current >= GROUND_Y) {
                playerYRef.current = GROUND_Y;
                isJumpingRef.current = false;
                velocityYRef.current = 0;
            }
        }
        setPlayerY(playerYRef.current);

        // --- UPDATE OBSTACLE ---
        obstacleXRef.current -= speedRef.current;
        if (obstacleXRef.current < -20) {
            obstacleXRef.current = GAME_WIDTH;
            scoreRef.current += 100;
            setScore(scoreRef.current);
            // Speed up slightly
            speedRef.current += 0.2;
        }
        setObstacleX(obstacleXRef.current);

        // --- COLLISION CHECK ---
        const pX = 40; // Fixed player X
        const pY = playerYRef.current;
        const oX = obstacleXRef.current;
        const oY = GROUND_Y; // Obstacle is on ground

        // Simple AABB collision
        if (
            pX < oX + 15 &&
            pX + PLAYER_SIZE > oX &&
            pY < oY + 20 &&
            pY + PLAYER_SIZE > oY
        ) {
            handleGameOver();
            return;
        }

        animationRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' || e.key === 'ArrowUp') {
                
                jump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameStarted, isGameOver, countdown]);

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div>
            <h2 className="game-title">🏃 CYBER RUN</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">DISTANCE: {score}</span>
                        <span className="game-label" style={{ color: isGameOver ? 'var(--neon-pink)' : 'var(--neon)' }}>
                            {isGameOver ? 'CRASHED' : 'RUNNING'}
                        </span>
                    </div>

                    <div 
                        onClick={jump}
                        style={{
                            position: 'relative',
                            width: `${GAME_WIDTH}px`,
                            height: `${GAME_HEIGHT}px`,
                            margin: '0 auto',
                            backgroundColor: '#050508',
                            border: `1px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
                            overflow: 'hidden',
                            boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px var(--neon) inset',
                            cursor: 'pointer',
                            touchAction: 'none' // Prevent zooming on double tap
                        }}
                    >
                        {!gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); startGame(); }}>
                                    START RUN
                                </button>
                            </div>
                        )}

                        {gameStarted && countdown > 0 && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, backgroundColor: 'rgba(0,0,0,0.4)' }}>
                                <span style={{ color: 'var(--neon)', fontWeight: 'bold', fontSize: 48, textShadow: '0 0 10px var(--neon)' }}>
                                    {countdown}
                                </span>
                            </div>
                        )}

                        {/* Ground Line */}
                        <div style={{
                            position: 'absolute',
                            bottom: `${GAME_HEIGHT - GROUND_Y - PLAYER_SIZE}px`,
                            left: 0,
                            width: '100%',
                            height: '1px',
                            backgroundColor: '#333'
                        }} />

                        {/* Player */}
                        {(gameStarted || isGameOver) && (
                            <div style={{
                                position: 'absolute',
                                left: '40px',
                                top: `${playerY}px`,
                                width: `${PLAYER_SIZE}px`,
                                height: `${PLAYER_SIZE}px`,
                                backgroundColor: 'var(--neon)',
                                boxShadow: '0 0 10px var(--neon)',
                                borderRadius: '4px'
                            }} />
                        )}

                        {/* Obstacle */}
                        {(gameStarted || isGameOver) && (
                            <div style={{
                                position: 'absolute',
                                left: `${obstacleX}px`,
                                top: `${GROUND_Y}px`,
                                width: '15px',
                                height: '20px',
                                backgroundColor: 'var(--neon-pink)',
                                boxShadow: '0 0 10px var(--neon-pink)',
                                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' // Triangle spike
                            }} />
                        )}

                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.4)' }}>
                                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>
                                    WRECKED
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {gameStarted && !isGameOver && (
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: 10 }}>
                            Tap area or press SPACE to jump
                        </p>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">RUN TERMINATED</div>
                        <div className="result-stat">{score}</div>
                        <p className="result-text">Meters Traveled</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Agility: {score < 500 ? 'Sluggish' : score < 1500 ? 'Athletic' : 'Cybernetic'}<br/>
                            Status: RECOVERING
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        RUN AGAIN
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
