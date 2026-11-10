import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface GoalBannerProps {
  scorerName?: string;
  teamName?: string;
  minute?: number;
}

export const GoalBanner: React.FC<GoalBannerProps> = ({
  scorerName = 'Goleador',
  teamName = 'Equipo',
}) => {
  useEffect(() => {
    // Fire celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#ffd700', '#ffffff', '#10b981', '#dc2626'],
      });
    } catch {
      // fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col items-center justify-center">
      {/* Background radial flash */}
      <div className="absolute inset-0 bg-radial from-emerald-500/20 via-transparent to-transparent animate-pulse" />

      {/* Main typographic celebration card */}
      <div className="relative transform scale-110 flex flex-col items-center">
        {/* Top small banner */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black px-8 py-1.5 rounded-full text-sm uppercase tracking-widest shadow-2xl mb-2">
          ★ {teamName} ★
        </div>

        {/* Big stylized GOOOOL text */}
        <div className="text-7xl sm:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-amber-500 drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] stroke-black select-none">
          ¡¡GOOOOL!!
        </div>

        {/* Scorer Info Tag */}
        <div className="mt-2 bg-slate-950/90 border border-yellow-500/50 px-6 py-2 rounded-xl text-center shadow-xl">
          <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider block">
            Anotación Magistral
          </span>
          <span className="text-2xl font-black text-white font-sans tracking-tight">
            {scorerName}
          </span>
        </div>
      </div>
    </div>
  );
};
