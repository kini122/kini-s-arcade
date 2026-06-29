'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const GAME_WIDTH = 260;
const GAME_HEIGHT = 220;
const BIRD_SIZE = 15;
const PIPE_WIDTH = 30;
const GAP_SIZE = 75; // slightly larger gap

export default function NeonFlap() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Bird state
    const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
    // Pipes state
    const [pipes, setPipes] = useState([]);

    const birdYRef = useRef(GAME_HEIGHT / 2);
    const velocityYRef = useRef(0);
    const pipesRef = useRef([]);
    const gameOverRef = useRef(false);
    const scoreRef = useRef(0);
    const frameCountRef = useRef(0);

    const animationRef = useRef(null);

    const startGame = () => {
        setScore(0);
        scoreRef.current = 0;
        setIsGameOver(false);
        gameOverRef.current = false;
        setGameStarted(true);
        setStep(0);
        
        setBirdY(GAME_HEIGHT / 2);
        birdYRef.current = GAME_HEIGHT / 2;
        velocityYRef.current = 0;
        
        setPipes([]);
        pipesRef.current = [];
        frameCountRef.current = 0;

        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        setCountdown(3);
        let currentCount = 3;
        const countInterval = setInterval(() => {
            currentCount -= 1;
            setCountdown(currentCount);
            if (currentCount <= 0) {
                clearInterval(countInterval);
                // Initial flap so bird doesn't plummet instantly
                velocityYRef.current = -3; 
                animationRef.current = requestAnimationFrame(gameLoop);
            }
        }, 1000);
    };

    const handleGameOver = () => {
        if (typeof reportScore === 'function') reportScore(scoreRef.current * 50);
        setIsGameOver(true);
        gameOverRef.current = true;
        setGameStarted(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setTimeout(() => setStep(1), 1500);
    };

    const flap = () => {
        if (!gameStarted || isGameOver || countdown > 0) return;
        velocityYRef.current = -4.5; // SLOWED: Flap strength
    };

    const gameLoop = () => {
        if (gameOverRef.current) return;

        // --- BIRD PHYSICS ---
        velocityYRef.current += 0.2; // SLOWED: Gravity (was 0.3)
        birdYRef.current += velocityYRef.current;
        setBirdY(birdYRef.current);

        // Ceiling / Floor collision
        if (birdYRef.current < 0 || birdYRef.current > GAME_HEIGHT - BIRD_SIZE) {
            handleGameOver();
            return;
        }

        // --- PIPES ---
        frameCountRef.current++;
        let nextPipes = [...pipesRef.current];

        // Spawn new pipe
        if (frameCountRef.current % 120 === 0) { // spawn less frequently
            const gapY = Math.random() * (GAME_HEIGHT - GAP_SIZE - 40) + 20; // safe padding
            nextPipes.push({
                x: GAME_WIDTH,
                gapY: gapY,
                passed: false
            });
        }

        // Move pipes
        let hitPipe = false;
        const bX = 50; // Fixed bird X
        const bY = birdYRef.current;

        for (let i = 0; i < nextPipes.length; i++) {
            let p = nextPipes[i];
            p.x -= 1.5; // SLOWED: Pipe speed (was 2)

            // Collision check
            if (
                bX < p.x + PIPE_WIDTH &&
                bX + BIRD_SIZE > p.x
            ) {
                if (bY < p.gapY || bY + BIRD_SIZE > p.gapY + GAP_SIZE) {
                    hitPipe = true;
                }
            }

            // Scoring
            if (!p.passed && p.x + PIPE_WIDTH < bX) {
                p.passed = true;
                scoreRef.current += 1;
                setScore(scoreRef.current);
            }
        }

        if (hitPipe) {
            handleGameOver();
            return;
        }

        // Cleanup offscreen pipes
        nextPipes = nextPipes.filter(p => p.x + PIPE_WIDTH > 0);
        
        pipesRef.current = nextPipes;
        setPipes(nextPipes);

        animationRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' || e.key === 'ArrowUp') {
                
                flap();
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
            <h2 className="game-title">🦅 NEON FLAP</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">SCORE: {score}</span>
                        <span className="game-label" style={{ color: isGameOver ? 'var(--neon-pink)' : '#00ffcc' }}>
                            {isGameOver ? 'CRASHED' : 'FLYING'}
                        </span>
                    </div>

                    <div 
                        onClick={flap}
                        style={{
                            position: 'relative',
                            width: `${GAME_WIDTH}px`,
                            height: `${GAME_HEIGHT}px`,
                            margin: '0 auto',
                            backgroundColor: '#050508',
                            border: `1px solid ${isGameOver ? 'var(--neon-pink)' : '#00ffcc'}`,
                            overflow: 'hidden',
                            boxShadow: isGameOver ? '0 0 15px var(--neon-pink) inset' : '0 0 10px #00ffcc inset',
                            cursor: 'pointer',
                            touchAction: 'none'
                        }}
                    >
                        {!gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                <button className="btn btn-sm" style={{ borderColor: '#00ffcc', color: '#00ffcc' }} onClick={(e) => { e.stopPropagation(); startGame(); }}>
                                    START FLIGHT
                                </button>
                            </div>
                        )}

                        {gameStarted && countdown > 0 && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, backgroundColor: 'rgba(0,0,0,0.4)' }}>
                                <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: 48, textShadow: '0 0 10px #00ffcc' }}>
                                    {countdown}
                                </span>
                            </div>
                        )}

                        {/* Bird */}
                        {(gameStarted || isGameOver) && (
                            <div style={{
                                position: 'absolute',
                                left: '50px',
                                top: `${birdY}px`,
                                width: `${BIRD_SIZE}px`,
                                height: `${BIRD_SIZE}px`,
                                backgroundColor: '#00ffcc',
                                boxShadow: '0 0 10px #00ffcc',
                                borderRadius: '50%'
                            }} />
                        )}

                        {/* Pipes */}
                        {(gameStarted || isGameOver) && pipes.map((p, i) => (
                            <div key={i}>
                                {/* Top Pipe */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${p.x}px`,
                                    top: 0,
                                    width: `${PIPE_WIDTH}px`,
                                    height: `${p.gapY}px`,
                                    backgroundColor: 'var(--neon-pink)',
                                    boxShadow: '0 0 10px var(--neon-pink) inset'
                                }} />
                                {/* Bottom Pipe */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${p.x}px`,
                                    top: `${p.gapY + GAP_SIZE}px`,
                                    width: `${PIPE_WIDTH}px`,
                                    height: `${GAME_HEIGHT - (p.gapY + GAP_SIZE)}px`,
                                    backgroundColor: 'var(--neon-pink)',
                                    boxShadow: '0 0 10px var(--neon-pink) inset'
                                }} />
                            </div>
                        ))}

                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.4)', zIndex: 20 }}>
                                <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: '0 0 10px var(--neon-pink)' }}>
                                    SIGNAL LOST
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {gameStarted && !isGameOver && (
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: 10 }}>
                            Tap area or press SPACE to flap
                        </p>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">FLIGHT LOG TERMINATED</div>
                        <div className="result-stat" style={{ color: '#00ffcc' }}>{score}</div>
                        <p className="result-text">Pipes Cleared</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Piloting: {score < 5 ? 'Novice' : score < 15 ? 'Adept' : 'Master'}<br/>
                            Status: GROUNDED
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        FLY AGAIN
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
