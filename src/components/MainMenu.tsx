import React from 'react';
import { Play, Users, Settings, HelpCircle, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import { Team } from '../types/game';
import { TeamBadge } from './TeamBadge';
import { sound } from '../audio/soundSystem';

interface MainMenuProps {
  onPlayQuickMatch: () => void;
  onGoToTeamSelect: () => void;
  onOpenSettings: () => void;
  onOpenControls: () => void;
  defaultHomeTeam: Team;
  defaultAwayTeam: Team;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlayQuickMatch,
  onGoToTeamSelect,
  onOpenSettings,
  onOpenControls,
  defaultHomeTeam,
  defaultAwayTeam,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none">
      {/* Dynamic Stadium Night Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950 z-10 pointer-events-none" />

      {/* Atmospheric Floodlight Cones */}
      <div className="absolute -top-40 -left-20 w-[600px] h-[600px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -top-40 -right-20 w-[600px] h-[600px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-emerald-950/30 to-transparent pointer-events-none" />

      {/* Animated Subtle Turf Line Patterns in background */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #10b981 0px, #10b981 2px, transparent 2px, transparent 40px)',
        }}
      />

      {/* --- TOP BRANDING BAR --- */}
      <div className="relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Trophy className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold text-emerald-400 tracking-widest uppercase block">
              PC EDITION · TEMPORADA 2026
            </span>
            <span className="text-xs font-semibold text-slate-400">
              EA Style Next-Gen Sports Engine
            </span>
          </div>
        </div>

        {/* Exclusive 5 Teams Mini Showcase Pills */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">
            5 Clubes de Élite:
          </span>
          {(['real-madrid', 'fc-barcelona', 'manchester-city', 'bayern-munich', 'liverpool'] as const).map((id) => (
            <div key={id} className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-all">
              <TeamBadge teamId={id} size={22} />
            </div>
          ))}
        </div>
      </div>

      {/* --- CENTER HERO: FÚTBOL 2026 LOGO & PRESENTATION --- */}
      <div className="relative z-20 my-auto max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          El Videojuego Definitivo para PC
        </div>

        {/* Big Stylized Logo Lockup */}
        <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter uppercase font-sans leading-none">
          <span className="text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]">FÚTBOL</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 ml-3 drop-shadow-[0_8px_24px_rgba(16,185,129,0.4)]">
            2026
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
          Disputa apasionantes partidos en tiempo real con <strong>Real Madrid, FC Barcelona, Manchester City, Bayern Múnich y Liverpool</strong>. Estadio 3D iluminado, física avanzada del balón e inteligencia artificial táctica.
        </p>

        {/* Quick Matchup Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex items-center justify-between max-w-md shadow-xl">
          <div className="flex items-center gap-3">
            <TeamBadge teamId={defaultHomeTeam.id} size={36} />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tu Equipo</span>
              <span className="text-sm font-bold text-white">{defaultHomeTeam.name}</span>
            </div>
          </div>
          <span className="font-mono font-black text-xs text-slate-500">VS</span>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Rival IA</span>
              <span className="text-sm font-bold text-white">{defaultAwayTeam.name}</span>
            </div>
            <TeamBadge teamId={defaultAwayTeam.id} size={36} />
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
          {/* Primary JUGAR PARTIDO */}
          <button
            onClick={() => {
              sound.playUiClick();
              onPlayQuickMatch();
            }}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Jugar Partido</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* SELECCIONAR EQUIPO */}
          <button
            onClick={() => {
              sound.playUiClick();
              onGoToTeamSelect();
            }}
            className="px-6 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2.5 active:scale-95 transition-all shadow-lg"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Seleccionar Equipos</span>
          </button>

          {/* CONFIGURACIÓN */}
          <button
            onClick={() => {
              sound.playUiClick();
              onOpenSettings();
            }}
            className="px-5 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
            title="Configuración del juego"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Configuración</span>
          </button>

          {/* CONTROLES / AYUDA */}
          <button
            onClick={() => {
              sound.playUiClick();
              onOpenControls();
            }}
            className="px-5 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
            title="Ver controles de PC"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Controles</span>
          </button>
        </div>
      </div>

      {/* --- FOOTER STATUS & SPECS --- */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-900 pt-4 gap-2">
        <div className="flex items-center gap-4">
          <span>Resolución: <strong>1920 × 1080 (Full HD)</strong></span>
          <span>•</span>
          <span>Plataforma: <strong>PC Windows</strong></span>
          <span>•</span>
          <span>Motor 3D: <strong>Three.js Studio WebGL</strong></span>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          FÚTBOL 2026 © PRO SOCCER PC · 5 CLUBS EXCLUSIVOS
        </div>
      </div>
    </div>
  );
};
