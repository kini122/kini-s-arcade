'use client';

import { useState, useEffect, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const ROASTS = [
    "After analyzing your responses, the AI has concluded that humanity might have peaked already.",
    "The system reviewed your answers three times and is still disappointed.",
    "The AI predicted your future. It mostly involves snacks and questionable decisions.",
    "Our servers had to pause for a moment to process this level of nonsense.",
    "The future is unclear, but one thing is certain: productivity is not involved.",
    "The AI ran 9,000 simulations and every one ended with you scrolling reels at 3AM.",
    "The algorithm expected intelligence but instead discovered vibes.",
    "The AI attempted to understand your logic and immediately gave up.",
    "Your destiny appears to involve procrastination and random internet quizzes.",
    "The system checked your potential and quietly lowered its expectations.",
    "The AI has filed your answers under 'unexplainable behavior'.",
    "Analysis complete. The AI would like to log off now.",
];

const TOTAL_STEPS = 6;

export default function FuturePredictor() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [choice1, setChoice1] = useState('');
    const [choice2, setChoice2] = useState('');
    const [scanLogs, setScanLogs] = useState([]);
    const [simProgress, setSimProgress] = useState(0);
    const [result, setResult] = useState('');

    // Step 0: Calibration with fake progress bar
    useEffect(() => {
        if (step === 0) {
            const interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep(1), 500);
                        return 100;
                    }
                    return p + Math.random() * 15;
                });
            }, 200);
            return () => clearInterval(interval);
        }
    }, [step]);

    // Step 3: Lie detector scan logs
    useEffect(() => {
        if (step === 3) {
            const logs = [
                "[!] Scanning response integrity...",
                "Checking for deception patterns...",
                "Cross-referencing with pigeon database...",
                "[!] LIE DETECTED in response #2",
                "Rechecking honesty level...",
                "Suspicion level: EXTREMELY HIGH",
                "Subject classified as: UNRELIABLE",
            ];
            logs.forEach((log, i) => {
                setTimeout(() => {
                    setScanLogs(prev => [...prev, log]);
                }, (i + 1) * 500);
            });
            setTimeout(() => setStep(4), 4000);
        }
    }, [step]);

    // Step 4: Timeline simulation
    useEffect(() => {
        if (step === 4) {
            const interval = setInterval(() => {
                setSimProgress(p => {
                    if (p >= 9000) {
                        clearInterval(interval);
                        setTimeout(() => {
                            setResult(ROASTS[Math.floor(Math.random() * ROASTS.length)]);
                            setStep(5);
                        }, 800);
                        return 9000;
                    }
                    return p + Math.floor(Math.random() * 800);
                });
            }, 150);
            return () => clearInterval(interval);
        }
    }, [step]);

    const handleStep1Next = useCallback(() => {
        if (choice1) setStep(2);
    }, [choice1]);

    const handleStep2Next = useCallback(() => {
        if (choice2) setStep(3);
    }, [choice2]);

    return (
        <div>
            <h2 className="game-title">🔮 AI FUTURE PREDICTOR</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Calibration */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">CALIBRATING PERSONALITY SENSORS</p>
                    <p className="game-text">Place your finger on the screen...</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <p className="game-text" style={{ fontSize: 11, opacity: 0.5 }}>
                        {progress < 30 ? 'Detecting presence...' :
                            progress < 60 ? 'Reading energy levels...' :
                                progress < 90 ? 'Analyzing aura...' : 'Calibration complete!'}
                    </p>
                </div>
            )}

            {/* Step 1: Identity Scan */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">STEP 1: IDENTITY SCAN</p>
                    <p className="game-text">How many pigeons could you fight?</p>
                    <div className="option-group">
                        {['1', '5', 'Emotionally', 'I would join them'].map(opt => (
                            <button
                                key={opt}
                                className={`option-btn ${choice1 === opt ? 'selected' : ''}`}
                                onClick={() => setChoice1(opt)}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                    <button className="btn" onClick={handleStep1Next} disabled={!choice1}>
                        NEXT →
                    </button>
                </div>
            )}

            {/* Step 2: Lifestyle Mapping */}
            {step === 2 && (
                <div className="game-step">
                    <p className="game-label">STEP 2: LIFESTYLE MAPPING</p>
                    <p className="game-text">Choose your midnight habit:</p>
                    <div className="option-group">
                        {['Doomscrolling', 'Midnight snacks', 'Existential dread', 'Conspiracy research'].map(opt => (
                            <button
                                key={opt}
                                className={`option-btn ${choice2 === opt ? 'selected' : ''}`}
                                onClick={() => setChoice2(opt)}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                    <button className="btn" onClick={handleStep2Next} disabled={!choice2}>
                        ANALYZE →
                    </button>
                </div>
            )}

            {/* Step 3: Lie Detector */}
            {step === 3 && (
                <div className="game-step">
                    <p className="game-label">STEP 3: LIE DETECTOR</p>
                    <div className="scan-log">
                        {scanLogs.map((log, i) => (
                            <div key={i} className="scan-log-line" style={{ animationDelay: `${i * 0.1}s` }}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Timeline Simulation */}
            {step === 4 && (
                <div className="game-step">
                    <p className="game-label">STEP 4: TIMELINE SIMULATION</p>
                    <p className="game-text">
                        Running {Math.min(simProgress, 9000).toLocaleString()} / 9,000 simulations...
                    </p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(simProgress / 9000) * 100}%` }} />
                    </div>
                    <p className="game-text" style={{ fontSize: 11, opacity: 0.5 }}>
                        Timeline stability: {Math.max(5, 100 - Math.floor(simProgress / 120))}%
                    </p>
                </div>
            )}

            {/* Step 5: Final Roast */}
            {step === 5 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">FUTURE ANALYSIS COMPLETE</div>
                        <p className="result-text">{result}</p>
                        <a
                            className="result-link"
                            href="https://www.youtube.com/shorts/tXkoRhESq4w"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            🔗 This link might save your life
                        </a>
                    </div>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )}
        </div>
    );
}
