import React from 'react';
import { RotateCcw, Users, Home, Trophy, Target, Award, Shield } from 'lucide-react';
import { Team, MatchStats } from '../types/game';
import { TeamBadge } from './TeamBadge';

interface MatchEndModalProps {
  homeTeam: Team;
  awayTeam: Team;
  stats: MatchStats;
  onRematch: () => void;
  onChangeTeams: () => void;
  onMainMenu: () => void;
}

export const MatchEndModal: React.FC<MatchEndModalProps> = ({
  homeTeam,
  awayTeam,
  stats,
  onRematch,
  onChangeTeams,
  onMainMenu,
}) => {
  const isWin = stats.homeScore > stats.awayScore;
  const isDraw = stats.homeScore === stats.awayScore;

  const statRows = [
    { label: 'Tiros Totales', home: stats.homeShots, away: stats.awayShots },
    { label: 'Tiros a Puerta', home: stats.homeShotsOnTarget, away: stats.awayShotsOnTarget },
    { label: 'Posesión', home: `${stats.homePossessionPercent}%`, away: `${stats.awayPossessionPercent}%`, isPercent: true, homeVal: stats.homePossessionPercent, awayVal: stats.awayPossessionPercent },
    { label: 'Pases Completados', home: stats.homePassesCompleted, away: stats.awayPassesCompleted },
    { label: 'Entradas con Éxito', home: stats.homeTackles, away: stats.awayTackles },
    { label: 'Córners', home: stats.homeCorners, away: stats.awayCorners },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-auto">
        {/* Result Header Badge */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={`px-6 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-2 ${
              isWin
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : isDraw
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-red-500/20 text-red-400 border border-red-500/40'
            }`}
          >
            {isWin ? '¡VICTORIA ÉPICA!' : isDraw ? 'EMPATE DISPUTADO' : 'FIN DEL ENCUENTRO'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-sans">
            Final del Partido
          </h2>
        </div>

        {/* Scorecard Hero */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6 flex items-center justify-between shadow-inner">
          {/* Home */}
          <div className="flex-1 flex flex-col items-center text-center">
            <TeamBadge teamId={homeTeam.id} size={58} className="mb-2" />
            <span className="font-bold text-sm text-slate-200">{homeTeam.name}</span>
            <span className="text-xs text-slate-400">Usuario</span>
          </div>

          {/* Scores */}
          <div className="px-6 flex flex-col items-center">
            <div className="flex items-center gap-4 text-4xl sm:text-5xl font-mono font-black text-white">
              <span className={isWin ? 'text-emerald-400' : 'text-white'}>{stats.homeScore}</span>
              <span className="text-slate-600">-</span>
              <span className={!isWin && !isDraw ? 'text-red-400' : 'text-white'}>{stats.awayScore}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              90:00 Regulación
            </span>
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-center text-center">
            <TeamBadge teamId={awayTeam.id} size={58} className="mb-2" />
            <span className="font-bold text-sm text-slate-200">{awayTeam.name}</span>
            <span className="text-xs text-slate-400">Rival IA</span>
          </div>
        </div>

        {/* Scorers List */}
        {stats.scorers.length > 0 && (
          <div className="mb-6 p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              ⚽ Goles del Encuentro:
            </span>
            <div className="flex flex-wrap gap-2">
              {stats.scorers.map((s, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-xs flex items-center gap-1.5"
                >
                  <span className="font-bold text-emerald-400">{s.minute}&apos;</span>
                  <span className="font-medium text-slate-200">{s.playerName}</span>
                  <span className="text-[10px] text-slate-400">({s.teamId === homeTeam.id ? homeTeam.abbreviation : awayTeam.abbreviation})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Stats Comparison */}
        <div className="space-y-3 mb-8">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Estadísticas del Encuentro
          </span>
          {statRows.map((row, idx) => {
            const hNum = row.isPercent ? (row.homeVal || 50) : Number(row.home);
            const aNum = row.isPercent ? (row.awayVal || 50) : Number(row.away);
            const total = hNum + aNum || 1;
            const hPct = Math.round((hNum / total) * 100);

            return (
              <div key={idx} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-emerald-400 font-mono">{row.home}</span>
                  <span className="text-slate-300 font-sans uppercase text-[11px]">{row.label}</span>
                  <span className="text-red-400 font-mono">{row.away}</span>
                </div>
                {/* Dual Progress Bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${hPct}%` }}
                  />
                  <div
                    className="bg-red-400 h-full transition-all duration-500"
                    style={{ width: `${100 - hPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onRematch}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Revancha
          </button>

          <button
            onClick={onChangeTeams}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Users className="w-4 h-4 text-blue-400" />
            Cambiar Equipos
          </button>

          <button
            onClick={onMainMenu}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4 text-slate-400" />
            Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
};
