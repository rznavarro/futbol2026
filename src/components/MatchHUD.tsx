import React from 'react';
import { Camera, Pause, Play, Volume2, VolumeX, HelpCircle, Shield, Zap } from 'lucide-react';
import { Team, CameraMode, MatchState } from '../types/game';
import { TeamBadge } from './TeamBadge';
import { HudData } from '../game3d/gameEngine';

interface MatchHUDProps {
  homeTeam: Team;
  awayTeam: Team;
  hudData: HudData;
  cameraMode: CameraMode;
  onCycleCamera: () => void;
  onTogglePause: () => void;
  onOpenControls: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  showRadar: boolean;
}

export const MatchHUD: React.FC<MatchHUDProps> = ({
  homeTeam,
  awayTeam,
  hudData,
  cameraMode,
  onCycleCamera,
  onTogglePause,
  onOpenControls,
  soundMuted,
  onToggleSound,
  showRadar,
}) => {
  const isPaused = hudData.matchState === 'PAUSED';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* --- TOP BROADCAST SCOREBOARD BAR --- */}
      <div className="w-full flex items-start justify-between">
        {/* TV Style Score Bug */}
        <div className="pointer-events-auto flex items-center bg-slate-950/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl">
          {/* Home Team */}
          <div
            className="flex items-center gap-2.5 px-3.5 py-2"
            style={{ backgroundColor: `${homeTeam.primaryColor}22` }}
          >
            <TeamBadge teamId={homeTeam.id} size={28} />
            <span className="font-black text-sm text-white tracking-wider uppercase font-sans">
              {homeTeam.abbreviation}
            </span>
            <span className="font-mono font-black text-xl text-white px-2 py-0.5 rounded bg-black/40">
              {hudData.homeScore}
            </span>
          </div>

          {/* Separator / Score vs */}
          <div className="bg-slate-900 px-1.5 py-2 text-slate-500 font-bold text-xs">
            :
          </div>

          {/* Away Team */}
          <div
            className="flex items-center gap-2.5 px-3.5 py-2"
            style={{ backgroundColor: `${awayTeam.primaryColor}22` }}
          >
            <span className="font-mono font-black text-xl text-white px-2 py-0.5 rounded bg-black/40">
              {hudData.awayScore}
            </span>
            <span className="font-black text-sm text-white tracking-wider uppercase font-sans">
              {awayTeam.abbreviation}
            </span>
            <TeamBadge teamId={awayTeam.id} size={28} />
          </div>

          {/* Match Clock & Period Badge */}
          <div className="bg-slate-900 border-l border-slate-800 px-3 py-2 flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
              {hudData.matchTimeStr}
            </span>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {hudData.halfStr}
            </span>
          </div>
        </div>

        {/* Top Right Quick Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Camera Mode Cycle */}
          <button
            onClick={onCycleCamera}
            className="px-3 py-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
            title="Cambiar perspectiva de cámara"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">
              {cameraMode === 'BROADCAST' ? 'TV' : cameraMode === 'DYNAMIC' ? 'Dinámica' : 'Táctica'}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 shadow-lg transition-all active:scale-95"
            title={soundMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Controls Help */}
          <button
            onClick={onOpenControls}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 shadow-lg transition-all active:scale-95"
            title="Ver Controles (Teclado PC)"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>

          {/* Pause / Play */}
          <button
            onClick={onTogglePause}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 shadow-lg transition-all active:scale-95"
            title={isPaused ? 'Reanudar Partido' : 'Pausar'}
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-emerald-400" />
            ) : (
              <Pause className="w-4 h-4 text-slate-200" />
            )}
          </button>
        </div>
      </div>

      {/* --- CENTER MATCH EVENT CALLOUTS --- */}
      <div className="w-full flex flex-col items-center">
        {hudData.matchState === 'KICKOFF_WAIT' && (
          <div className="bg-slate-950/90 border border-emerald-500/50 px-6 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-sm font-black uppercase text-white tracking-wider">
              Presiona <kbd className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-mono font-bold">ESPACIO</kbd> para el Saque Inicial
            </span>
          </div>
        )}

        {hudData.matchState === 'OUT_OF_BOUNDS' && (
          <div className="bg-slate-950/90 border border-amber-500/50 px-6 py-2 rounded-2xl shadow-xl flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-amber-400 tracking-wider">
              ¡Balón fuera del campo! Reiniciando saque...
            </span>
          </div>
        )}

        {hudData.matchState === 'HALF_TIME' && (
          <div className="bg-slate-950/95 border border-blue-500/60 px-8 py-3 rounded-2xl shadow-2xl text-center">
            <span className="text-xs font-bold uppercase text-blue-400 tracking-widest block mb-1">
              Descanso del Encuentro
            </span>
            <span className="text-xl font-black text-white">
              FINAL DEL PRIMER TIEMPO
            </span>
          </div>
        )}

        {/* Shot Power Gauge (Shows during SPACE hold) */}
        {hudData.shotPowerPercent > 0 && (
          <div className="w-48 bg-slate-950/90 border border-slate-700 p-2 rounded-xl shadow-2xl mb-4">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1 uppercase">
              <span>Potencia de Tiro</span>
              <span className="text-emerald-400">{hudData.shotPowerPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${hudData.shotPowerPercent}%`,
                  backgroundColor:
                    hudData.shotPowerPercent > 80
                      ? '#ef4444'
                      : hudData.shotPowerPercent > 50
                      ? '#f59e0b'
                      : '#10b981',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM ROW: CONTROLLED PLAYER CARD & RADAR MINIMAP --- */}
      <div className="w-full flex items-end justify-between">
        {/* Active Controlled Player Card */}
        <div className="pointer-events-auto bg-slate-950/90 border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center gap-3 max-w-xs">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-slate-950 text-base shadow-md">
            #{hudData.activePlayerNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white truncate font-sans">
                {hudData.activePlayerName || 'Jugador'}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Control
              </span>
            </div>
            {/* Stamina bar */}
            <div className="mt-1 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-100"
                  style={{ width: `${hudData.activePlayerStamina}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Quick Hints (Compact) */}
        <div className="hidden lg:flex pointer-events-auto bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-[11px] text-slate-400 gap-4 shadow-lg">
          <span><kbd className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">WASD</kbd> Mover</span>
          <span><kbd className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">SHIFT</kbd> Correr</span>
          <span><kbd className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">J</kbd> Pase</span>
          <span><kbd className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">K</kbd> Centro</span>
          <span><kbd className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">ESPACIO</kbd> Tirar</span>
          <span><kbd className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">L</kbd> Cambiar</span>
          <span><kbd className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">E</kbd> Entrada</span>
        </div>

        {/* Radar Minimap */}
        {showRadar && (
          <div className="pointer-events-auto bg-slate-950/90 border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl">
            <div className="text-[10px] font-bold text-slate-400 mb-1 flex justify-between items-center px-1">
              <span>RADAR TÁCTICO</span>
              <span className="text-emerald-400 font-mono text-[9px]">
                {hudData.possessionHome}% - {hudData.possessionAway}% POS
              </span>
            </div>
            <div className="relative w-36 h-24 bg-emerald-950/60 border border-emerald-600/40 rounded-lg overflow-hidden">
              {/* Pitch Markings */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-emerald-500/30" />
              <div className="absolute left-1/2 inset-y-0 -translate-x-1/2 w-px bg-emerald-500/30" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-emerald-500/30" />
              <div className="absolute left-0 top-1/4 bottom-1/4 w-3 border-r border-y border-emerald-500/30" />
              <div className="absolute right-0 top-1/4 bottom-1/4 w-3 border-l border-y border-emerald-500/30" />

              {/* Render Players */}
              {hudData.radarPlayers.map((p, i) => {
                // Pitch length: 64 (-32 to 32) => 0% to 100%
                // Pitch width: 42 (-21 to 21) => 0% to 100%
                const leftPercent = ((p.x + 32) / 64) * 100;
                const topPercent = ((p.z + 21) / 42) * 100;

                return (
                  <div
                    key={i}
                    className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform ${
                      p.isHome ? 'bg-cyan-400' : 'bg-red-500'
                    } ${p.isControlled ? 'ring-2 ring-white scale-125' : ''}`}
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  />
                );
              })}

              {/* Render Ball */}
              <div
                className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300 ring-1 ring-yellow-500 shadow-sm shadow-yellow-400"
                style={{
                  left: `${((hudData.radarBall.x + 32) / 64) * 100}%`,
                  top: `${((hudData.radarBall.z + 21) / 42) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
