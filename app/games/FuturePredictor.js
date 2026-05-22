'use client';

import { useState, useEffect, useRef } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 2; // Step 0: Play, Step 1: Result
const COLORS = ['#ff0055', '#00ffcc', '#bf00ff', '#ffea00'];

export default function MemoryMatrix() {
    const { closeGame, reportScore } = useArcade();
    const [step, setStep] = useState(0);
    const [sequence, setSequence] = useState([]);
    const [playerSequence, setPlayerSequence] = useState([]);
    const [isPlayingSequence, setIsPlayingSequence] = useState(false);
    const [activeColorIndex, setActiveColorIndex] = useState(null);
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState('WATCH THE SEQUENCE');
    const [gameStarted, setGameStarted] = useState(false);

    const playSound = (index) => {
        // Simple synthetic beep based on index could go here
    };

    const addToSequence = () => {
        const nextColor = Math.floor(Math.random() * COLORS.length);
        setSequence(prev => [...prev, nextColor]);
    };

    const startGame = () => {
        setGameStarted(true);
        setSequence([]);
        setPlayerSequence([]);
        setScore(0);
        setTimeout(() => {
            addToSequence();
        }, 500);
    };

    // Play sequence
    useEffect(() => {
        if (sequence.length > 0) {
            setIsPlayingSequence(true);
            setMessage('WATCH THE SEQUENCE');
            let i = 0;
            const interval = setInterval(() => {
                setActiveColorIndex(sequence[i]);
                playSound(sequence[i]);
                setTimeout(() => setActiveColorIndex(null), 300);
                i++;
                if (i >= sequence.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setIsPlayingSequence(false);
                        setMessage('YOUR TURN');
                    }, 400);
                }
            }, 600);
            return () => clearInterval(interval);
        }
    }, [sequence]);

    const handleColorClick = (index) => {
        if (!gameStarted || isPlayingSequence) return;

        playSound(index);
        setActiveColorIndex(index);
        setTimeout(() => setActiveColorIndex(null), 150);

        const newPlayerSequence = [...playerSequence, index];
        setPlayerSequence(newPlayerSequence);

        // Check if correct so far
        const currentIndex = newPlayerSequence.length - 1;
        if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
            // Wrong!
            setMessage('WRONG SEQUENCE!');
            setTimeout(() => {
                setStep(1); // Go to game over
            }, 1000);
            return;
        }

        // Check if completed the sequence
        if (newPlayerSequence.length === sequence.length) {
            setScore(sequence.length);
            setMessage('CORRECT! GET READY...');
            setPlayerSequence([]);
            setIsPlayingSequence(true);
            setTimeout(() => {
                addToSequence();
            }, 1000);
        }
    };

    return (
        <div>
            <h2 className="game-title">🔮 MEMORY MATRIX</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Playing */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">SCORE: {score}</p>
                    <p className="game-text" style={{ color: isPlayingSequence ? 'var(--neon)' : 'var(--neon-pink)', minHeight: 24 }}>
                        {message}
                    </p>

                    {!gameStarted ? (
                        <button className="btn" onClick={startGame} style={{ marginTop: 40, marginBottom: 40 }}>
                            START MATRIX
                        </button>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 16,
                            margin: '20px auto',
                            maxWidth: 240
                        }}>
                            {COLORS.map((color, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleColorClick(i)}
                                    style={{
                                        aspectRatio: '1',
                                        backgroundColor: color,
                                        borderRadius: 8,
                                        cursor: isPlayingSequence ? 'not-allowed' : 'pointer',
                                        opacity: activeColorIndex === i ? 1 : 0.3,
                                        boxShadow: activeColorIndex === i ? `0 0 20px ${color}` : 'none',
                                        transition: 'all 0.1s ease',
                                        transform: activeColorIndex === i ? 'scale(0.95)' : 'scale(1)'
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 1: Result */}
            {step === 1 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">SYSTEM FAILURE</div>
                        <div className="result-stat">LVL {score}</div>
                        <p className="result-text">Memory matrix collapsed.</p>
                        <div className="result-breakdown" style={{ marginTop: 20 }}>
                            {score < 3 ? 'Diagnosis: Goldfish memory' :
                             score < 7 ? 'Diagnosis: Average human cognitive function' :
                             score < 12 ? 'Diagnosis: Superior recall abilities' :
                             'Diagnosis: Cybord entity detected'}
                        </div>
                    </div>
                    <button className="btn" onClick={() => setStep(0)} style={{ marginBottom: 12 }}>
                        TRY AGAIN
                    </button>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
