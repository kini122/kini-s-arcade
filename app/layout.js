import './globals.css';
import { ArcadeProvider } from './context/ArcadeContext';

export const metadata = {
  title: "Kini's Arcade — Pointless Digital Machines Since 2026",
  description: "Welcome to Kini's Arcade. Play 10 absurd arcade machines including AI Future Predictor, Braincell Lab, Pigeon Personality Simulator, and more useless apps.",
  keywords: "arcade, games, fun, kini, retro, pixel art",
  openGraph: {
    title: "Kini's Arcade",
    description: "Pointless digital machines since 2026.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="crt-overlay" />
        <ArcadeProvider>
          {children}
        </ArcadeProvider>
      </body>
    </html>
  );
}
