'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2; // Step 0: Play, Step 1: Result
const WORD_LIST = [
    'UPLINK', 'MAINFRAME', 'OVERRIDE', 'PROXY', 'SYNTAX', 'CYBER', 'HACK', 'NODE',
    'TERMINAL', 'BYPASS', 'ENCRYPT', 'DECRYPT', 'FIREWALL', 'SYSTEM', 'ACCESS',
    'DATA', 'CACHE', 'KERNEL', 'LOGIC', 'SERVER', 'ROOT', 'MATRIX', 'GLITCH'
];
const GAME_HEIGHT = 260; // max height of game area

export default function CyberType() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [words, setWords] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    
    // Use refs for values needed in interval to avoid re-triggering useEffect
    const wordsRef = useRef([]);
    const scoreRef = useRef(0);
    const gameOverRef = useRef(false);

    useEffect(() => {
        wordsRef.current = words;
    }, [words]);

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    useEffect(() => {
        gameOverRef.current = isGameOver;
    }, [isGameOver]);

    const handleGameOver = useCallback(() => {
        setIsGameOver(true);
        gameOverRef.current = true;
        setGameStarted(false);
        setTimeout(() => setStep(1), 1500);
    }, []);

    const startGame = () => {
        setWords([]);
        setInputValue('');
        setScore(0);
        setIsGameOver(false);
        setGameStarted(true);
        setStep(0);
        gameOverRef.current = false;
        wordsRef.current = [];
    };

    // Game loop for moving words and spawning new ones
    useEffect(() => {
        if (!gameStarted || isGameOver) return;

        let spawnCounter = 0;
        let speed = 1.2;
        let spawnRate = 90; // Frames between spawns (at ~30fps)

        const interval = setInterval(() => {
            if (gameOverRef.current) return;

            // Move words
            let nextWords = wordsRef.current.map(w => ({ ...w, y: w.y + speed }));
            
            // Check for collision with bottom
            if (nextWords.some(w => w.y > GAME_HEIGHT)) {
                handleGameOver();
                return;
            }

            // Spawn new word
            spawnCounter++;
            if (spawnCounter >= spawnRate) {
                spawnCounter = 0;
                const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
                nextWords.push({
                    id: Math.random().toString(),
                    text: randomWord,
                    y: 0,
                    x: Math.floor(Math.random() * 60) + 10 // 10% to 70% left
                });
                
                // Increase difficulty
                if (speed < 4) speed += 0.05;
                if (spawnRate > 30) spawnRate -= 1;
            }

            setWords(nextWords);
        }, 33); // ~30 fps

        return () => clearInterval(interval);
    }, [gameStarted, isGameOver, handleGameOver]);

    const handleInputChange = (e) => {
        if (!gameStarted || isGameOver) return;
        
        const val = e.target.value.toUpperCase();
        setInputValue(val);

        // Check if val matches any word exactly
        const matchIndex = wordsRef.current.findIndex(w => w.text === val);
        if (matchIndex !== -1) {
            // Word typed correctly!
            setInputValue('');
            setScore(s => s + wordsRef.current[matchIndex].text.length * 10);
            
            // Remove word
            const newWords = [...wordsRef.current];
            newWords.splice(matchIndex, 1);
            setWords(newWords);
        }
    };

    return (
        <div>
            <h2 className="game-title">⌨️ CYBER TYPE</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">SCORE: {score}</span>
                        <span className="game-label" style={{ color: isGameOver ? 'var(--neon-pink)' : 'var(--neon)' }}>
                            {isGameOver ? 'BREACHED' : 'SECURE'}
                        </span>
                    </div>

                    <div style={{
                        position: 'relative',
                        height: `${GAME_HEIGHT}px`,
                        width: '100%',
                        backgroundColor: '#050508',
                        border: `1px solid ${isGameOver ? 'var(--neon-pink)' : 'var(--neon)'}`,
                        boxShadow: isGameOver ? '0 0 10px var(--neon-pink) inset' : '0 0 5px var(--neon) inset',
                        overflow: 'hidden',
                        marginBottom: 10
                    }}>
                        {!gameStarted && !isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                <button className="btn btn-sm" onClick={startGame}>INITIALIZE</button>
                            </div>
                        )}
                        
                        {/* Danger zone line */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '20px',
                            borderTop: '1px dashed var(--neon-pink)',
                            backgroundColor: 'rgba(255,0,85,0.1)'
                        }} />

                        {words.map(w => (
                            <div key={w.id} style={{
                                position: 'absolute',
                                left: `${w.x}%`,
                                top: `${w.y}px`,
                                color: 'var(--neon)',
                                textShadow: '0 0 5px var(--neon)',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                fontFamily: 'monospace'
                            }}>
                                {/* Highlight matched prefix */}
                                <span style={{ color: '#fff', textShadow: '0 0 8px #fff' }}>
                                    {w.text.startsWith(inputValue) ? inputValue : ''}
                                </span>
                                <span>
                                    {w.text.startsWith(inputValue) ? w.text.slice(inputValue.length) : w.text}
                                </span>
                            </div>
                        ))}
                        
                        {isGameOver && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,85,0.3)', color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: 24, letterSpacing: 4, textShadow: '0 0 10px var(--neon-pink)' }}>
                                SYSTEM BREACHED
                            </div>
                        )}
                    </div>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        disabled={!gameStarted || isGameOver}
                        autoFocus
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={gameStarted ? "TYPE HERE..." : ""}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#0a0a0f',
                            border: '1px solid var(--neon)',
                            color: '#fff',
                            fontFamily: 'monospace',
                            fontSize: '16px',
                            textAlign: 'center',
                            outline: 'none',
                            textTransform: 'uppercase'
                        }}
                    />
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">BREACH REPORT</div>
                        <div className="result-stat">{score}</div>
                        <p className="result-text">Data Fragments Secured</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            WPM: {Math.floor(score / 50)}<br/>
                            Accuracy: Questionable<br/>
                            Status: DISCONNECTED
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        RECONNECT
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
