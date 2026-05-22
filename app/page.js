'use client';

import { useArcade } from './context/ArcadeContext';
import TopBar from './components/TopBar';
import MachineCard from './components/MachineCard';
import GameModal from './components/GameModal';
import Leaderboard from './components/Leaderboard';
import NicknameModal from './components/NicknameModal';

const MACHINES_CLASSIC = [
  { id: 'future', emoji: '🔮', title: 'Memory Matrix', desc: 'Simon says for your frontal lobe' },
  { id: 'brain', emoji: '🐍', title: 'Neon Snake', desc: 'Classic snake, upgraded' },
  { id: 'pigeon', emoji: '⌨️', title: 'Cyber Type', desc: 'Hack the mainframe' },
  { id: 'life', emoji: '⚡', title: 'Reflex Reactor', desc: 'Test your reaction time' },
  { id: 'toilet', emoji: '🔐', title: 'Code Breaker', desc: 'Crack the 3-digit pin' },
  { id: 'juice', emoji: '☄️', title: 'Asteroid Dodge', desc: 'Evasive maneuvers' },
  { id: 'npc', emoji: '🔀', title: 'Quantum Sort', desc: 'Route the data packets' },
  { id: 'pizza', emoji: '⛏️', title: 'Data Miner', desc: 'Clear the sector of viruses' },
  { id: 'doom', emoji: '⚖️', title: 'Binary Balance', desc: 'Mathematical crisis' },
  { id: 'skill', emoji: '🛸', title: 'Space Defender', desc: 'Defend the digital frontier' },
];

const MACHINES_NEW = [
  { id: 'cyberrun', emoji: '🏃', title: 'Cyber Run', desc: 'Endless neon sprinting' },
  { id: 'neonflap', emoji: '🦅', title: 'Neon Flap', desc: 'Frustratingly addictive flight' },
  { id: 'bugsquasher', emoji: '🔨', title: 'Bug Squasher', desc: 'High-speed virus extermination' },
  { id: 'grid2048', emoji: '🧩', title: 'Grid 2048', desc: 'Slide, merge, and multiply' },
  { id: 'brickbreaker', emoji: '🧱', title: 'Brick Breaker', desc: 'Deflect and destroy' },
  { id: 'neonplumber', emoji: '🍄', title: 'Neon Plumber', desc: 'Classic 2D platforming' }
];

export default function ArcadePage() {
  const { activeGame } = useArcade();

  return (
    <>
      <NicknameModal />
      <TopBar />

      <main className="arcade-container">
        <div className="arcade-header">
          <h1>👾 Kini&apos;s Arcade</h1>
          <p>Logic and Reflex modules since 2026.</p>
        </div>

        <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: 'var(--neon)', borderBottom: '1px solid #333', paddingBottom: 10, marginBottom: 20 }}>🔥 New Additions</h2>
            <div className="machine-grid" style={{ marginBottom: 40 }}>
            {MACHINES_NEW.map((m, i) => (
                <MachineCard
                key={m.id}
                id={m.id}
                emoji={m.emoji}
                title={m.title}
                desc={m.desc}
                delay={i}
                />
            ))}
            </div>

            <h2 style={{ color: '#00ffcc', borderBottom: '1px solid #333', paddingBottom: 10, marginBottom: 20 }}>👾 Classic Modules</h2>
            <div className="machine-grid">
            {MACHINES_CLASSIC.map((m, i) => (
                <MachineCard
                key={m.id}
                id={m.id}
                emoji={m.emoji}
                title={m.title}
                desc={m.desc}
                delay={i}
                />
            ))}
            </div>
        </div>

        <Leaderboard />
      </main>

      {activeGame && <GameModal />}
    </>
  );
}
