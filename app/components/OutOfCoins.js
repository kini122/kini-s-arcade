'use client';

import { useArcade } from '../context/ArcadeContext';
import { useState, useEffect } from 'react';

export default function OutOfCoins() {
    const { addCoins, closeGame } = useArcade();
    const [waitingForReturn, setWaitingForReturn] = useState(false);

    useEffect(() => {
        if (!waitingForReturn) return;

        // When the user comes back to the tab, trigger this
        const handleFocus = () => {
            // Give them 3 coins and close the modal
            addCoins(3);
            closeGame();
            setWaitingForReturn(false);
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [waitingForReturn, addCoins, closeGame]);

    return (
        <div className="out-of-coins">
            <h2>🪙 OUT OF COINS</h2>
            <p>
                You&apos;ve run out of arcade coins.<br />
                To earn more coins, complete the sacred ritual:
            </p>
            <a
                href="https://www.youtube.com/shorts/tXkoRhESq4w"
                target="_blank"
                rel="noopener noreferrer"
                id="get-coins-link"
                onClick={() => setWaitingForReturn(true)}
            >
                📺 GET FREE COINS
            </a>
        </div>
    );
}
