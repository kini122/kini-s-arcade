'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const ICONS = ['🍕', '🐦', '🧃', '🧠', '🗿', '🎮', '💀', '🌮'];
const TOTAL_STEPS = 5;

export default function BraincellLab() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);

    // Step 0: Reaction test
    const [reactionStart, setReactionStart] = useState(0);
    const [reactionTime, setReactionTime] = useState(null);
    const [reactionPhase, setReactionPhase] = useState('waiting'); // waiting | ready | click | done
    const reactionTimer = useRef(null);

    // Step 1: Memory test
    const [memoryIcons, setMemoryIcons] = useState([]);
    const [showIcons, setShowIcons] = useState(true);
    const [selectedIcons, setSelectedIcons] = useState([]);

    // Step 2: Focus test
    const [dotPos, setDotPos] = useState({ x: 50, y: 50 });
    const [clickCount, setClickCount] = useState(0);
    const [focusTimeLeft, setFocusTimeLeft] = useState(8);
    const focusInterval = useRef(null);

    // Step 3: Scan logs
    const [scanLogs, setScanLogs] = useState([]);

    // Step 4: result
    const [brainCount, setBrainCount] = useState(0);

    // Init reaction test
    useEffect(() => {
        if (step === 0 && reactionPhase === 'waiting') {
            const delay = 2000 + Math.random() * 3000;
            reactionTimer.current = setTimeout(() => {
                setReactionPhase('ready');
                setReactionStart(Date.now());
            }, delay);
            return () => clearTimeout(reactionTimer.current);
        }
    }, [step, reactionPhase]);

    const handleReactionClick = useCallback(() => {
        if (reactionPhase === 'waiting') return;
        if (reactionPhase === 'ready') {
            setReactionTime(Date.now() - reactionStart);
            setReactionPhase('done');
        }
    }, [reactionPhase, reactionStart]);

    // Init memory test
    useEffect(() => {
        if (step === 1) {
            const shuffled = [...ICONS].sort(() => Math.random() - 0.5).slice(0, 5);
            setMemoryIcons(shuffled);
            setShowIcons(true);
            setSelectedIcons([]);
            const timer = setTimeout(() => setShowIcons(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const toggleMemoryIcon = useCallback((icon) => {
        setSelectedIcons(prev =>
            prev.includes(icon) ? prev.filter(i => i !== icon) : [...prev, icon]
        );
    }, []);

    // Init focus test
    useEffect(() => {
        if (step === 2) {
            setClickCount(0);
            setFocusTimeLeft(8);
            const moveInterval = setInterval(() => {
                setDotPos({
                    x: 10 + Math.random() * 80,
                    y: 10 + Math.random() * 80,
                });
            }, 1000);
            const countdown = setInterval(() => {
                setFocusTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(moveInterval);
                        clearInterval(countdown);
                        setTimeout(() => setStep(3), 500);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            focusInterval.current = moveInterval;
            return () => {
                clearInterval(moveInterval);
                clearInterval(countdown);
            };
        }
    }, [step]);

    // Neural scan
    useEffect(() => {
        if (step === 3) {
            const logs = [
                "Initializing neural scanner...",
                "Scanning brainwaves...",
                "Signal: weak",
                "Retrying with amplified sensors...",
                "Detecting thought patterns...",
                "⚠ Minimal activity found",
                "Cross-referencing with meme database...",
                "Generating report...",
            ];
            logs.forEach((log, i) => {
                setTimeout(() => {
                    setScanLogs(prev => [...prev, log]);
                }, (i + 1) * 600);
            });
            setTimeout(() => {
                setBrainCount(Math.floor(Math.random() * 40) + 3);
                setStep(4);
            }, 5500);
        }
    }, [step]);

    return (
        <div>
            <h2 className="game-title">🧠 BRAINCELL ACTIVITY LAB</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Reaction Test */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">TEST 1: REACTION SPEED</p>
                    <p className="game-text">Click/tap when the box turns green!</p>
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
                            fontSize: 14,
                            fontFamily: 'var(--font-pixel)',
                            transition: 'background 0.2s',
                            background: reactionPhase === 'ready' ? '#00ff88' :
                                reactionPhase === 'done' ? 'var(--neon)' :
                                    'rgba(255, 0, 0, 0.2)',
                            color: reactionPhase === 'ready' ? '#000' :
                                reactionPhase === 'done' ? '#000' : 'var(--text-dim)',
                            border: '1px solid var(--border-glow)',
                        }}
                    >
                        {reactionPhase === 'waiting' && 'WAIT...'}
                        {reactionPhase === 'ready' && 'CLICK NOW!'}
                        {reactionPhase === 'done' && `${reactionTime}ms`}
                    </div>
                    {reactionPhase === 'done' && (
                        <button className="btn" onClick={() => setStep(1)}>
                            NEXT TEST →
                        </button>
                    )}
                </div>
            )}

            {/* Step 1: Memory Test */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">TEST 2: MEMORY</p>
                    <p className="game-text">
                        {showIcons ? 'Memorize these icons!' : 'Select the icons you saw:'}
                    </p>
                    {showIcons ? (
                        <div className="memory-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                            {memoryIcons.map((icon, i) => (
                                <div key={i} className="memory-cell">{icon}</div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="memory-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                {ICONS.map((icon, i) => (
                                    <div
                                        key={i}
                                        className={`memory-cell ${selectedIcons.includes(icon) ? 'selected' : ''}`}
                                        onClick={() => toggleMemoryIcon(icon)}
                                    >
                                        {icon}
                                    </div>
                                ))}
                            </div>
                            <button className="btn" onClick={() => setStep(2)}>
                                SUBMIT →
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Step 2: Focus Test */}
            {step === 2 && (
                <div className="game-step">
                    <p className="game-label">TEST 3: FOCUS</p>
                    <p className="game-text">
                        Click the dot! Time: {focusTimeLeft}s | Hits: {clickCount}
                    </p>
                    <div
                        className="focus-area"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = ((e.clientX - rect.left) / rect.width) * 100;
                            const clickY = ((e.clientY - rect.top) / rect.height) * 100;
                            const distance = Math.sqrt((clickX - dotPos.x) ** 2 + (clickY - dotPos.y) ** 2);
                            if (distance < 15) {
                                setClickCount(c => c + 1);
                                setDotPos({
                                    x: 10 + Math.random() * 80,
                                    y: 10 + Math.random() * 80,
                                });
                            }
                        }}
                    >
                        <div
                            className="focus-dot"
                            style={{ left: `${dotPos.x}%`, top: `${dotPos.y}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Step 3: Neural Scan */}
            {step === 3 && (
                <div className="game-step">
                    <p className="game-label">SCANNING NEURAL ACTIVITY</p>
                    <div className="scan-log">
                        {scanLogs.map((log, i) => (
                            <div key={i} className="scan-log-line" style={{ animationDelay: `${i * 0.1}s` }}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Results */}
            {step === 4 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">BRAIN SCAN COMPLETE</div>
                        <div className="result-stat">{brainCount}</div>
                        <p className="result-text">braincells detected</p>
                        <div className="result-breakdown">
                            📱 60% — scrolling<br />
                            🍕 20% — snack planning<br />
                            😰 15% — random panic<br />
                            🧠 5% — actual thinking
                        </div>
                    </div>
                    <button className="btn btn-pink" onClick={closeGame}>
                        EXIT MACHINE
                    </button>
                </div>
            )
            }
        </div >
    );
}
