'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const GAME_WIDTH = 260;
const GAME_HEIGHT = 260;
const PADDLE_WIDTH = 50;
const PADDLE_HEIGHT = 10;
const BALL_SIZE = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 5;
const BRICK_WIDTH = 48;
const BRICK_HEIGHT = 15;
const BRICK_PADDING = 2;

export default function BrickBreaker() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWin, setIsWin] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // State for rendering
    const [paddleX, setPaddleX] = useState((GAME_WIDTH - PADDLE_WIDTH) / 2);
    const [ball, setBall] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30 });
    const [bricks, setBricks] = useState([]);

    // Refs for game loop physics
    const paddleXRef = useRef((GAME_WIDTH - PADDLE_WIDTH) / 2);
    const targetXRef = useRef((GAME_WIDTH - PADDLE_WIDTH) / 2);
    // Initial ball speed slowed down to 2
    const ballRef = useRef({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, dx: 2, dy: -2 });
    const bricksRef = useRef([]);
    const gameOverRef = useRef(false);
    const scoreRef = useRef(0);
    const animationRef = useRef(null);

    const initBricks = () => {
        let b = [];
        for (let r = 0; r < BRICK_ROWS; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                b.push({
                    x: c * (BRICK_WIDTH + BRICK_PADDING) + 6,
                    y: r * (BRICK_HEIGHT + BRICK_PADDING) + 30,
                    status: 1
                });
            }
        }
        return b;
    };

    const startGame = () => {
        setScore(0);
        scoreRef.current = 0;
        setIsGameOver(false);
        setIsWin(false);
        gameOverRef.current = false;
        setGameStarted(true);
        setStep(0);
        
        paddleXRef.current = (GAME_WIDTH - PADDLE_WIDTH) / 2;
        targetXRef.current = paddleXRef.current;
        setPaddleX(paddleXRef.current);
        
        ballRef.current = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, dx: 2 * (Math.random() > 0.5 ? 1 : -1), dy: -2 };
        setBall(ballRef.current);
        
        const b = initBricks();
        bricksRef.current = b;
        setBricks(b);

        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        
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

    const handleGameOver = (win) => {
        if (typeof reportScore === 'function') reportScore(scoreRef.current + (win ? 500 : 0));
        setIsGameOver(true);
        setIsWin(win);
        gameOverRef.current = true;
        setGameStarted(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setTimeout(() => setStep(1), 1500);
    };

    const gameLoop = () => {
        if (gameOverRef.current) return;

        // Smooth follow pointer
        if (Math.abs(paddleXRef.current - targetXRef.current) > 1) {
            paddleXRef.current += (targetXRef.current - paddleXRef.current) * 0.4;
            setPaddleX(paddleXRef.current);
        }

        let b = ballRef.current;
        b.x += b.dx;
        b.y += b.dy;

        // Wall collisions
        if (b.x + b.dx > GAME_WIDTH - BALL_SIZE || b.x + b.dx < 0) {
            b.dx = -b.dx;
        }
        if (b.y + b.dy < 0) {
            b.dy = -b.dy;
        } else if (b.y + b.dy > GAME_HEIGHT - BALL_SIZE) {
            // Paddle collision
            if (b.x > paddleXRef.current - BALL_SIZE && b.x < paddleXRef.current + PADDLE_WIDTH) {
                b.dy = -b.dy;
                // Add some english
                b.dx = b.dx + (Math.random() - 0.5);
                b.y = GAME_HEIGHT - PADDLE_HEIGHT - BALL_SIZE - 1; // Prevent sticking
            } else {
                // Game over
                handleGameOver(false);
                return;
            }
        }

        // Brick collision
        let hitBrick = false;
        let nextBricks = [...bricksRef.current];
        for (let i = 0; i < nextBricks.length; i++) {
            let brick = nextBricks[i];
            if (brick.status === 1) {
                if (
                    b.x > brick.x - BALL_SIZE &&
                    b.x < brick.x + BRICK_WIDTH &&
                    b.y > brick.y - BALL_SIZE &&
                    b.y < brick.y + BRICK_HEIGHT
                ) {
                    b.dy = -b.dy;
                    brick.status = 0;
                    hitBrick = true;
                    scoreRef.current += 10;
                    setScore(scoreRef.current);
                    
                    // Increase speed slightly
                    if (b.dy > 0) b.dy += 0.05; else b.dy -= 0.05;
                    if (b.dx > 0) b.dx += 0.02; else b.dx -= 0.02;
                }
            }
        }

        if (hitBrick) {
            bricksRef.current = nextBricks;
            setBricks(nextBricks);
            // Check win
            if (nextBricks.every(br => br.status === 0)) {
                handleGameOver(true);
                return;
            }
        }

        setBall({ ...b });
        ballRef.current = b;

        animationRef.current = requestAnimationFrame(gameLoop);
    };

    // Mouse / Touch follow
    const handleMove = (e) => {
        if (!gameStarted || isGameOver || countdown > 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        let clientX = e.clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        }
        
        let x = clientX - rect.left - PADDLE_WIDTH / 2;
        if (x < 0) x = 0;
        if (x > GAME_WIDTH - PADDLE_WIDTH) x = GAME_WIDTH - PADDLE_WIDTH;
        
        targetXRef.current = x;
    };

    // Keyboard support fallback
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted || isGameOver || countdown > 0) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); } {
                targetXRef.current = Math.max(0, targetXRef.current - 40);
            }
            if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); } {
                targetXRef.current = Math.min(GAME_WIDTH - PADDLE_WIDTH, targetXRef.current + 40);
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
            <h2 className="game-title">🧱 BRICK BREAKER</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">SCORE: {score}</span>
                        <span className="game-label" style={{ color: isGameOver ? (isWin ? '#00ffcc' : 'var(--neon-pink)') : 'var(--neon)' }}>
                            {isGameOver ? (isWin ? 'CLEARED' : 'SYSTEM CRASH') : 'DEFLECTING'}
                        </span>
                    </div>

                    <div 
                        onMouseMove={handleMove}
                        onTouchMove={handleMove}
                        onTouchStart={handleMove}
                        style={{
                            position: 'relative',
                            width: `${GAME_WIDTH}px`,
                            height: `${GAME_HEIGHT}px`,
                            margin: '0 auto',
                            backgroundColor: '#050508',
                            border: `1px solid ${isGameOver && !isWin ? 'var(--neon-pink)' : '#00ffcc'}`,
                            overflow: 'hidden',
                            boxShadow: isGameOver && !isWin ? '0 0 15px var(--neon-pink) inset' : '0 0 10px #00ffcc inset',
                            touchAction: 'none'
                        }}
                    >
                        {!gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                <button className="btn btn-sm" style={{ borderColor: '#00ffcc', color: '#00ffcc' }} onClick={startGame}>
                                    START DEMOLITION
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

                        {/* Bricks */}
                        {(gameStarted || isGameOver) && bricks.map((b, i) => b.status === 1 && (
                            <div key={i} style={{
                                position: 'absolute',
                                left: `${b.x}px`,
                                top: `${b.y}px`,
                                width: `${BRICK_WIDTH}px`,
                                height: `${BRICK_HEIGHT}px`,
                                backgroundColor: `hsl(${(i * 15) % 360}, 100%, 50%)`,
                                boxShadow: `0 0 5px hsl(${(i * 15) % 360}, 100%, 50%)`,
                                borderRadius: '2px'
                            }} />
                        ))}

                        {/* Ball */}
                        {(gameStarted || isGameOver) && (
                            <div style={{
                                position: 'absolute',
                                left: `${ball.x}px`,
                                top: `${ball.y}px`,
                                width: `${BALL_SIZE}px`,
                                height: `${BALL_SIZE}px`,
                                backgroundColor: '#fff',
                                boxShadow: '0 0 5px #fff',
                                borderRadius: '50%'
                            }} />
                        )}

                        {/* Paddle */}
                        {(gameStarted || isGameOver) && (
                            <div style={{
                                position: 'absolute',
                                left: `${paddleX}px`,
                                bottom: '0px',
                                width: `${PADDLE_WIDTH}px`,
                                height: `${PADDLE_HEIGHT}px`,
                                backgroundColor: '#00ffcc',
                                boxShadow: '0 0 10px #00ffcc',
                                borderRadius: '4px 4px 0 0'
                            }} />
                        )}

                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isWin ? 'rgba(0,255,204,0.2)' : 'rgba(255,0,85,0.4)', zIndex: 20 }}>
                                <span style={{ color: isWin ? '#00ffcc' : 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: `0 0 10px ${isWin ? '#00ffcc' : 'var(--neon-pink)'}` }}>
                                    {isWin ? 'WALL BREACHED' : 'BALL DROPPED'}
                                </span>
                            </div>
                        )}
                    </div>

                    {gameStarted && !isGameOver && (
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: 10 }}>
                            Drag finger or move mouse to control paddle
                        </p>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">{isWin ? 'DEMOLITION COMPLETE' : 'DEMOLITION FAILED'}</div>
                        <div className="result-stat" style={{ color: '#00ffcc' }}>{score}</div>
                        <p className="result-text">Data Blocks Smashed</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Bricks Remaining: {bricks.filter(b => b.status === 1).length}<br/>
                            Status: {isWin ? 'FIREWALL BYPASSED' : 'BLOCKED'}
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        RETRY BREACH
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
