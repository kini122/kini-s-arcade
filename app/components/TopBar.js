'use client';

import { useArcade } from '../context/ArcadeContext';

export default function TopBar() {
    const { coins } = useArcade();

    return (
        <header className="topbar">
            <div className="topbar-title">🕹 KINI&apos;S ARCADE</div>
            <div className="topbar-coins">
                <span className="coin-icon">$</span>
                <span>{coins}</span>
            </div>
        </header>
    );
}
