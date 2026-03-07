'use client';

import { useState, useEffect } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const FORTUNES = [
    "Your future will unravel like cheap toilet paper.",
    "The porcelain oracle sees greatness... in very small doses.",
    "You will find unexpected wisdom in a bathroom stall.",
    "The flush of destiny reveals: you need more fiber in your life.",
    "The sacred roll predicts you will make a questionable decision today.",
    "Your life trajectory is currently circling the drain. But in a fun way.",
    "The toilet spirits say: invest in bidets.",
    "Ancient toilet wisdom: he who scrolls too long gets leg cramps.",
];

const TOTAL_STEPS = 4;

export default function ToiletFortune() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);
    const [brand, setBrand] = useState('');
    const [direction, setDirection] = useState('');
    const [flushPhase, setFlushPhase] = useState(0);
    const [fortune, setFortune] = useState('');

    // Step 2: Flush animation
    useEffect(() => {
        if (step === 2) {
            const phases = [1, 2, 3, 4];
            phases.forEach((p, i) => {
                setTimeout(() => setFlushPhase(p), (i + 1) * 800);
            });
            setTimeout(() => {
                setFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
                setStep(3);
            }, 4000);
        }
    }, [step]);

    return (
        <div>
            <h2 className="game-title">🧻 TOILET FORTUNE</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Brand */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">STEP 1: CHOOSE YOUR TP</p>
                    <p className="game-text">Select your toilet paper destiny:</p>
                    <div className="option-group">
                        {['👑 Royal 3-Ply', '💰 Budget Single-Ply', '🌿 Organic Bamboo', '🗿 Mystery Brand'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setBrand(opt); setStep(1); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 1: Direction */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">STEP 2: ROLL DIRECTION</p>
                    <p className="game-text">This choice defines your soul:</p>
                    <div className="option-group">
                        {['➡️ Over (correct)', '⬅️ Under (chaotic)', '🔄 Sideways (unhinged)', '🚫 No holder (feral)'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setDirection(opt); setStep(2); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Flush */}
            {step === 2 && (
                <div className="game-step">
                    <p className="game-label">FLUSHING DESTINY</p>
                    <div style={{ textAlign: 'center', fontSize: 48, margin: '20px 0' }}>
                        {flushPhase === 0 && '[o]'}
                        {flushPhase === 1 && '(*)'}
                        {flushPhase === 2 && '(~)'}
                        {flushPhase === 3 && '(@)'}
                        {flushPhase === 4 && '(+)'}
                    </div>
                    <div className="scan-log">
                        {flushPhase >= 1 && <div className="scan-log-line">Initiating sacred flush...</div>}
                        {flushPhase >= 2 && <div className="scan-log-line" style={{ animationDelay: '0.1s' }}>Water spiraling clockwise...</div>}
                        {flushPhase >= 3 && <div className="scan-log-line" style={{ animationDelay: '0.2s' }}>Reading porcelain omens...</div>}
                        {flushPhase >= 4 && <div className="scan-log-line" style={{ animationDelay: '0.3s' }}>Fortune extracted!</div>}
                    </div>
                </div>
            )}

            {/* Step 3: Fortune */}
            {step === 3 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">🧻 YOUR TOILET FORTUNE</div>
                        <p className="result-text">{fortune}</p>
                        <p className="result-text" style={{ fontSize: 11, opacity: 0.4, marginTop: 12 }}>
                            TP: {brand} | Roll: {direction}
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
