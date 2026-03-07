'use client';

import { useArcade } from '../context/ArcadeContext';

export default function MachineCard({ id, emoji, title, desc, delay }) {
    const { openGame } = useArcade();

    return (
        <div
            className={`machine-card delay-${delay + 1}`}
            onClick={() => openGame(id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openGame(id)}
            id={`machine-${id}`}
        >
            <span className="machine-card-emoji">{emoji}</span>
            <h2 className="machine-card-title">{title}</h2>
            <p className="machine-card-desc">{desc}</p>
            <div className="machine-card-cost">1 COIN</div>
        </div>
    );
}
