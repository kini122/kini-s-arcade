'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const VIEW_WIDTH = 260;
const GAME_HEIGHT = 200;
const PLAYER_SIZE = 16;
const GRAVITY = 0.5;
const JUMP_POWER = -7;
const MOVE_SPEED = 3;

const LEVEL_DATA = [
    { x: 0, y: 180, w: 100, h: 20, type: 1 }, 
    { x: 130, y: 150, w: 40, h: 10, type: 1 }, 
    { x: 200, y: 180, w: 80, h: 20, type: 1 }, 
    { x: 320, y: 130, w: 40, h: 10, type: 1 }, 
    { x: 400, y: 180, w: 150, h: 20, type: 1 }, 
    { x: 500, y: 140, w: 10, h: 40, type: 2 }  
];

export default function NeonPlumber() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWin, setIsWin] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    // Player state for render
    const [cameraX, setCameraX] = useState(0);
    const [player, setPlayer] = useState({ x: 20, y: 100 });

    const pRef = useRef({ x: 20, y: 100, vx: 0, vy: 0, grounded: false });
    const keysRef = useRef({ left: false, right: false, up: false });
    const gameOverRef = useRef(false);
    const animationRef = useRef(null);

    const startGame = () => {
        setIsGameOver(false);
        setIsWin(false);
        gameOverRef.current = false;
        setGameStarted(true);
        setStep(0);
        
        pRef.current = { x: 20, y: 100, vx: 0, vy: 0, grounded: false };
        setPlayer({ x: 20, y: 100 });
        setCameraX(0);

        keysRef.current = { left: false, right: false, up: false };

        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(gameLoop);
    };

    const handleGameOver = (win) => {
        reportScore(win ? 1000 : 0);
        setIsGameOver(true);
        setIsWin(win);
        gameOverRef.current = true;
        setGameStarted(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setTimeout(() => setStep(1), 1500);
    };

    const checkCollision = (p, obj) => {
        return (
            p.x < obj.x + obj.w &&
            p.x + PLAYER_SIZE > obj.x &&
            p.y < obj.y + obj.h &&
            p.y + PLAYER_SIZE > obj.y
        );
    };

    const gameLoop = () => {
        if (gameOverRef.current) return;

        let p = pRef.current;
        let keys = keysRef.current;

        // Apply input
        if (keys.left) p.vx = -MOVE_SPEED;
        else if (keys.right) p.vx = MOVE_SPEED;
        else p.vx = 0;

        if (keys.up && p.grounded) {
            p.vy = JUMP_POWER;
            p.grounded = false;
        }

        // Apply gravity
        p.vy += GRAVITY;

        // Update X and check collisions
        p.x += p.vx;
        
        // Block off left screen edge
        if (p.x < 0) p.x = 0;

        for (let obj of LEVEL_DATA) {
            if (obj.type === 1 && checkCollision(p, obj)) {
                if (p.vx > 0) p.x = obj.x - PLAYER_SIZE;
                else if (p.vx < 0) p.x = obj.x + obj.w;
                p.vx = 0;
            }
        }

        // Update Y and check collisions
        p.y += p.vy;
        p.grounded = false;

        for (let obj of LEVEL_DATA) {
            if (checkCollision(p, obj)) {
                if (obj.type === 2) {
                    // Touched flag!
                    handleGameOver(true);
                    return;
                }
                if (obj.type === 1) {
                    if (p.vy > 0) { // falling
                        p.y = obj.y - PLAYER_SIZE;
                        p.grounded = true;
                        p.vy = 0;
                    } else if (p.vy < 0) { // jumping up hitting ceiling
                        p.y = obj.y + obj.h;
                        p.vy = 0;
                    }
                }
            }
        }

        // Death by falling
        if (p.y > GAME_HEIGHT) {
            handleGameOver(false);
            return;
        }

        pRef.current = p;
        setPlayer({ x: p.x, y: p.y });

        // Update camera
        let newCamX = p.x - VIEW_WIDTH / 2;
        if (newCamX < 0) newCamX = 0;
        setCameraX(newCamX);

        animationRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted || isGameOver) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); } keysRef.current.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); } keysRef.current.right = true;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.code === 'Space') keysRef.current.up = true;
        };
        const handleKeyUp = (e) => {
            if (!gameStarted || isGameOver) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); } keysRef.current.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); } keysRef.current.right = false;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.code === 'Space') keysRef.current.up = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameStarted, isGameOver]);

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div>
            <h2 className="game-title">🍄 NEON PLUMBER</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">WORLD 1-1</span>
                        <span className="game-label" style={{ color: isGameOver ? (isWin ? '#ffea00' : 'var(--neon-pink)') : '#ff0055' }}>
                            {isGameOver ? (isWin ? 'LEVEL CLEARED' : 'GAME OVER') : 'JUMPING'}
                        </span>
                    </div>

                    <div style={{
                        position: 'relative',
                        width: `${VIEW_WIDTH}px`,
                        height: `${GAME_HEIGHT}px`,
                        margin: '0 auto',
                        backgroundColor: '#050508',
                        border: `1px solid ${isGameOver && !isWin ? 'var(--neon-pink)' : '#ff0055'}`,
                        overflow: 'hidden',
                        boxShadow: isGameOver && !isWin ? '0 0 15px var(--neon-pink) inset' : '0 0 10px #ff0055 inset'
                    }}>
                        {!gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                <button className="btn btn-sm" style={{ borderColor: '#ff0055', color: '#ff0055' }} onClick={startGame}>
                                    START ADVENTURE
                                </button>
                            </div>
                        )}

                        <div style={{ position: 'absolute', left: -cameraX, top: 0, width: '100%', height: '100%' }}>
                            {/* Render level */}
                            {(gameStarted || isGameOver) && LEVEL_DATA.map((obj, i) => (
                                <div key={i} style={{
                                    position: 'absolute',
                                    left: `${obj.x}px`,
                                    top: `${obj.y}px`,
                                    width: `${obj.w}px`,
                                    height: `${obj.h}px`,
                                    backgroundColor: obj.type === 1 ? '#00ffcc' : '#ffea00',
                                    boxShadow: `0 0 5px ${obj.type === 1 ? '#00ffcc' : '#ffea00'}`,
                                    borderRadius: '2px'
                                }}>
                                    {obj.type === 2 && <span style={{ position: 'absolute', top: -15, left: -5, fontSize: 10 }}>FLAG</span>}
                                </div>
                            ))}

                            {/* Render Player */}
                            {(gameStarted || isGameOver) && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${player.x}px`,
                                    top: `${player.y}px`,
                                    width: `${PLAYER_SIZE}px`,
                                    height: `${PLAYER_SIZE}px`,
                                    backgroundColor: '#ff0055',
                                    boxShadow: '0 0 10px #ff0055',
                                    borderRadius: '4px'
                                }} />
                            )}
                        </div>

                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isWin ? 'rgba(255,234,0,0.2)' : 'rgba(255,0,85,0.4)', zIndex: 20 }}>
                                <span style={{ color: isWin ? '#ffea00' : 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 2, textShadow: `0 0 10px ${isWin ? '#ffea00' : 'var(--neon-pink)'}` }}>
                                    {isWin ? 'VICTORY' : 'DEFEAT'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Mobile Controls Overlay */}
                    {gameStarted && !isGameOver && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px', margin: '10px auto 0' }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                                <button 
                                    className="btn btn-sm" 
                                    style={{ padding: '15px' }}
                                    onTouchStart={() => keysRef.current.left = true}
                                    onTouchEnd={() => keysRef.current.left = false}
                                    onMouseDown={() => keysRef.current.left = true}
                                    onMouseUp={() => keysRef.current.left = false}
                                    onMouseLeave={() => keysRef.current.left = false}
                                >
                                    ⬅
                                </button>
                                <button 
                                    className="btn btn-sm" 
                                    style={{ padding: '15px' }}
                                    onTouchStart={() => keysRef.current.right = true}
                                    onTouchEnd={() => keysRef.current.right = false}
                                    onMouseDown={() => keysRef.current.right = true}
                                    onMouseUp={() => keysRef.current.right = false}
                                    onMouseLeave={() => keysRef.current.right = false}
                                >
                                    ➡
                                </button>
                            </div>
                            <button 
                                className="btn btn-sm" 
                                style={{ padding: '15px 30px', borderColor: '#ff0055', color: '#ff0055' }}
                                onTouchStart={() => keysRef.current.up = true}
                                onTouchEnd={() => keysRef.current.up = false}
                                onMouseDown={() => keysRef.current.up = true}
                                onMouseUp={() => keysRef.current.up = false}
                                onMouseLeave={() => keysRef.current.up = false}
                            >
                                JUMP
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">{isWin ? 'QUEST COMPLETE' : 'QUEST FAILED'}</div>
                        <div className="result-stat" style={{ color: isWin ? '#ffea00' : 'var(--neon-pink)' }}>
                            {isWin ? 'HERO' : 'GHOST'}
                        </div>
                        <p className="result-text">Flag Captured</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Princess Status: In another castle<br/>
                            Status: {isWin ? 'LEGENDARY' : 'RESPAWNING'}
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
