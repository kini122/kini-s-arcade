'use client';

import { useArcade } from '../context/ArcadeContext';
import CoinInsert from './CoinInsert';
import OutOfCoins from './OutOfCoins';

// Classic games
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

// New additions
import CyberRun from '../games/CyberRun';
import NeonFlap from '../games/NeonFlap';
import BugSquasher from '../games/BugSquasher';
import Grid2048 from '../games/Grid2048';
import BrickBreaker from '../games/BrickBreaker';
import NeonPlumber from '../games/NeonPlumber';

// Featured games
import MergeMania from '../games/MergeMania';
import VoltDash from '../games/VoltDash';
import Ricochet from '../games/Ricochet';
import SkyStack from '../games/SkyStack';
import JuggleRush from '../games/JuggleRush';
import CrowdSurge from '../games/CrowdSurge';
import OrbitCatch from '../games/OrbitCatch';
import NeonMaze from '../games/NeonMaze';
import ChainBlast from '../games/ChainBlast';

const GAME_MAP = {
    // Classic
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
    // New
    cyberrun: CyberRun,
    neonflap: NeonFlap,
    bugsquasher: BugSquasher,
    grid2048: Grid2048,
    brickbreaker: BrickBreaker,
    neonplumber: NeonPlumber,
    // Featured
    mergemania: MergeMania,
    voltdash: VoltDash,
    ricochet: Ricochet,    skystack: SkyStack,
    jugglerush: JuggleRush,
    crowdsurge: CrowdSurge,
    orbitcatch: OrbitCatch,
    neonmaze: NeonMaze,
    chainblast: ChainBlast,
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
                <button className="game-close" onClick={closeGame} aria-label="Close game">✕</button>

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
