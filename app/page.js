'use client';

import { useArcade } from './context/ArcadeContext';
import TopBar from './components/TopBar';
import MachineCard from './components/MachineCard';
import GameModal from './components/GameModal';
import Leaderboard from './components/Leaderboard';

const MACHINES = [
  { id: 'future', emoji: '🔮', title: 'AI Future Predictor', desc: 'Highly advanced destiny analysis' },
  { id: 'brain', emoji: '🧠', title: 'Braincell Activity Lab', desc: 'Live neural activity scanner' },
  { id: 'pigeon', emoji: '🐦', title: 'Pigeon Personality', desc: 'Scientific pigeon psychology' },
  { id: 'life', emoji: '🎲', title: 'Life Decision Engine', desc: 'Let the algorithm choose' },
  { id: 'toilet', emoji: '🧻', title: 'Toilet Fortune', desc: 'Prophecies from the porcelain oracle' },
  { id: 'juice', emoji: '🧃', title: 'Juice IQ Test', desc: 'Measure your liquid intelligence' },
  { id: 'npc', emoji: '🗿', title: 'NPC Detector', desc: 'Main character or background extra?' },
  { id: 'pizza', emoji: '🍕', title: 'Pizza Personality', desc: 'You are what you eat' },
  { id: 'doom', emoji: '📱', title: 'Doom Scroll Sim', desc: 'Experience digital damage' },
  { id: 'skill', emoji: '🎯', title: 'Skill Generator', desc: 'Unlock useless abilities' },
];

export default function ArcadePage() {
  const { activeGame } = useArcade();

  return (
    <>
      <TopBar />

      <main className="arcade-container">
        <div className="arcade-header">
          <h1>🎮 Kini&apos;s Arcade</h1>
          <p>Pointless digital machines since 2026.</p>
        </div>

        <div className="machine-grid">
          {MACHINES.map((m, i) => (
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

        <Leaderboard />
      </main>

      {activeGame && <GameModal />}
    </>
  );
}
