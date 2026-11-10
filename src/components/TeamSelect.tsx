import React, { useState } from 'react';
import { Shield, Zap, Swords, ChevronRight, ArrowLeft, Trophy, Star, Check } from 'lucide-react';
import { Team, TeamId } from '../types/game';
import { TEAMS } from '../data/teams';
import { TeamBadge } from './TeamBadge';
import { sound } from '../audio/soundSystem';

interface TeamSelectProps {
  initialHomeTeamId: TeamId;
  initialAwayTeamId: TeamId;
  onConfirmTeams: (homeTeam: Team, awayTeam: Team) => void;
  onBackToMenu: () => void;
}

export const TeamSelect: React.FC<TeamSelectProps> = ({
  initialHomeTeamId,
  initialAwayTeamId,
  onConfirmTeams,
  onBackToMenu,
}) => {
  const [homeTeamId, setHomeTeamId] = useState<TeamId>(initialHomeTeamId);
  const [awayTeamId, setAwayTeamId] = useState<TeamId>(
    initialAwayTeamId === initialHomeTeamId ? 'fc-barcelona' : initialAwayTeamId
  );
  const [pickingSide, setPickingSide] = useState<'HOME' | 'AWAY'>('HOME');

  const selectedHomeTeam = TEAMS.find((t) => t.id === homeTeamId) || TEAMS[0];
  const selectedAwayTeam = TEAMS.find((t) => t.id === awayTeamId) || TEAMS[1];

  const handleSelectTeam = (id: TeamId) => {
    sound.playUiClick();
    if (pickingSide === 'HOME') {
      setHomeTeamId(id);
      // If away was same, automatically set away to a different available team
      if (awayTeamId === id) {
        const other = TEAMS.find((t) => t.id !== id);
        if (other) setAwayTeamId(other.id);
      }
      setPickingSide('AWAY');
    } else {
      if (id === homeTeamId) {
        // Can't pick same team
        return;
      }
      setAwayTeamId(id);
    }
  };

  const handleStartMatch = () => {
    sound.playUiClick();
    onConfirmTeams(selectedHomeTeam, selectedAwayTeam);
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial from-slate-900 via-slate-950 to-black pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {/* --- TOP BAR --- */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={() => {
            sound.playUiClick();
            onBackToMenu();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-bold text-slate-300 hover:text-white transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Menú
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block">
            FÚTBOL 2026 · COPA EUROPEA
          </span>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-sans">
            Selección de Equipos
          </h1>
        </div>

        {/* Home / Away Tab Selector */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => {
              sound.playUiClick();
              setPickingSide('HOME');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              pickingSide === 'HOME'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tu Equipo (Local)
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              setPickingSide('AWAY');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              pickingSide === 'AWAY'
                ? 'bg-blue-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rival IA (Visitante)
          </button>
        </div>
      </div>

      {/* --- MAIN SHOWCASE: 5 TEAM CARDS --- */}
      <div className="relative z-10 my-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TEAMS.map((team) => {
            const isHome = team.id === homeTeamId;
            const isAway = team.id === awayTeamId;
            const isForbidden = pickingSide === 'AWAY' && isHome;

            return (
              <div
                key={team.id}
                onClick={() => !isForbidden && handleSelectTeam(team.id)}
                className={`relative rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isForbidden
                    ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-950/40'
                    : isHome
                    ? 'border-emerald-500 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40 scale-[1.02]'
                    : isAway
                    ? 'border-blue-500 bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-950 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/40 scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Status Badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {team.country}
                  </span>
                  {isHome && (
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" /> Local
                    </span>
                  )}
                  {isAway && (
                    <span className="bg-blue-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" /> Rival IA
                    </span>
                  )}
                  {!isHome && !isAway && isForbidden && (
                    <span className="bg-slate-800 text-slate-500 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                      Mismo Club
                    </span>
                  )}
                </div>

                {/* Crest & Team Name */}
                <div className="flex flex-col items-center text-center my-3">
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 mb-3 shadow-inner">
                    <TeamBadge teamId={team.id} size={64} />
                  </div>
                  <h3 className="font-black text-lg text-white font-sans tracking-tight">
                    {team.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: team.primaryColor }} />
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: team.secondaryColor }} />
                    <span className="text-xs text-slate-400 font-medium ml-1">{team.badgeDescription}</span>
                  </div>
                </div>

                {/* Overall Rating Pill */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 my-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-slate-300">Valoración</span>
                  </div>
                  <span className="font-mono font-black text-lg text-emerald-400">
                    {team.stats.overall}
                  </span>
                </div>

                {/* Key Player Card */}
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5 mb-3 text-left">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>Figura Clave</span>
                    <span className="text-amber-400 font-mono font-bold">★ {team.keyPlayer.rating}</span>
                  </div>
                  <div className="font-black text-sm text-white mt-0.5">
                    {team.keyPlayer.name} #{team.keyPlayer.number}
                  </div>
                  <div className="text-[10px] text-slate-500">{team.keyPlayer.role}</div>
                </div>

                {/* Mini Stat Bars */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Ataque</span>
                    <span className="font-bold text-white font-mono">{team.stats.attack}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${team.stats.attack}%` }} />
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Defensa</span>
                    <span className="font-bold text-white font-mono">{team.stats.defense}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${team.stats.defense}%` }} />
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Velocidad</span>
                    <span className="font-bold text-white font-mono">{team.stats.speed}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${team.stats.speed}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- BOTTOM MATCHUP PREVIEW & INICIAR CTA --- */}
      <div className="relative z-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Matchup Banner */}
        <div className="flex items-center gap-6 sm:gap-10">
          {/* Home Pick */}
          <div className="flex items-center gap-3">
            <TeamBadge teamId={selectedHomeTeam.id} size={48} />
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                Tu Club (Local)
              </span>
              <span className="font-black text-base sm:text-lg text-white font-sans">
                {selectedHomeTeam.name}
              </span>
            </div>
          </div>

          <div className="font-black text-2xl text-slate-600 font-mono">VS</div>

          {/* Away Pick */}
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block text-right">
                Rival IA (Visitante)
              </span>
              <span className="font-black text-base sm:text-lg text-white font-sans text-right">
                {selectedAwayTeam.name}
              </span>
            </div>
            <TeamBadge teamId={selectedAwayTeam.id} size={48} />
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartMatch}
          className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-base uppercase tracking-wider rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all"
        >
          <Trophy className="w-5 h-5" />
          <span>Iniciar Partido 3D</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
