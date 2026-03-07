'use client';

export default function OutOfCoins() {
    return (
        <div className="out-of-coins">
            <h2>⚠ OUT OF COINS</h2>
            <p>
                You&apos;ve run out of arcade coins.<br />
                To earn more coins, complete the sacred ritual:
            </p>
            <a
                href="https://www.youtube.com/shorts/tXkoRhESq4w"
                target="_blank"
                rel="noopener noreferrer"
                id="get-coins-link"
            >
                🪙 GET FREE COINS
            </a>
        </div>
    );
}
