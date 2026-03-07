'use client';

import { useState, useEffect, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const DECISIONS = [
    "Eat something", "Drink water", "Touch grass", "Take a nap",
    "Question your life choices", "Open Instagram again",
    "Stare at the ceiling for 20 minutes", "Make a slightly chaotic decision",
    "Reply to that text you've been ignoring", "Start a hobby you'll quit in 3 days",
    "Research a career change at 2 AM", "Buy something questionable online",
    "Write a manifesto about snacks", "Become a pigeon observer",
];

const TOTAL_STEPS = 5;

export default function LifeDecisionEngine() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);
    const [energy, setEnergy] = useState('');
    const [riskSlider, setRiskSlider] = useState(50);
    const [snack, setSnack] = useState('');
    const [calcLogs, setCalcLogs] = useState([]);
    const [decision, setDecision] = useState('');

    // Step 3: Algorithm simulation
    useEffect(() => {
        if (step === 3) {
            const logs = [
                "Calculating destiny vectors...",
                "Evaluating laziness index...",
                "Cross-referencing snack alignment...",
                `Risk tolerance: ${riskSlider}%`,
                `Energy classification: ${energy}`,
                "Running quantum indecision algorithm...",
                "Consulting the void...",
                "Decision generated.",
            ];
            logs.forEach((log, i) => {
                setTimeout(() => setCalcLogs(prev => [...prev, log]), (i + 1) * 500);
            });
            setTimeout(() => {
                setDecision(DECISIONS[Math.floor(Math.random() * DECISIONS.length)]);
                setStep(4);
            }, 5000);
        }
    }, [step, energy, riskSlider]);

    return (
        <div>
            <h2 className="game-title">🎲 LIFE DECISION ENGINE</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Energy Level */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">STEP 1: ENERGY ASSESSMENT</p>
                    <p className="game-text">Current energy level?</p>
                    <div className="option-group">
                        {['🥔 Potato', '😐 Mildly alive', '⚡ Chaos mode'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setEnergy(opt); setStep(1); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 1: Risk Tolerance */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">STEP 2: RISK TOLERANCE</p>
                    <p className="game-text">How reckless are you feeling?</p>
                    <div className="game-slider-container">
                        <input
                            type="range"
                            className="game-slider"
                            min="0"
                            max="100"
                            value={riskSlider}
                            onChange={(e) => setRiskSlider(Number(e.target.value))}
                        />
                        <div className="game-slider-value">
                            {riskSlider < 30 ? '🐌 Safe zone' : riskSlider < 70 ? '🎲 Mid chaos' : '🔥 Full send'}
                        </div>
                    </div>
                    <button className="btn" onClick={() => setStep(2)}>
                        NEXT →
                    </button>
                </div>
            )}

            {/* Step 2: Snack Alignment */}
            {step === 2 && (
                <div className="game-step">
                    <p className="game-label">STEP 3: SNACK ALIGNMENT</p>
                    <p className="game-text">Choose your spiritual snack:</p>
                    <div className="option-group">
                        {['🍕 Pizza', '🌮 Tacos', '🧃 Juice box', '🍿 Popcorn'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setSnack(opt); setStep(3); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Algorithm Simulation */}
            {step === 3 && (
                <div className="game-step">
                    <p className="game-label">COMPUTING YOUR DESTINY</p>
                    <div className="scan-log">
                        {calcLogs.map((log, i) => (
                            <div key={i} className="scan-log-line" style={{ animationDelay: `${i * 0.1}s` }}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Decision */}
            {step === 4 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">THE ALGORITHM HAS SPOKEN</div>
                        <p className="game-text" style={{ fontSize: 11, opacity: 0.5, marginBottom: 16 }}>
                            Your next action:
                        </p>
                        <div className="result-stat" style={{ fontSize: 16, lineHeight: 1.6 }}>
                            {decision}
                        </div>
                    </div>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
