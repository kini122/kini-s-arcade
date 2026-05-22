'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const GAME_SIZE = 280;
const TARGET_SIZE = 40;

export default function ReflexReactor() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [target, setTarget] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [reactionTime, setReactionTime] = useState(0);

    const timeoutRef = useRef(null);
    const startTimeRef = useRef(null);

    const spawnTarget = useCallback((currentScore) => {
        // Calculate max time based on score. Faster as score increases
        const timeLimit = Math.max(800, 2000 - (currentScore * 40));
        
        const newTarget = {
            x: Math.random() * (GAME_SIZE - TARGET_SIZE),
            y: Math.random() * (GAME_SIZE - TARGET_SIZE),
            id: Math.random().toString(),
            timeLimit
        };

        setTarget(newTarget);
        startTimeRef.current = Date.now();

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            // Target expired, game over
            setIsGameOver(true);
            setGameStarted(false);
            setTimeout(() => setStep(1), 1500);
        }, timeLimit);
    }, []);

    const startGame = () => {
        setScore(0);
        setIsGameOver(false);
        setGameStarted(true);
        setStep(0);
        setReactionTime(0);
        spawnTarget(0);
    };

    const handleTargetClick = (e, id) => {
        e.stopPropagation();
        if (!gameStarted || isGameOver || !target || target.id !== id) return;

        // Valid hit
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        const hitTime = Date.now() - startTimeRef.current;
        setReactionTime(hitTime);
        setScore(s => s + 1);
        setTarget(null); // hide immediately

        // Spawn next target shortly after
        setTimeout(() => {
            if (!isGameOver) {
                setScore(s => {
                    spawnTarget(s);
                    return s;
                });
            }
        }, 200);
    };

    const handleMissClick = () => {
        if (!gameStarted || isGameOver) return;
        // Clicked outside target = game over
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsGameOver(true);
        setGameStarted(false);
        setTimeout(() => setStep(1), 1500);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <div>
            <h2 className="game-title">⚡ REFLEX REACTOR</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">SCORE: {score}</span>
                        <span className="game-label" style={{ color: isGameOver ? 'var(--neon-pink)' : 'var(--neon)' }}>
                            {reactionTime > 0 ? `${reactionTime}ms` : 'READY'}
                        </span>
                    </div>

                    <div 
                        onClick={handleMissClick}
                        style={{
                            width: `${GAME_SIZE}px`,
                            height: `${GAME_SIZE}px`,
                            margin: '0 auto',
                            backgroundColor: '#050508',
                            border: `1px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
                            position: 'relative',
                            boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px var(--neon) inset',
                            overflow: 'hidden',
                            cursor: gameStarted ? 'crosshair' : 'default'
                        }}
                    >
                        {!gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); startGame(); }}>
                                    ENGAGE
                                </button>
                            </div>
                        )}
                        
                        {gameStarted && target && !isGameOver && (
                            <div 
                                onClick={(e) => handleTargetClick(e, target.id)}
                                style={{
                                    position: 'absolute',
                                    left: `${target.x}px`,
                                    top: `${target.y}px`,
                                    width: `${TARGET_SIZE}px`,
                                    height: `${TARGET_SIZE}px`,
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--neon)',
                                    boxShadow: '0 0 15px var(--neon), 0 0 30px var(--neon)',
                                    cursor: 'pointer',
                                    animation: 'pulse 0.5s infinite alternate'
                                }}
                            />
                        )}

                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.2)' }}>
                                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>
                                    TARGET MISSED
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">NEURAL RESPONSE</div>
                        <div className="result-stat">{score}</div>
                        <p className="result-text">Targets neutralized</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Best Reaction: {reactionTime}ms<br/>
                            Assessment: {score < 5 ? 'Sluggish' : score < 15 ? 'Acceptable' : 'Cybernetic'}
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        RESTART CALIBRATION
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
