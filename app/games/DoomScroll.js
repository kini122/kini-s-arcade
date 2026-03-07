'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import StepIndicator from '../components/StepIndicator';
import { useArcade } from '../context/ArcadeContext';

const FAKE_POSTS = [
    { user: '@pigeon_king', text: '🐦 just taught my pigeon to do taxes. he committed fraud immediately.' },
    { user: '@nap_enthusiast', text: 'fell asleep in a meeting and woke up promoted??' },
    { user: '@juice_lord', text: 'doctors hate this one juice trick (it\'s just water with lemon)' },
    { user: '@chaotic_karen', text: 'i asked the manager to manage ME for once and he cried' },
    { user: '@flat_earth_chef', text: 'made a flat pizza to prove a point. nobody understood.' },
    { user: '@gym_ghost', text: 'signed up for gym. been paying for 3 years. never went.' },
    { user: '@potato_philosopher', text: 'if a potato can become fries, you can become anything' },
    { user: '@midnight_scrollr', text: 'it\'s 4am and i\'m reading about medieval cheese laws' },
    { user: '@conspiracy_carl', text: 'birds aren\'t real but pigeons are. think about it.' },
    { user: '@snack_wizard', text: 'ate an entire pack of oreos and unlocked a new level of regret' },
    { user: '@existential_egg', text: 'who even am i? also who named eggs?' },
    { user: '@wifi_warrior', text: 'lost connection for 5 minutes and almost discovered who i am as a person' },
    { user: '@pasta_guru', text: 'life is just spaghetti. tangled and messy but sometimes delicious' },
    { user: '@cloud_watcher', text: 'that cloud looks like my student loan debt' },
    { user: '@random_cat', text: 'meow. (this got 50k likes)' },
];

const TOTAL_STEPS = 3;

export default function DoomScroll() {
    const { closeGame } = useArcade();
    const [step, setStep] = useState(0);
    const [scrollDepth, setScrollDepth] = useState(0);
    const [warnings, setWarnings] = useState([]);
    const [posts, setPosts] = useState([...FAKE_POSTS]);
    const feedRef = useRef(null);

    // Generate a massive infinite feed
    useEffect(() => {
        let massiveFeed = [];
        for (let i = 0; i < 20; i++) {
            massiveFeed = [...massiveFeed, ...FAKE_POSTS.map(p => ({ ...p, id: Math.random() }))];
        }
        setPosts(massiveFeed);
    }, []);

    const handleScroll = useCallback((e) => {
        const depth = Math.floor(e.target.scrollTop);
        setScrollDepth(depth);

        // Add warnings based on how far they have scrolled down
        if (depth > 500 && !warnings.includes('⚠ 500px scrolled: dignity decreasing')) {
            setWarnings(w => [...w, '⚠ 500px scrolled: dignity decreasing']);
        }
        if (depth > 1200 && !warnings.includes('⚠ 1200px scrolled: brain cells leaving')) {
            setWarnings(w => [...w, '⚠ 1200px scrolled: brain cells leaving']);
        }
        if (depth > 2000 && !warnings.includes('⚠ 2000px scrolled: touch grass alert!')) {
            setWarnings(w => [...w, '⚠ 2000px scrolled: touch grass alert!']);
        }
        if (depth > 3500 && !warnings.includes('⚠ 3500px scrolled: critical damage!!')) {
            setWarnings(w => [...w, '⚠ 3500px scrolled: critical damage!!']);
        }
    }, [warnings]);

    const endScroll = useCallback(() => {
        setStep(1);
    }, []);

    // Step 1: damage calc auto-advance
    useEffect(() => {
        if (step === 1) {
            setTimeout(() => setStep(2), 2000);
        }
    }, [step]);

    return (
        <div>
            <h2 className="game-title">📱 DOOM SCROLL SIM</h2>
            <StepIndicator total={TOTAL_STEPS} current={step} />

            {/* Step 0: Scrolling */}
            {step === 0 && (
                <div className="game-step">
                    <p className="game-label">SCROLL THE FEED</p>
                    <p className="game-text" style={{ fontSize: 11 }}>
                        Scroll depth: {scrollDepth}px
                    </p>

                    <div
                        className="fake-feed"
                        ref={feedRef}
                        onScroll={handleScroll}
                        style={{ maxHeight: '250px', overflowY: 'scroll', border: '1px solid var(--neon)', padding: '10px' }}
                    >
                        {posts.map((post, i) => (
                            <div key={post.id || i} className="fake-post">
                                <strong style={{ color: 'var(--neon-pink)' }}>{post.user}</strong>
                                <br />{post.text}
                            </div>
                        ))}
                    </div>

                    <div style={{ minHeight: '60px', marginTop: '10px' }}>
                        {warnings.map((w, i) => (
                            <div key={i} className="scroll-warning">{w}</div>
                        ))}
                    </div>

                    <button className="btn btn-sm" onClick={endScroll}>
                        STOP SCROLLING
                    </button>
                </div>
            )}

            {/* Step 1: Calculating */}
            {step === 1 && (
                <div className="game-step">
                    <p className="game-label">CALCULATING DAMAGE</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '100%' }} />
                    </div>
                    <p className="game-text" style={{ fontSize: 11 }}>
                        Analyzing scroll velocity and regret levels...
                    </p>
                </div>
            )}

            {/* Step 2: Report */}
            {step === 2 && (
                <div className="game-step">
                    <div className="result-box">
                        <div className="result-title">SCROLL DAMAGE REPORT</div>
                        <div className="result-stat">{scrollDepth} px</div>
                        <p className="result-text">of your life: scrolled away</p>
                        <div className="result-breakdown">
                            📏 Scrolling distance: {(scrollDepth / 100).toFixed(1)} meters<br />
                            🧠 Brain cells lost: {Math.floor(scrollDepth / 50)}<br />
                            📉 Dignity remaining: {Math.max(0, 100 - Math.floor(scrollDepth / 30))}%<br />
                            🌱 Grass touch probability: {Math.max(0, 50 - Math.floor(scrollDepth / 40))}%
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
