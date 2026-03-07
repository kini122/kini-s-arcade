'use client';

import { useState, useEffect, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const PERSONALITIES = [
    { name: 'Rooftop Philosopher', traits: ['judgmental', 'dramatic', 'crumb-motivated', 'roof supremacist'] },
    { name: 'Street Pigeon Warlord', traits: ['aggressive', 'territorial', 'fry thief', 'zero fear of humans'] },
    { name: 'Mall Pigeon Influencer', traits: ['fashionable', 'photogenic', 'food court regular', 'vibes-based'] },
    { name: 'Park Pigeon Therapist', traits: ['empathetic', 'bread-motivated', 'bench philosopher', 'calm energy'] },
    { name: 'Subway Pigeon Outlaw', traits: ['reckless', 'train surfer', 'tunnel vision', 'fearless'] },
    { name: 'Library Pigeon Scholar', traits: ['intellectual', 'quiet chaos', 'lurks in corners', 'surprisingly wise'] },
];

const TOTAL_STEPS = 5;

export default function PigeonPersonality() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);
    const [habitat, setHabitat] = useState('');
    const [strategy, setStrategy] = useState('');
    const [respectSlider, setRespectSlider] = useState(50);
    const [pigeons, setPigeons] = useState([]);
    const [personality, setPersonality] = useState(null);

    // Step 3: Migration animation
    useEffect(() => {
        if (step === 3) {
            const newPigeons = [];
            for (let i = 0; i < 8; i++) {
                newPigeons.push({
                    id: i,
                    top: 10 + Math.random() * 80,
                    delay: i * 0.4,
                    size: 16 + Math.random() * 16,
                });
            }
            setPigeons(newPigeons);
            setTimeout(() => {
                setPersonality(PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]);
                setStep(4);
            }, 4000);
        }
    }, [step]);

    const handleHabitat = useCallback((h) => {
        setHabitat(h);
        setTimeout(() => setStep(1), 300);
    }, []);

    const handleStrategy = useCallback((s) => {
        setStrategy(s);
        setTimeout(() => setStep(2), 300);
    }, []);

    return (
        <div>
            <h2 className="game-title">🐦 PIGEON PERSONALITY</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Habitat */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">STEP 1: HABITAT CHOICE</p>
                    <p className="game-text">Where do you live?</p>
                    <div className="option-group">
                        {['🏙️ Street', '🌳 Park', '🏬 Mall', '🏢 Rooftop'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => handleHabitat(opt)}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 1: Food Strategy */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">STEP 2: FOOD STRATEGY</p>
                    <p className="game-text">How do you obtain fries?</p>
                    <div className="option-group">
                        {['🦹 Steal them', '🥺 Beg pathetically', '⏳ Wait patiently', '😤 Intimidation'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => handleStrategy(opt)}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Social Rank */}
            {step === 2 && (
                <div className="game-step">
                    <p className="game-label">STEP 3: SOCIAL RANK</p>
                    <p className="game-text">How many pigeons respect you?</p>
                    <div className="game-slider-container">
                        <input
                            type="range"
                            className="game-slider"
                            min="0"
                            max="100"
                            value={respectSlider}
                            onChange={(e) => setRespectSlider(e.target.value)}
                        />
                        <div className="game-slider-value">{respectSlider}%</div>
                    </div>
                    <button className="btn" onClick={() => setStep(3)}>
                        BEGIN MIGRATION →
                    </button>
                </div>
            )}

            {/* Step 3: Migration Animation */}
            {step === 3 && (
                <div className="game-step">
                    <p className="game-label">MIGRATION IN PROGRESS</p>
                    <div className="migration-area">
                        {pigeons.map(p => (
                            <div
                                key={p.id}
                                className="flying-pigeon"
                                style={{
                                    top: `${p.top}%`,
                                    fontSize: p.size,
                                    animationDelay: `${p.delay}s`,
                                }}
                            >
                                🐦
                            </div>
                        ))}
                    </div>
                    <p className="game-text" style={{ opacity: 0.5, fontSize: 11 }}>
                        Analyzing flock behavior...
                    </p>
                </div>
            )}

            {/* Step 4: Result */}
            {step === 4 && personality && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">YOUR PIGEON IDENTITY</div>
                        <div className="result-stat" style={{ fontSize: 16 }}>{personality.name}</div>
                        <div className="result-breakdown">
                            <strong>Traits:</strong><br />
                            {personality.traits.map((t, i) => (
                                <span key={i}>• {t}<br /></span>
                            ))}
                        </div>
                        <p className="result-text" style={{ marginTop: 12, fontSize: 11, opacity: 0.5 }}>
                            Habitat: {habitat} | Strategy: {strategy} | Respect: {respectSlider}%
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
