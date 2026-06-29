'use client';

import { useArcade } from './context/ArcadeContext';
import TopBar from './components/TopBar';
import MachineCard from './components/MachineCard';
import GameModal from './components/GameModal';
import Leaderboard from './components/Leaderboard';
import NicknameModal from './components/NicknameModal';

const MACHINES_FEATURED = [
  { id: 'mergemania',  emoji: '🫧', title: 'Merge Mania',   desc: 'Bubble up, merge up, score up' },
  { id: 'voltdash',   emoji: '⚡', title: 'Volt Dash',     desc: 'One wrong tile and you\'re toast' },
  { id: 'ricochet',   emoji: '🎯', title: 'Ricochet',      desc: 'Aim. Bounce. Annihilate.' },  { id: 'skystack',   emoji: '🏗️', title: 'Sky Stack',     desc: 'One tap to glory or dust' },
  { id: 'jugglerush', emoji: '🎪', title: 'Juggle Rush',   desc: 'Don\'t let them hit the floor' },
  { id: 'crowdsurge', emoji: '🔥', title: 'Crowd Surge',   desc: 'Lead the mob, pick the gate' },
  { id: 'orbitcatch', emoji: '🪐', title: 'Orbit Catch',   desc: 'Tap to hop between planets' },
  { id: 'neonmaze',   emoji: '🧩', title: 'NEON MAZE',     desc: 'Escape the grid. Time is ticking.' },
    { id: 'chainblast', emoji: '🎆', title: 'Chain Blast',   desc: 'One tap. Infinite explosions.' },
];

const MACHINES_NEW = [
  { id: 'cyberrun',     emoji: '🏃',  title: 'Cyber Run',     desc: 'Endless neon sprinting' },
  { id: 'neonflap',    emoji: '🦅',  title: 'Neon Flap',     desc: 'Frustratingly addictive flight' },
  { id: 'bugsquasher', emoji: '🔨',  title: 'Bug Squasher',  desc: 'Multi-bug chaos mode' },
  { id: 'grid2048',    emoji: '🧩',  title: 'Grid 2048',     desc: 'Slide, merge, and multiply' },
  { id: 'brickbreaker',emoji: '🧱',  title: 'Brick Breaker', desc: 'Deflect and destroy' },
  { id: 'neonplumber', emoji: '🍄',  title: 'Neon Plumber',  desc: 'Classic 2D platforming' }
];

const MACHINES_CLASSIC = [
  { id: 'future', emoji: '🔮', title: 'Memory Matrix',    desc: 'Simon says for your frontal lobe' },
  { id: 'brain',  emoji: '🐍', title: 'Neon Snake',       desc: 'Classic snake, upgraded' },
  { id: 'pigeon', emoji: '⌨️', title: 'Cyber Type',       desc: 'Type or die' },
  { id: 'life',   emoji: '⚡', title: 'Reflex Reactor',   desc: 'Test your reaction time' },
  { id: 'toilet', emoji: '🔐', title: 'Code Breaker',     desc: 'Crack the 3-digit pin' },
  { id: 'juice',  emoji: '☄️', title: 'Asteroid Dodge',   desc: 'Evasive maneuvers' },
  { id: 'npc',    emoji: '🔀', title: 'Quantum Sort',     desc: 'Route the data packets' },
  { id: 'pizza',  emoji: '⛏️', title: 'Data Miner',       desc: 'Clear the sector of viruses' },
  { id: 'doom',   emoji: '⚖️', title: 'Binary Balance',   desc: 'Mathematical crisis' },
  { id: 'skill',  emoji: '🛸', title: 'Space Defender',   desc: 'Defend the digital frontier' },
];

const SectionHeader = ({ children, color = 'var(--neon)' }) => (
  <h2 style={{
    color,
    borderBottom: `1px solid #222`,
    paddingBottom: 12,
    marginBottom: 24,
    fontSize: '14px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    textShadow: `0 0 8px ${color}`
  }}>
    {children}
  </h2>
);

export default function ArcadePage() {
  const { activeGame } = useArcade();

  return (
    <>
      <NicknameModal />
      <TopBar />

      <main className="arcade-container">
        <div className="arcade-header">
          <h1>👾 ARCADE</h1>
          <p>Play it till it breaks you.</p>
        </div>

        <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>

          <SectionHeader color="var(--neon-pink)">🔥 Featured Games</SectionHeader>
          <div className="machine-grid" style={{ marginBottom: 48 }}>
            {MACHINES_FEATURED.map((m, i) => (
              <MachineCard key={m.id} id={m.id} emoji={m.emoji} title={m.title} desc={m.desc} delay={i} />
            ))}
          </div>

          <SectionHeader color="var(--neon)">✨ New Additions</SectionHeader>
          <div className="machine-grid" style={{ marginBottom: 48 }}>
            {MACHINES_NEW.map((m, i) => (
              <MachineCard key={m.id} id={m.id} emoji={m.emoji} title={m.title} desc={m.desc} delay={i} />
            ))}
          </div>

          <SectionHeader color="#00ffcc">👾 Classic Modules</SectionHeader>
          <div className="machine-grid">
            {MACHINES_CLASSIC.map((m, i) => (
              <MachineCard key={m.id} id={m.id} emoji={m.emoji} title={m.title} desc={m.desc} delay={i} />
            ))}
          </div>

        </div>

        <Leaderboard />
      </main>

      {activeGame && <GameModal />}
    </>
  );
}
