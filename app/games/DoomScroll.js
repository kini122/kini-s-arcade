'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;

const generateLevel = (levelIndex) => {
    // Generate a sequence of operations and a starting number to find a target
    // Keep it extremely simple: Start at 0 or 1.
    const start = Math.floor(Math.random() * 3);
    let target = start;
    
    // Only 2 to 4 simple operations (+2, +3, +5, x2)
    const numOps = 2 + Math.floor(levelIndex / 3);
    
    for (let i = 0; i < numOps; i++) {
        const opType = Math.random();
        if (opType > 0.6 && target > 0 && target < 20) {
            target *= 2;
        } else if (opType > 0.3) {
            target += 5;
        } else {
            target += 2;
        }
    }
    
    return { start, target }; 
};

export default function BinaryBalance() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [level, setLevel] = useState(0);
    const [currentValue, setCurrentValue] = useState(0);
    const [targetValue, setTargetValue] = useState(0);
    
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(100);

    const timerRef = useRef(null);

    const startLevel = (lvlIndex) => {
        const lvlData = generateLevel(lvlIndex);
        setCurrentValue(lvlData.start);
        setTargetValue(lvlData.target);
        setTimeLeft(100);
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(timerRef.current);
                    handleGameOver();
                    return 0;
                }
                // Drain much slower to be friendlier to new players
                return prev - (0.2 + lvlIndex * 0.05); 
            });
        }, 50);
    };

    const startGame = () => {
        setLevel(0);
        setIsGameOver(false);
        setGameStarted(true);
        setStep(0);
        startLevel(0);
    };

    const handleGameOver = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsGameOver(true);
        setTimeout(() => setStep(1), 1500);
    };

    const handleOperation = (type, val) => {
        if (!gameStarted || isGameOver) return;

        let newVal = currentValue;
        if (type === '+') newVal += val;
        if (type === '-') newVal -= val;
        if (type === 'x') newVal *= val;

        setCurrentValue(newVal);

        if (newVal === targetValue) {
            // Level complete!
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => {
                const nextLevel = level + 1;
                setLevel(nextLevel);
                startLevel(nextLevel);
            }, 500);
        } else if (newVal > targetValue * 3 || newVal < -10) {
            // Only fail if they go WAY over. 
            handleGameOver();
        }
    };

    const handleReset = () => {
        // Allow player to reset their current value if they mess up, at a small time cost
        setCurrentValue(0);
        setTimeLeft(prev => Math.max(10, prev - 10)); // penalty for resetting
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <div>
            <h2 className="game-title">⚖️ BINARY BALANCE</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">LEVEL: {level}</span>
                        <span className="game-label" style={{ color: isGameOver ? 'var(--neon-pink)' : 'var(--neon)' }}>
                            {isGameOver ? 'IMBALANCE' : 'BALANCING'}
                        </span>
                    </div>

                    {!gameStarted ? (
                        <div style={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 20, padding: '0 20px' }}>
                                Use math operations to reach the exact target value before time runs out!
                            </p>
                            <button className="btn" onClick={startGame}>EXECUTE MATH</button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            backgroundColor: '#050508',
                            border: `1px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
                            padding: '20px',
                            minHeight: '220px',
                            boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px var(--neon) inset'
                        }}>
                            <div style={{ color: 'var(--neon-pink)', fontSize: 12, marginBottom: 5 }}>
                                TARGET VALUE
                            </div>
                            <div style={{ fontSize: 42, fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px #fff', marginBottom: 15 }}>
                                {targetValue}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: 10, color: '#666' }}>CURRENT</span>
                                    <span style={{ fontSize: 32, color: 'var(--neon)' }}>{currentValue}</span>
                                </div>
                            </div>

                            {!isGameOver && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginBottom: 10 }}>
                                    <button className="btn" style={{ padding: '10px 0', fontSize: 18, borderColor: '#333' }} onClick={() => handleOperation('+', 2)}>+ 2</button>
                                    <button className="btn" style={{ padding: '10px 0', fontSize: 18, borderColor: '#333' }} onClick={() => handleOperation('+', 5)}>+ 5</button>
                                    <button className="btn" style={{ padding: '10px 0', fontSize: 18, borderColor: '#333' }} onClick={() => handleOperation('x', 2)}>x 2</button>
                                    <button className="btn" style={{ padding: '10px 0', fontSize: 18, borderColor: '#333', color: 'var(--neon-pink)' }} onClick={handleReset}>RESET</button>
                                </div>
                            )}

                            {isGameOver && (
                                <div style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 20, marginTop: 10 }}>
                                    LOGIC FAILURE
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timer Bar */}
                    {gameStarted && !isGameOver && (
                        <div style={{ height: 4, width: '100%', backgroundColor: '#111', marginTop: 10 }}>
                            <div style={{ height: '100%', width: `${timeLeft}%`, backgroundColor: timeLeft > 25 ? 'var(--neon)' : 'var(--neon-pink)', transition: 'width 0.05s linear' }} />
                        </div>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">CALCULATION TERMINATED</div>
                        <div className="result-stat">{level}</div>
                        <p className="result-text">Equations Solved</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Math Processing: {level < 3 ? 'Sub-optimal' : level < 7 ? 'Adequate' : 'Quantum'}<br/>
                            Status: OFFLINE
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        RESTART CALCULATION
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
