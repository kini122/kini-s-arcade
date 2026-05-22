'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;

export default function BugSquasher() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [misses, setMisses] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Active bugs map: { [index]: timerId }
    const [activeBugs, setActiveBugs] = useState({});
    const activeBugsRef = useRef({});
    
    const scoreRef = useRef(0);
    const missesRef = useRef(0);
    const spawnTimerRef = useRef(null);
    const gameOverRef = useRef(false);

    const startGame = () => {
        setScore(0);
        setMisses(0);
        scoreRef.current = 0;
        missesRef.current = 0;
        setIsGameOver(false);
        gameOverRef.current = false;
        setGameStarted(true);
        setStep(0);
        
        setActiveBugs({});
        activeBugsRef.current = {};

        // Clear any old timers
        Object.values(activeBugsRef.current).forEach(clearTimeout);
        if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
        
        setCountdown(3);
        let currentCount = 3;
        const countInterval = setInterval(() => {
            currentCount -= 1;
            setCountdown(currentCount);
            if (currentCount <= 0) {
                clearInterval(countInterval);
                scheduleNextBug();
            }
        }, 1000);
    };

    const handleGameOver = () => {
        if (typeof reportScore === 'function') reportScore(scoreRef.current * 25);
        setIsGameOver(true);
        gameOverRef.current = true;
        setGameStarted(false);
        
        // Clear all timers
        Object.values(activeBugsRef.current).forEach(clearTimeout);
        setActiveBugs({});
        activeBugsRef.current = {};
        if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
        
        setTimeout(() => setStep(1), 1500);
    };

    const scheduleNextBug = () => {
        if (gameOverRef.current) return;
        
        // Time between bugs decreases as score goes up (FASTER)
        const minDelay = Math.max(100, 400 - scoreRef.current * 10);
        const maxDelay = Math.max(300, 1000 - scoreRef.current * 20);
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;

        spawnTimerRef.current = setTimeout(() => {
            spawnBug();
        }, delay);
    };

    const spawnBug = () => {
        if (gameOverRef.current) return;

        // find available spots
        const available = [];
        for(let i=0; i<9; i++) {
            if (!activeBugsRef.current[i]) available.push(i);
        }
        
        // max 3 bugs at a time
        if (Object.keys(activeBugsRef.current).length >= 3 || available.length === 0) {
            scheduleNextBug();
            return;
        }

        const newBugIndex = available[Math.floor(Math.random() * available.length)];

        // How long the bug stays on screen (FASTER)
        const lifespan = Math.max(400, 1200 - scoreRef.current * 15);

        const timerId = setTimeout(() => {
            handleMiss(newBugIndex);
        }, lifespan);

        activeBugsRef.current = { ...activeBugsRef.current, [newBugIndex]: timerId };
        setActiveBugs(activeBugsRef.current);

        scheduleNextBug();
    };

    const handleMiss = (index) => {
        if (gameOverRef.current) return;
        
        // Bug escaped
        const newBugs = { ...activeBugsRef.current };
        delete newBugs[index];
        activeBugsRef.current = newBugs;
        setActiveBugs(newBugs);

        missesRef.current += 1;
        setMisses(missesRef.current);

        if (missesRef.current >= 3) {
            handleGameOver();
        }
    };

    const hitBug = (index) => {
        if (!gameStarted || gameOverRef.current || countdown > 0) return;

        if (activeBugsRef.current[index]) {
            // Hit!
            clearTimeout(activeBugsRef.current[index]);
            
            const newBugs = { ...activeBugsRef.current };
            delete newBugs[index];
            activeBugsRef.current = newBugs;
            setActiveBugs(newBugs);
            
            scoreRef.current += 1;
            setScore(scoreRef.current);
        } else {
            // Clicked wrong cell (Penalty)
            if (scoreRef.current > 0) {
                scoreRef.current -= 1;
                setScore(scoreRef.current);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
            // eslint-disable-next-line react-hooks/exhaustive-deps
            Object.values(activeBugsRef.current).forEach(clearTimeout);
        };
    }, []);

    return (
        <div>
            <h2 className="game-title">🔨 BUG SQUASHER</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">BUGS: {score}</span>
                        <div style={{ display: 'flex', gap: 5 }}>
                            {/* Health/Misses */}
                            {[...Array(3)].map((_, i) => (
                                <span key={i} style={{ color: i < misses ? '#333' : 'var(--neon-pink)', fontSize: 16 }}>♥</span>
                            ))}
                        </div>
                    </div>

                    <div style={{
                        position: 'relative',
                        width: '240px',
                        height: '240px',
                        margin: '0 auto',
                        backgroundColor: '#050508',
                        border: `1px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '5px',
                        padding: '5px',
                        boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px var(--neon) inset'
                    }}>
                        {!gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                <button className="btn btn-sm" onClick={startGame}>
                                    START DEBUG
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

                        {[...Array(9)].map((_, i) => (
                            <div 
                                key={i}
                                onMouseDown={() => hitBug(i)}
                                onTouchStart={() => hitBug(i)}
                                style={{
                                    backgroundColor: '#111',
                                    border: '1px solid #222',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    touchAction: 'none' // optimize mobile tapping
                                }}
                            >
                                {/* Hole */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '10%',
                                    width: '60%',
                                    height: '20%',
                                    backgroundColor: '#000',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 5px #000 inset'
                                }} />
                                
                                {/* Bug */}
                                {activeBugs[i] && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '20%',
                                        width: '50%',
                                        height: '60%',
                                        backgroundColor: 'var(--neon-pink)',
                                        borderRadius: '50% 50% 10% 10%',
                                        boxShadow: '0 0 10px var(--neon-pink)',
                                        animation: 'popIn 0.1s ease-out'
                                    }}>
                                        {/* Bug eyes */}
                                        <div style={{ position: 'absolute', top: '20%', left: '20%', width: 4, height: 4, backgroundColor: '#fff', borderRadius: '50%' }} />
                                        <div style={{ position: 'absolute', top: '20%', right: '20%', width: 4, height: 4, backgroundColor: '#fff', borderRadius: '50%' }} />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.4)', zIndex: 20 }}>
                                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>
                                    SYSTEM OVERRUN
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
                        <div className="result-title">DEBUG REPORT</div>
                        <div className="result-stat">{score}</div>
                        <p className="result-text">Bugs Squashed</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Misses: {misses}<br/>
                            Status: INFECTED
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        REBOOT SYSTEM
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
