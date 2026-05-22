'use client';

import { useArcade } from '../context/ArcadeContext';

export default function Leaderboard() {
    const { nickname, totalScore, isClient } = useArcade();

    const bots = [
        { name: 'giga_pigeon', score: 9920 },
        { name: 'nap_master', score: 7470 },
        { name: 'juice_god', score: 5021 },
        { name: 'mysterious_user', score: 3800 },
        { name: 'scroll_demon', score: 1340 },
        { name: 'noob_slayer', score: 850 },
        { name: 'xX_arcade_Xx', score: 420 },
        { name: 'cyber_junkie', score: 110 }
    ];

    // Combine bots with player
    let allEntries = [...bots];
    
    // Only add the user if client-side has hydrated, to prevent hydration mismatch
    if (isClient && nickname) {
        allEntries.push({ name: nickname, score: totalScore, isUser: true });
    } else if (isClient) {
        allEntries.push({ name: 'YOU (UNREGISTERED)', score: totalScore, isUser: true });
    }

    // Sort descending
    allEntries.sort((a, b) => b.score - a.score);

    // Limit to top 10
    const topEntries = allEntries.slice(0, 10);

    return (
        <div className="leaderboard" id="leaderboard">
            <div className="leaderboard-title">🏆 GLOBAL ARCADE LEADERBOARD</div>
            
            {!isClient ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>LOADING RANKINGS...</div>
            ) : (
                topEntries.map((e, index) => (
                    <div key={`${e.name}-${index}`} className="leaderboard-row">
                        <span className="leaderboard-rank">{index + 1}.</span>
                        <span className={`leaderboard-name ${e.isUser ? 'leaderboard-you' : ''}`}>
                            {e.name}
                        </span>
                        <span className={`leaderboard-score ${e.isUser ? 'leaderboard-you' : ''}`}>
                            {e.score.toLocaleString()}
                        </span>
                    </div>
                ))
            )}

            {isClient && (
                <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#444' }}>
                    YOUR CUMULATIVE SCORE: {totalScore.toLocaleString()}
                </div>
            )}
        </div>
    );
}
