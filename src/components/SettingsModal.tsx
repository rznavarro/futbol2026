import React from 'react';
import { X, Settings2, Clock, Swords, Video, Volume2, MapPin } from 'lucide-react';
import { GameSettings, MatchDifficulty, CameraMode } from '../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <Settings2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
                Configuración del Partido
              </h2>
              <p className="text-xs text-slate-400">
                Ajustes de simulación, dificultad, audio y cámara
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Duration */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-200">Duración del Partido</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 5].map((mins) => (
                <button
                  key={mins}
                  onClick={() => onUpdateSettings({ ...settings, matchDurationMinutes: mins })}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition-all border ${
                    settings.matchDurationMinutes === mins
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {mins} Minutos ({mins * 45}s / tiempo)
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-red-400" />
              <span className="font-semibold text-slate-200">Dificultad de la IA Rival</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['FACIL', 'MEDIO', 'LEYENDA'] as MatchDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => onUpdateSettings({ ...settings, difficulty: diff })}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition-all border ${
                    settings.difficulty === diff
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                      : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {diff === 'FACIL' ? 'Principiante' : diff === 'MEDIO' ? 'Profesional' : 'Leyenda'}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Angle */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-slate-200">Perspectiva de Cámara</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['BROADCAST', 'DYNAMIC', 'TACTICAL'] as CameraMode[]).map((cam) => (
                <button
                  key={cam}
                  onClick={() => onUpdateSettings({ ...settings, cameraMode: cam })}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition-all border ${
                    settings.cameraMode === cam
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                      : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {cam === 'BROADCAST' ? 'Transmisión TV' : cam === 'DYNAMIC' ? 'Dinámica Acción' : 'Táctica Aérea'}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Controls */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200">Efectos de Audio y Estadio</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {settings.soundEnabled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Efectos (Balón / Silbato): {Math.round(settings.sfxVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.sfxVolume}
                    onChange={(e) => onUpdateSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Ambiente de Público: {Math.round(settings.crowdVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.crowdVolume}
                    onChange={(e) => onUpdateSettings({ ...settings, crowdVolume: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Radar toggle */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-200">Radar Mini-mapa en Pantalla</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showRadar}
              onChange={(e) => onUpdateSettings({ ...settings, showRadar: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95"
          >
            GUARDAR Y CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};
