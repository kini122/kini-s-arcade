'use client';

import { useState } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2;
const MAX_GUESSES = 6;
const DIGITS = [1, 2, 3, 4, 5, 6];

export default function CodeBreaker() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [secretCode, setSecretCode] = useState([]);
    const [guesses, setGuesses] = useState([]);
    const [currentGuess, setCurrentGuess] = useState([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWin, setIsWin] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const generateUniqueCode = () => {
        let code = [];
        let available = [...DIGITS];
        for (let i = 0; i < 3; i++) {
            const idx = Math.floor(Math.random() * available.length);
            code.push(available[idx]);
            available.splice(idx, 1);
        }
        return code;
    };

    const startGame = () => {
        setSecretCode(generateUniqueCode());
        setGuesses([]);
        setCurrentGuess([]);
        setIsGameOver(false);
        setIsWin(false);
        setGameStarted(true);
        setStep(0);
    };

    const handleDigitClick = (digit) => {
        if (!gameStarted || isGameOver || currentGuess.length >= 3) return;
        // In this version, we can let them guess repeats, but they probably shouldn't.
        // Let's prevent them from typing the same digit twice in one guess to save them from themselves.
        if (currentGuess.includes(digit)) return;
        
        setCurrentGuess([...currentGuess, digit]);
    };

    const handleBackspace = () => {
        if (currentGuess.length > 0) {
            setCurrentGuess(currentGuess.slice(0, -1));
        }
    };

    const handleSubmit = () => {
        if (currentGuess.length !== 3) return;

        // Calculate feedback
        let exactMatches = 0;
        let colorMatches = 0;
        
        // Since digits are unique, logic is much simpler
        for (let i = 0; i < 3; i++) {
            if (currentGuess[i] === secretCode[i]) {
                exactMatches++;
            } else if (secretCode.includes(currentGuess[i])) {
                colorMatches++;
            }
        }

        const newGuess = {
            guess: currentGuess,
            exact: exactMatches,
            color: colorMatches
        };

        const newGuesses = [...guesses, newGuess];
        setGuesses(newGuesses);
        setCurrentGuess([]);

        if (exactMatches === 3) {
            setIsWin(true);
            setIsGameOver(true);
            setTimeout(() => setStep(1), 1000);
        } else if (newGuesses.length >= MAX_GUESSES) {
            setIsGameOver(true);
            setTimeout(() => setStep(1), 1000);
        }
    };

    return (
        <div>
            <h2 className="game-title">🔐 CODE BREAKER</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step" style={{ padding: '0 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span className="game-label">ATTEMPTS: {guesses.length}/{MAX_GUESSES}</span>
                        <span className="game-label" style={{ color: 'var(--neon)' }}>UNIQUE DIGITS</span>
                    </div>

                    {!gameStarted ? (
                        <div style={{ minHeight: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 20, padding: '0 20px' }}>
                                Crack the 3-digit code.<br/>Digits (1-6) DO NOT repeat.
                            </p>
                            <button className="btn" onClick={startGame}>START HACK</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 250 }}>
                            {/* History */}
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 5 }}>
                                {guesses.map((g, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a0f', padding: '5px 10px', border: '1px solid #333' }}>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            {g.guess.map((d, idx) => (
                                                <span key={idx} style={{ color: 'var(--neon)', fontWeight: 'bold' }}>{d}</span>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            {/* Exact matches */}
                                            {Array.from({ length: g.exact }).map((_, idx) => (
                                                <span key={`e-${idx}`} style={{ color: '#00ffcc', fontSize: 12 }} title="Right Digit, Right Place">✓</span>
                                            ))}
                                            {/* Color matches */}
                                            {Array.from({ length: g.color }).map((_, idx) => (
                                                <span key={`c-${idx}`} style={{ color: '#ffea00', fontSize: 12 }} title="Right Digit, Wrong Place">?</span>
                                            ))}
                                            {/* Misses */}
                                            {Array.from({ length: 3 - g.exact - g.color }).map((_, idx) => (
                                                <span key={`m-${idx}`} style={{ color: '#333', fontSize: 12 }}>X</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Current Input */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 15, padding: '10px 0', borderTop: '1px solid var(--neon)', borderBottom: '1px solid var(--neon)' }}>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} style={{ 
                                        width: 30, 
                                        height: 40, 
                                        border: '1px solid var(--neon)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: 20,
                                        color: '#fff',
                                        boxShadow: currentGuess[i] ? '0 0 5px var(--neon) inset' : 'none'
                                    }}>
                                        {currentGuess[i] || '-'}
                                    </div>
                                ))}
                            </div>

                            {/* Keypad */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                                {DIGITS.map(d => (
                                    <button 
                                        key={d} 
                                        onClick={() => handleDigitClick(d)}
                                        disabled={isGameOver || currentGuess.length >= 3 || currentGuess.includes(d)}
                                        style={{ backgroundColor: '#111', border: '1px solid #333', color: currentGuess.includes(d) ? '#444' : '#fff', padding: '10px 0', cursor: 'pointer' }}
                                    >
                                        {d}
                                    </button>
                                ))}
                                <button 
                                    onClick={handleBackspace}
                                    disabled={isGameOver || currentGuess.length === 0}
                                    style={{ backgroundColor: '#111', border: '1px solid #333', color: 'var(--neon-pink)', padding: '10px 0', cursor: 'pointer' }}
                                >
                                    DEL
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isGameOver || currentGuess.length !== 3}
                                    style={{ backgroundColor: '#111', border: '1px solid var(--neon)', color: 'var(--neon)', padding: '10px 0', cursor: 'pointer', gridColumn: 'span 2' }}
                                >
                                    SUBMIT
                                </button>
                            </div>
                            
                            <div style={{ textAlign: 'center', fontSize: 10, color: '#666' }}>
                                <span style={{ color: '#00ffcc' }}>✓</span> Exact  &nbsp;&nbsp; <span style={{ color: '#ffea00' }}>?</span> Wrong Pos
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">{isWin ? 'ACCESS GRANTED' : 'ACCESS DENIED'}</div>
                        <div className="result-stat" style={{ color: isWin ? 'var(--neon)' : 'var(--neon-pink)' }}>
                            {isWin ? 'HACKED' : 'LOCKED'}
                        </div>
                        <p className="result-text">
                            Secret code was: {secretCode.join('')}
                        </p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            Attempts used: {guesses.length}/{MAX_GUESSES}<br/>
                            Efficiency: {isWin ? `${Math.floor((1 - (guesses.length - 1)/MAX_GUESSES) * 100)}%` : '0%'}
                        </div>
                    </div>
                    <button className="btn" onClick={startGame} style={{ marginBottom: 12 }}>
                        NEW TARGET
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
