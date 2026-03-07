'use client';

import { useState, useEffect, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 5;
const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🥝', '🍑', '🥭'];

export default function JuiceIQ() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);
    const [juice, setJuice] = useState('');
    const [duckGuess, setDuckGuess] = useState('');
    const [fruitAnswer, setFruitAnswer] = useState('');
    const [puzzleAnswer, setPuzzleAnswer] = useState('');
    const [targetFruit, setTargetFruit] = useState('');
    const [iqScore, setIqScore] = useState(0);

    useEffect(() => {
        setTargetFruit(FRUITS[Math.floor(Math.random() * FRUITS.length)]);
    }, []);

    const submitDucks = useCallback(() => {
        setStep(2);
    }, []);

    const submitFruit = useCallback(() => {
        setStep(3);
    }, []);

    const submitPuzzle = useCallback(() => {
        const score = 80 + Math.floor(Math.random() * 100);
        setIqScore(score);
        setStep(4);
    }, []);

    return (
        <div>
            <h2 className="game-title">🧃 JUICE IQ TEST</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Choose Juice */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">STEP 1: JUICE SELECTION</p>
                    <p className="game-text">Which juice boosts intelligence?</p>
                    <div className="option-group">
                        {['🍊 Orange Juice', '🥭 Mango Nectar', '🧃 Suspicious Green Juice', '🍇 Grape Mystery'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setJuice(opt); setStep(1); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 1: Guess Ducks */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">STEP 2: DUCK ESTIMATION</p>
                    <p className="game-text">How many ducks are in this image?</p>
                    <div style={{ textAlign: 'center', fontSize: 40, margin: '16px 0', letterSpacing: 4 }}>
                        &gt;o) &gt;o) &gt;o) &gt;o) &gt;o) &gt;o) &gt;o)
                    </div>
                    <input
                        className="game-input"
                        type="number"
                        placeholder="Enter your guess..."
                        value={duckGuess}
                        onChange={(e) => setDuckGuess(e.target.value)}
                    />
                    <button className="btn" onClick={submitDucks} disabled={!duckGuess}>
                        SUBMIT →
                    </button>
                </div>
            )}

            {/* Step 2: Fruit Recognition */}
            {step === 2 && (
                <div className="game-step">
                    <p className="game-label">STEP 3: FRUIT RECOGNITION</p>
                    <p className="game-text">Identify this fruit:</p>
                    <div style={{ textAlign: 'center', fontSize: 64, margin: '16px 0' }}>
                        {targetFruit}
                    </div>
                    <div className="option-group">
                        {['An apple', 'A suspicious fruit', 'I don\'t trust fruits', 'That\'s not a fruit'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setFruitAnswer(opt); submitFruit(); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Logic Puzzle */}
            {step === 3 && (
                <div className="game-step">
                    <p className="game-label">STEP 4: LOGIC PUZZLE</p>
                    <p className="game-text">
                        If a juice box contains 200ml of juice, and you drink 200ml of juice, how much juice is left?
                    </p>
                    <div className="option-group">
                        {['0ml (obviously)', '200ml (quantum juice)', 'The juice was inside you all along', 'I refuse to do math'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setPuzzleAnswer(opt); submitPuzzle(); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Result */}
            {step === 4 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">JUICE INTELLIGENCE SCORE</div>
                        <div className="result-stat">{iqScore}</div>
                        <p className="result-text">
                            {iqScore > 150 ? 'Certified juice genius. You probably drink the suspicious green one.' :
                                iqScore > 120 ? 'Above average. The juice boxes are impressed.' :
                                    'Your juice IQ needs hydration. Drink more.'}
                        </p>
                        <p className="result-text" style={{ fontSize: 11, opacity: 0.4, marginTop: 12 }}>
                            Juice: {juice} | Ducks: {duckGuess}
                        </p>
                    </div>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
