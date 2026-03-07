'use client';

import { useState, useEffect, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const TOTAL_STEPS = 4;

export default function NPCDetector() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);
    const [routine, setRoutine] = useState('');
    const [reactionPhase, setReactionPhase] = useState('waiting');
    const [reactionClicked, setReactionClicked] = useState(false);
    const [philosophy, setPhilosophy] = useState('');
    const [npcScore, setNpcScore] = useState(0);
    const [scanLogs, setScanLogs] = useState([]);

    // Step 1: Surprise reaction
    useEffect(() => {
        if (step === 1) {
            const timer = setTimeout(() => {
                setReactionPhase('surprise');
            }, 1500 + Math.random() * 2000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // Step 3: Scan + result
    useEffect(() => {
        if (step === 3) {
            const logs = [
                "Analyzing behavioral patterns...",
                "Checking for original thoughts...",
                "Scanning dialogue variety...",
                `Catchphrase frequency: HIGH`,
                "Checking quest log... empty.",
                "Comparing to NPC database...",
                "Classification complete.",
            ];
            logs.forEach((log, i) => {
                setTimeout(() => setScanLogs(prev => [...prev, log]), (i + 1) * 500);
            });
            setTimeout(() => {
                setNpcScore(40 + Math.floor(Math.random() * 55));
            }, 4500);
        }
    }, [step]);

    const handleReactionClick = useCallback(() => {
        if (reactionPhase === 'surprise' && !reactionClicked) {
            setReactionClicked(true);
            setTimeout(() => setStep(2), 500);
        }
    }, [reactionPhase, reactionClicked]);

    return (
        <div>
            <h2 className="game-title">🗿 NPC DETECTOR</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Routine Questions */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">STEP 1: ROUTINE ANALYSIS</p>
                    <p className="game-text">What do you say most often?</p>
                    <div className="option-group">
                        {['"Bro"', '"Literally"', '"No cap"', '"That\'s crazy"', '"It is what it is"'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setRoutine(opt); setStep(1); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 1: Reaction Test */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">STEP 2: REACTION TEST</p>
                    <p className="game-text">Wait for the surprise...</p>
                    <div
                        onClick={handleReactionClick}
                        style={{
                            width: '100%',
                            height: 120,
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: reactionPhase === 'surprise' ? 48 : 14,
                            fontFamily: 'var(--font-pixel)',
                            background: reactionPhase === 'surprise'
                                ? 'rgba(255, 0, 100, 0.2)'
                                : 'rgba(0, 255, 225, 0.04)',
                            border: '1px solid var(--border-glow)',
                            transition: 'all 0.3s',
                        }}
                    >
                        {reactionPhase === 'waiting' && '...'}
                        {reactionPhase === 'surprise' && (reactionClicked ? '✅' : '👻')}
                    </div>
                    {reactionPhase === 'surprise' && !reactionClicked && (
                        <p className="game-text" style={{ marginTop: 8, fontSize: 10, color: 'var(--neon-pink)' }}>
                            TAP IT!
                        </p>
                    )}
                </div>
            )}

            {/* Step 2: Philosophy */}
            {step === 2 && (
                <div className="game-step">
                    <p className="game-label">STEP 3: PHILOSOPHY CHECK</p>
                    <p className="game-text">Do you have free will?</p>
                    <div className="option-group">
                        {['Yes, obviously', 'No, I follow trends', 'I just follow the script', 'What is free will?'].map(opt => (
                            <button key={opt} className="option-btn" onClick={() => { setPhilosophy(opt); setStep(3); setScanLogs([]); }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Result */}
            {step === 3 && (
                <div className="game-step">
                    <p className="game-label">ANALYZING NPC PROBABILITY</p>
                    <div className="scan-log">
                        {scanLogs.map((log, i) => (
                            <div key={i} className="scan-log-line" style={{ animationDelay: `${i * 0.1}s` }}>
                                {log}
                            </div>
                        ))}
                    </div>
                    {npcScore > 0 && (
                        <>
                            <div className="result-box">
                                <div className="result-title">NPC PROBABILITY</div>
                                <div className="result-stat">{npcScore}%</div>
                                <p className="result-text">
                                    {npcScore > 80 ? 'Confirmed NPC. You probably repeat the same 3 lines daily.' :
                                        npcScore > 60 ? 'Side character energy. Important but forgettable.' :
                                            'Possible main character. But the plot is still loading.'}
                                </p>
                            </div>
                            <button className="btn btn-pink" onClick={closeGame}>
                                EXIT MACHINE
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
