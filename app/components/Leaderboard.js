'use client';

export default function Leaderboard() {
    const entries = [
        { rank: 1, name: 'giga_pigeon', score: 9920 },
        { rank: 2, name: 'nap_master', score: 9470 },
        { rank: 3, name: 'juice_god', score: 9021 },
        { rank: 4, name: 'mysterious_user', score: 8800 },
        { rank: 5, name: 'scroll_demon', score: 8340 },
        { rank: 6, name: 'YOU', score: '????' },
    ];

    return (
        <div className="leaderboard" id="leaderboard">
            <div className="leaderboard-title">🏆 GLOBAL ARCADE LEADERBOARD</div>
            {entries.map((e) => (
                <div key={e.rank} className="leaderboard-row">
                    <span className="leaderboard-rank">{e.rank}.</span>
                    <span className={`leaderboard-name ${e.name === 'YOU' ? 'leaderboard-you' : ''}`}>
                        {e.name}
                    </span>
                    <span className={`leaderboard-score ${e.name === 'YOU' ? 'leaderboard-you' : ''}`}>
                        {e.score}
                    </span>
                </div>
            ))}
        </div>
    );
}
