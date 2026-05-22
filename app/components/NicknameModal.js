'use client';

import { useState } from 'react';
import { useArcade } from '../context/ArcadeContext';

export default function NicknameModal() {
    const { nickname, saveNickname, isClient } = useArcade();
    const [inputVal, setInputVal] = useState('');

    // Don't render anything until client-side hydration is complete
    if (!isClient) return null;
    
    // If nickname is already set, don't show the modal
    if (nickname) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = inputVal.trim();
        if (trimmed.length > 0 && trimmed.length <= 15) {
            saveNickname(trimmed);
            // Ensure we scroll back to top of page, not the scoreboard
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: '#050508',
                border: '2px solid var(--neon)',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 0 20px var(--neon)',
                textAlign: 'center',
                maxWidth: '90%',
                width: '400px'
            }}>
                <h2 style={{ color: 'var(--neon)', textShadow: '0 0 10px var(--neon)', marginBottom: '10px' }}>
                    NEW CHALLENGER
                </h2>
                <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '14px' }}>
                    Enter your hacker alias to register on the Global Leaderboard.
                </p>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="e.g. cyber_ninja"
                        maxLength={15}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#111',
                            border: '1px solid #333',
                            color: '#fff',
                            fontSize: '16px',
                            borderRadius: '4px',
                            marginBottom: '20px',
                            textAlign: 'center',
                            outline: 'none'
                        }}
                        autoFocus
                    />
                    <button 
                        type="submit" 
                        className="btn" 
                        style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                        disabled={inputVal.trim().length === 0}
                    >
                        INITIALIZE PROFILE
                    </button>
                </form>
            </div>
        </div>
    );
}
