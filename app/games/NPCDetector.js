'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const COLORS = ['#ff0055', '#00ffcc']; // Red/Pink (0), Cyan (1)
const SHAPES = ['square', 'circle'];   // Square (0), Circle (1)

export default function QuantumSort() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [packet, setPacket] = useState(null); // { id, colorIndex, shapeIndex }
    const [currentRule, setCurrentRule] = useState('COLOR'); // 'COLOR' or 'SHAPE'
    const [timeLeft, setTimeLeft] = useState(100); 
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const timerRef = useRef(null);
    const packetRef = useRef(null);
    const ruleRef = useRef('COLOR');
    const timeLimitRef = useRef(2500); 
    const startTimeRef = useRef(0);

    const spawnPacket = (currentScore) => {
        // Change rule occasionally (20% chance after score 3)
        let newRule = ruleRef.current;
        if (currentScore > 3 && Math.random() < 0.2) {
            newRule = newRule === 'COLOR' ? 'SHAPE' : 'COLOR';
        }
        setCurrentRule(newRule);
        ruleRef.current = newRule;

        // Decrease time limit as score increases
        const newTimeLimit = Math.max(1000, 2500 - (currentScore * 40));
        timeLimitRef.current = newTimeLimit;
        
        const newPacket = {
            id: Math.random().toString(),
            colorIndex: Math.floor(Math.random() * COLORS.length),
            shapeIndex: Math.floor(Math.random() * SHAPES.length)
        };
        
        setPacket(newPacket);
        packetRef.current = newPacket;
        startTimeRef.current = Date.now();
        setTimeLeft(100);

        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        
        const updateTimer = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = Math.max(0, 100 - (elapsed / newTimeLimit) * 100);
            
            setTimeLeft(remaining);

            if (remaining > 0) {
                timerRef.current = requestAnimationFrame(updateTimer);
            } else {
                handleGameOver();
            }
        };

        timerRef.current = requestAnimationFrame(updateTimer);
    };

    const startGame = () => {
        setScore(0);
        setIsGameOver(false);
        setGameStarted(true);
        setStep(0);
        setCurrentRule('COLOR');
        ruleRef.current = 'COLOR';
        spawnPacket(0);
    };

    const handleGameOver = () => {
        reportScore(scoreRef.current * 10);
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        setIsGameOver(true);
        setGameStarted(false);
        setPacket(null);
        setTimeout(() => setStep(1), 1500);
    };

    const handleSort = (direction) => {
        if (!gameStarted || isGameOver || !packetRef.current) return;

        const p = packetRef.current;
        const r = ruleRef.current;
        
        let correctDirection;
        if (r === 'COLOR') {
            // 0 (Red) goes left, 1 (Cyan) goes right
            correctDirection = p.colorIndex;
        } else {
            // 0 (Square) goes left, 1 (Circle) goes right
            correctDirection = p.shapeIndex;
        }

        if (direction === correctDirection) {
            // Correct sort!
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
            setScore(s => {
                const newScore = s + 1;
                spawnPacket(newScore);
                return newScore;
            });
        } else {
            // Wrong sort!
            handleGameOver();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted || isGameOver) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); } handleSort(0);
            if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); } handleSort(1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameStarted, isGameOver]);

    useEffect(() => {
        return () => {
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
        };
    }, []);

    return (
        <div>
            <h2 className="game-title">🔀 QUANTUM SORT</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">PACKETS: {score}</span>
                        <span className="game-label" style={{ color: isGameOver ? 'var(--neon-pink)' : 'var(--neon)' }}>
                            {isGameOver ? 'CORRUPTION' : 'ROUTING'}
                        </span>
                    </div>

                    <div style={{
                        position: 'relative',
                        height: '240px',
                        backgroundColor: '#050508',
                        border: `1px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {!gameStarted && !isGameOver && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 20, padding: '0 20px' }}>
                                    Follow the ACTIVE RULE.<br/><br/>
                                    If COLOR: Red = Left, Cyan = Right<br/>
                                    If SHAPE: Square = Left, Circle = Right
                                </p>
                                <button className="btn btn-sm" onClick={startGame} style={{ zIndex: 10 }}>
                                    INITIATE
                                </button>
                            </div>
                        )}

                        {/* ACTIVE RULE DISPLAY */}
                        {gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', top: 15, textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: '#666', letterSpacing: 2 }}>ACTIVE RULE</div>
                                <div style={{ 
                                    fontSize: 24, 
                                    fontWeight: 'bold', 
                                    color: currentRule === 'COLOR' ? '#ff0055' : '#00ffcc',
                                    textShadow: `0 0 10px ${currentRule === 'COLOR' ? '#ff0055' : '#00ffcc'}`
                                }}>
                                    {currentRule}
                                </div>
                            </div>
                        )}

                        {/* PACKET */}
                        {gameStarted && packet && !isGameOver && (
                            <div style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: COLORS[packet.colorIndex],
                                boxShadow: `0 0 20px ${COLORS[packet.colorIndex]}`,
                                borderRadius: packet.shapeIndex === 1 ? '50%' : '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 'bold',
                                zIndex: 5,
                                animation: 'popIn 0.2s ease-out'
                            }}>
                                DATA
                            </div>
                        )}

                        {/* Progress bar below packet */}
                        {gameStarted && packet && !isGameOver && (
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                width: '120px',
                                height: '4px',
                                backgroundColor: '#333'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${timeLeft}%`,
                                    backgroundColor: timeLeft > 30 ? 'var(--neon)' : 'var(--neon-pink)',
                                    transition: 'width 0.1s linear'
                                }} />
                            </div>
                        )}

                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.2)' }}>
                                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>
                                    SORT FAILED
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Sorting Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15, opacity: gameStarted && !isGameOver ? 1 : 0.3 }}>
                        <button className="btn" style={{ flex: 1, marginRight: 10, borderColor: '#fff' }} onClick={() => handleSort(0)}>
                            ← LEFT BIN<br/>
                            <span style={{ fontSize: 10, color: '#aaa', borderTop: '1px solid #333', display: 'block', paddingTop: 4, marginTop: 4 }}>Red or Square</span>
                        </button>
                        <button className="btn" style={{ flex: 1, borderColor: '#fff' }} onClick={() => handleSort(1)}>
                            RIGHT BIN →<br/>
                            <span style={{ fontSize: 10, color: '#aaa', borderTop: '1px solid #333', display: 'block', paddingTop: 4, marginTop: 4 }}>Cyan or Circle</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">ROUTING SUMMARY</div>
                        <div className="result-stat">{score}</div>
                        <p className="result-text">Packets logically sorted</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Reaction Speed: {timeLimitRef.current}ms<br/>
                            Cognition: {score < 10 ? 'Poor' : score < 25 ? 'Standard' : 'Machine-like'}<br/>
                            Network: HALTED
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        RESTART NETWORK
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
