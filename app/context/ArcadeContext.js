'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ArcadeContext = createContext(null);

export function ArcadeProvider({ children }) {
    const [coins, setCoins] = useState(3);
    const [activeGame, setActiveGame] = useState(null);
    const [showCoinInsert, setShowCoinInsert] = useState(false);
    
    // Leaderboard / User State
    const [nickname, setNickname] = useState('');
    const [totalScore, setTotalScore] = useState(0);
    const [isClient, setIsClient] = useState(false);

    // Initialize from localStorage
    useEffect(() => {
        setIsClient(true);
        const storedName = localStorage.getItem('arcade_nickname');
        const storedScore = localStorage.getItem('arcade_totalScore');
        
        if (storedName) setNickname(storedName);
        if (storedScore) setTotalScore(parseInt(storedScore, 10));
    }, []);

    const saveNickname = useCallback((name) => {
        setNickname(name);
        localStorage.setItem('arcade_nickname', name);
    }, []);

    const reportScore = useCallback((points) => {
        if (!points || isNaN(points) || points <= 0) return;
        setTotalScore(prev => {
            const newTotal = prev + points;
            localStorage.setItem('arcade_totalScore', newTotal.toString());
            return newTotal;
        });
    }, []);

    const openGame = useCallback((gameId) => {
        if (coins <= 0) {
            setActiveGame('out-of-coins');
            return;
        }
        setCoins(c => c - 1);
        setShowCoinInsert(true);
        setActiveGame(gameId);

        // Hide coin insert after animation
        setTimeout(() => {
            setShowCoinInsert(false);
        }, 2200);
    }, [coins]);

    const closeGame = useCallback(() => {
        setActiveGame(null);
        setShowCoinInsert(false);
    }, []);

    const addCoins = useCallback((amount) => {
        setCoins(c => c + amount);
    }, []);

    return (
        <ArcadeContext.Provider value={{
            coins,
            activeGame,
            showCoinInsert,
            openGame,
            closeGame,
            addCoins,
            nickname,
            saveNickname,
            totalScore,
            reportScore,
            isClient
        }}>
            {children}
        </ArcadeContext.Provider>
    );
}

export function useArcade() {
    const context = useContext(ArcadeContext);
    if (!context) throw new Error('useArcade must be used within ArcadeProvider');
    return context;
}
