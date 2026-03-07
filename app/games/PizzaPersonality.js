'use client';

import { useState } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const PERSONALITIES = [
    { name: 'Pineapple Chaos', desc: 'You thrive in controversy. Bold, unpredictable, and mildly offensive to traditionalists.' },
    { name: 'Extra Cheese Oracle', desc: 'Comfort is your religion. You value security, warmth, and excessive dairy.' },
    { name: 'Burnt Edge Rebel', desc: 'You pretend to like things that are slightly wrong. Edgy but in a pizza way.' },
    { name: 'Foldable Philosopher', desc: 'Efficient, thoughtful, and suspicious of people who use a fork.' },
    { name: 'Crust-First Anarchist', desc: 'You start with the worst part. Masochist energy but with carbs.' },
    { name: 'Thin Crust Minimalist', desc: 'Less is more. You probably also have a capsule wardrobe.' },
];

const TOTAL_STEPS = 4;

export default function PizzaPersonality() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);
    const [crust, setCrust] = useState('');
    const [topping, setTopping] = useState('');
    const [style, setStyle] = useState('');
    const [personality, setPersonality] = useState(null);

    const reveal = () => {
        setPersonality(PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]);
        setStep(3);
    };

    return (
        <div>
            <h2 className="game-title">🍕 PIZZA PERSONALITY</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Crust */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">STEP 1: CRUST TYPE</p>
                    <p className="game-text">Choose your crust destiny:</p>
                    <div className="option-group">
                        {['🍞 Thick & Fluffy', '📄 Thin & Crispy', '🧀 Stuffed Crust', '🫓 No Crust (gluten rebel)'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setCrust(opt); setStep(1); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 1: Topping */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">STEP 2: TOPPING</p>
                    <p className="game-text">This choice will be judged:</p>
                    <div className="option-group">
                        {['🍍 Pineapple (brave)', '🧀 Extra cheese (safe)', '🌶️ Hot peppers (chaotic)', '🍄 Mushrooms (mysterious)'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setTopping(opt); setStep(2); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Eating Style */}
            {step === 2 && (
                <div className="game-step">
                    <p className="game-label">STEP 3: EATING STYLE</p>
                    <p className="game-text">How do you consume pizza?</p>
                    <div className="option-group">
                        {['🙏 Fold it', '🍴 Fork and knife', '🤲 Flat bite', '😈 Crust first'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setStyle(opt); reveal(); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Result */}
            {step === 3 && personality && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">YOUR PIZZA PERSONALITY</div>
                        <div className="result-stat" style={{ fontSize: 16 }}>{personality.name}</div>
                        <p className="result-text">{personality.desc}</p>
                        <p className="result-text" style={{ fontSize: 11, opacity: 0.4, marginTop: 12 }}>
                            {crust} + {topping} + {style}
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
