'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const GAME_WIDTH = 260;
const GAME_HEIGHT = 280;
const TARGET_SIZE = 30;
const BULLET_SIZE = 6;
const PLAYER_SIZE = 20;

export default function SpaceDefender() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [countdown, setCountdown] = useState(0);
    
    // Game state
    const [targetX, setTargetX] = useState(GAME_WIDTH / 2 - TARGET_SIZE / 2);
    const [bullets, setBullets] = useState([]);
    
    // Refs for game loop
    const targetXRef = useRef(targetX);
    const targetDirRef = useRef(1); // 1 = right, -1 = left
    const targetSpeedRef = useRef(1.5);
    const bulletsRef = useRef([]);
    const gameOverRef = useRef(false);
    const scoreRef = useRef(0);

    // Sync refs
    useEffect(() => { targetXRef.current = targetX; }, [targetX]);
    useEffect(() => { bulletsRef.current = bullets; }, [bullets]);
    useEffect(() => { gameOverRef.current = isGameOver; }, [isGameOver]);
    useEffect(() => { scoreRef.current = score; }, [score]);

    const startGame = () => {
        setScore(0);
        setIsGameOver(false);
        setGameStarted(true);
        setStep(0);
        setBullets([]);
        setTargetX(GAME_WIDTH / 2 - TARGET_SIZE / 2);
        targetDirRef.current = 1;
        targetSpeedRef.current = 1.5;

        setCountdown(3);
        let currentCount = 3;
        const countInterval = setInterval(() => {
            currentCount -= 1;
            setCountdown(currentCount);
            if (currentCount <= 0) {
                clearInterval(countInterval);
                setTimeLeft(30);
            }
        }, 1000);
    };

    const handleGameOver = () => {
        reportScore(scoreRef.current * 10);
        setIsGameOver(true);
        setGameStarted(false);
        setTimeout(() => setStep(1), 1500);
    };

    const shoot = () => {
        if (!gameStarted || isGameOver || countdown > 0) return;
        // Limit to 3 bullets max on screen to prevent spamming
        if (bulletsRef.current.length >= 3) return;

        const newBullet = {
            id: Math.random().toString(),
            x: GAME_WIDTH / 2 - BULLET_SIZE / 2, // Ship is stationary in center
            y: GAME_HEIGHT - PLAYER_SIZE - BULLET_SIZE
        };
        setBullets(prev => [...prev, newBullet]);
    };

    useEffect(() => {
        if (!gameStarted || isGameOver || countdown > 0) return;

        const interval = setInterval(() => {
            if (gameOverRef.current) return;

            // Move target
            let newTargetX = targetXRef.current + (targetDirRef.current * targetSpeedRef.current);
            if (newTargetX <= 0) {
                newTargetX = 0;
                targetDirRef.current = 1;
            } else if (newTargetX >= GAME_WIDTH - TARGET_SIZE) {
                newTargetX = GAME_WIDTH - TARGET_SIZE;
                targetDirRef.current = -1;
            }
            setTargetX(newTargetX);

            // Move bullets
            let hitTarget = false;
            let nextBullets = [];

            for (let b of bulletsRef.current) {
                const newY = b.y - 6; // bullet speed
                if (newY < 0) continue; // off screen

                // Collision check
                const targetY = 20;
                if (
                    b.x < newTargetX + TARGET_SIZE &&
                    b.x + BULLET_SIZE > newTargetX &&
                    newY < targetY + TARGET_SIZE &&
                    newY + BULLET_SIZE > targetY
                ) {
                    hitTarget = true;
                } else {
                    nextBullets.push({ ...b, y: newY });
                }
            }

            if (hitTarget) {
                setScore(s => s + 1);
                targetSpeedRef.current += 0.2; // speed up target
            }

            setBullets(nextBullets);

        }, 20);

        return () => clearInterval(interval);
    }, [gameStarted, isGameOver, countdown]);

    // Timer logic
    const [timeLeft, setTimeLeft] = useState(30);
    const timerIntervalRef = useRef(null);

    useEffect(() => {
        if (gameStarted && !isGameOver && countdown <= 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleGameOver();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [gameStarted, isGameOver, countdown]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') { e.preventDefault();
                
                shoot();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameStarted, isGameOver, countdown]);


    return (
        <div>
            <h2 className="game-title">🛸 SPACE DEFENDER</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">SCORE: {score}</span>
                        <span className="game-label" style={{ color: timeLeft <= 5 ? 'var(--neon-pink)' : 'var(--neon)' }}>
                            T-{timeLeft}s
                        </span>
                    </div>

                    <div 
                        onClick={shoot}
                        style={{
                            position: 'relative',
                            width: `${GAME_WIDTH}px`,
                            height: `${GAME_HEIGHT}px`,
                            margin: '0 auto',
                            backgroundColor: '#050508',
                            border: `1px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
                            overflow: 'hidden',
                            boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px var(--neon) inset',
                            cursor: 'crosshair'
                        }}
                    >
                        {!gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); startGame(); }}>
                                    DEFEND
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

                        {/* Enemy Target */}
                        {(gameStarted || isGameOver) && (
                            <div style={{
                                position: 'absolute',
                                left: `${targetX}px`,
                                top: '20px',
                                width: `${TARGET_SIZE}px`,
                                height: `${TARGET_SIZE}px`,
                                backgroundColor: 'var(--neon-pink)',
                                boxShadow: '0 0 10px var(--neon-pink)',
                                clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 50% 100%, 0% 50%)',
                            }} />
                        )}

                        {/* Player Ship */}
                        {(gameStarted || isGameOver) && (
                            <div style={{
                                position: 'absolute',
                                left: `${GAME_WIDTH / 2 - PLAYER_SIZE / 2}px`,
                                bottom: '10px',
                                width: `${PLAYER_SIZE}px`,
                                height: `${PLAYER_SIZE}px`,
                                backgroundColor: 'var(--neon)',
                                boxShadow: '0 0 10px var(--neon)',
                                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                            }} />
                        )}

                        {/* Bullets */}
                        {bullets.map(b => (
                            <div key={b.id} style={{
                                position: 'absolute',
                                left: `${b.x}px`,
                                top: `${b.y}px`,
                                width: `${BULLET_SIZE}px`,
                                height: `${BULLET_SIZE}px`,
                                backgroundColor: '#fff',
                                boxShadow: '0 0 5px #fff',
                                borderRadius: '50%'
                            }} />
                        ))}

                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.4)', zIndex: 20 }}>
                                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>
                                    TIME UP
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {gameStarted && !isGameOver && (
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: 10 }}>
                            Tap area or press SPACE to shoot
                        </p>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">COMBAT LOG</div>
                        <div className="result-stat">{score}</div>
                        <p className="result-text">Enemies neutralized</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Accuracy: Variable<br/>
                            Performance: {score < 10 ? 'Rookie' : score < 20 ? 'Veteran' : 'Ace'}<br/>
                            Sector Status: SECURE
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
