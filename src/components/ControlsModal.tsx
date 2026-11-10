import React from 'react';
import { X, Keyboard, Zap, Shield, Crosshair, ArrowRightLeft } from 'lucide-react';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const controlGroups = [
    {
      category: 'Movimiento & Sprint',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      items: [
        { keys: ['W', 'A', 'S', 'D'], desc: 'Moverse en 360° por el campo' },
        { keys: ['SHIFT'], desc: 'Sprint / Carrera rápida (consume estamina)' },
      ],
    },
    {
      category: 'Ataque & Pases',
      icon: <Crosshair className="w-5 h-5 text-cyan-400" />,
      items: [
        { keys: ['J'], desc: 'Pase corto raso al pie del compañero desmarcado' },
        { keys: ['K'], desc: 'Pase largo / Centro aéreo bombeado' },
        { keys: ['ESPACIO'], desc: 'Disparo a puerta (mantén presionado para barra de potencia)' },
      ],
    },
    {
      category: 'Defensa & Táctica',
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      items: [
        { keys: ['E'], desc: 'Entrada / Recuperación de balón (barrida / presión)' },
        { keys: ['L'], desc: 'Cambiar de jugador activo al más próximo al balón' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <Keyboard className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
                Controles de Teclado PC
              </h2>
              <p className="text-xs text-slate-400">
                Optimizado para partidas competitivas en PC Windows
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

        {/* Categories */}
        <div className="space-y-5">
          {controlGroups.map((group, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                {group.icon}
                <span className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  {group.category}
                </span>
              </div>
              <div className="space-y-2.5">
                {group.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.desc}</span>
                    <div className="flex gap-1.5 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-800 border border-slate-600 rounded-md shadow-inner text-emerald-400 min-w-8 text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tip Box */}
        <div className="mt-6 p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
          <ArrowRightLeft className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            <strong>Consejo Pro:</strong> Puedes dirigir tus tiros y pases apuntando con las teclas <kbd className="bg-emerald-900/80 px-1 rounded text-white">WASD</kbd> antes de soltar la tecla de acción.
          </span>
        </div>

        {/* Close CTA */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>
  );
};
