'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const SKILLS = [
    'Professional Overthinker',
    'Expert Napper',
    'Advanced Procrastinator',
    'Certified Snack Sommelier',
    'Elite Doom Scroller',
    'Senior Pigeon Negotiator',
    'Black Belt in Avoiding Responsibilities',
    'PhD in Staring at the Ceiling',
    'Master of Saying "I\'ll Do It Tomorrow"',
    'Licensed Vibe Checker',
    'Quantum Procrastination Engineer',
    'Certified Excuse Generator',
];

const TOTAL_STEPS = 3;

export default function SkillGenerator() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinText, setSpinText] = useState('???');
    const [confidenceSlider, setConfidenceSlider] = useState(50);
    const [skill, setSkill] = useState('');
    const spinInterval = useRef(null);

    // Step 0: Wheel spin
    const startSpin = useCallback(() => {
        setIsSpinning(true);
        let count = 0;
        spinInterval.current = setInterval(() => {
            setSpinText(SKILLS[Math.floor(Math.random() * SKILLS.length)]);
            count++;
            if (count > 20) {
                clearInterval(spinInterval.current);
                setIsSpinning(false);
                const finalSkill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
                setSpinText(finalSkill);
                setSkill(finalSkill);
                setTimeout(() => setStep(1), 800);
            }
        }, 100);
    }, []);

    useEffect(() => {
        return () => {
            if (spinInterval.current) clearInterval(spinInterval.current);
        };
    }, []);

    return (
        <div>
            <h2 className="game-title">🎯 SKILL GENERATOR</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Spin */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">STEP 1: SPIN THE WHEEL</p>
                    <div className={`skill-wheel ${isSpinning ? 'spinning' : 'stopped'}`}>
                        {isSpinning ? '' : spinText}
                    </div>
                    {!isSpinning && (
                        <button className="btn" onClick={startSpin}>
                            🎰 SPIN
                        </button>
                    )}
                </div>
            )}

            {/* Step 1: Confidence */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">STEP 2: CONFIDENCE CALIBRATION</p>
                    <p className="game-text">
                        Skill detected: <strong style={{ color: 'var(--neon)' }}>{skill}</strong>
                    </p>
                    <p className="game-text">How confident are you in this skill?</p>
                    <div className="game-slider-container">
                        <input
                            type="range"
                            className="game-slider"
                            min="0"
                            max="100"
                            value={confidenceSlider}
                            onChange={(e) => setConfidenceSlider(Number(e.target.value))}
                        />
                        <div className="game-slider-value">
                            {confidenceSlider < 30 ? '[:] Barely' :
                                confidenceSlider < 70 ? '(|) Kinda' : '[!] Absolutely'}
                        </div>
                    </div>
                    <button className="btn" onClick={() => setStep(2)}>
                        CONFIRM SKILL →
                    </button>
                </div>
            )}

            {/* Step 2: Result */}
            {step === 2 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">🎯 NEW SKILL UNLOCKED</div>
                        <div className="result-stat" style={{ fontSize: 14, lineHeight: 1.8 }}>
                            {skill}
                        </div>
                        <div className="result-breakdown">
                            [+] Confidence: {confidenceSlider}%<br />
                            [=] Market demand: 0%<br />
                            [^] Certification: Self-issued<br />
                            [$] Career impact: Negligible
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
