'use client';

import { useArcade } from '../context/ArcadeContext';
import CoinInsert from './CoinInsert';
import OutOfCoins from './OutOfCoins';
import FuturePredictor from '../games/FuturePredictor';
import BraincellLab from '../games/BraincellLab';
import PigeonPersonality from '../games/PigeonPersonality';
import LifeDecisionEngine from '../games/LifeDecisionEngine';
import ToiletFortune from '../games/ToiletFortune';
import JuiceIQ from '../games/JuiceIQ';
import NPCDetector from '../games/NPCDetector';
import PizzaPersonality from '../games/PizzaPersonality';
import DoomScroll from '../games/DoomScroll';
import SkillGenerator from '../games/SkillGenerator';
import CyberRun from '../games/CyberRun';
import NeonFlap from '../games/NeonFlap';
import BugSquasher from '../games/BugSquasher';
import Grid2048 from '../games/Grid2048';
import BrickBreaker from '../games/BrickBreaker';
import NeonPlumber from '../games/NeonPlumber';

const GAME_MAP = {
    future: FuturePredictor,
    brain: BraincellLab,
    pigeon: PigeonPersonality,
    life: LifeDecisionEngine,
    toilet: ToiletFortune,
    juice: JuiceIQ,
    npc: NPCDetector,
    pizza: PizzaPersonality,
    doom: DoomScroll,
    skill: SkillGenerator,
    cyberrun: CyberRun,
    neonflap: NeonFlap,
    bugsquasher: BugSquasher,
    grid2048: Grid2048,
    brickbreaker: BrickBreaker,
    neonplumber: NeonPlumber
};

export default function GameModal() {
    const { activeGame, showCoinInsert, closeGame } = useArcade();

    if (!activeGame) return null;

    const isOutOfCoins = activeGame === 'out-of-coins';
    const GameComponent = GAME_MAP[activeGame];

    return (
        <div className="game-modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) closeGame();
        }}>
            <div className="game-modal">
                <button className="game-close" onClick={closeGame} aria-label="Close game">✖</button>

                {isOutOfCoins ? (
                    <OutOfCoins />
                ) : showCoinInsert ? (
                    <CoinInsert />
                ) : GameComponent ? (
                    <GameComponent />
                ) : null}
            </div>
        </div>
    );
}
