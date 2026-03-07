'use client';

import { useState, useEffect } from 'react';

export default function CoinInsert({ onComplete }) {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 600),
            setTimeout(() => setPhase(2), 1200),
            setTimeout(() => setPhase(3), 1800),
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 2200),
        ];
        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <div className="coin-insert">
            {phase >= 0 && (
                <div className="coin-insert-text">INSERTING COIN...</div>
            )}
            {phase >= 1 && (
                <div className="coin-drop">🪙</div>
            )}
            {phase >= 2 && (
                <div className="coin-clink">CLINK!</div>
            )}
            {phase >= 3 && (
                <div className="coin-insert-text" style={{ marginTop: 16 }}>
                    BOOTING MACHINE...
                </div>
            )}
        </div>
    );
}
