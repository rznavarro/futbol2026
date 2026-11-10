import React, { useEffect, useRef } from 'react';
import { GameEngine, HudData } from '../game3d/gameEngine';
import { Team, GameSettings, MatchStats } from '../types/game';

interface GameCanvasProps {
  homeTeam: Team;
  awayTeam: Team;
  settings: GameSettings;
  onHudUpdate: (data: HudData) => void;
  onMatchEnd: (stats: MatchStats) => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  homeTeam,
  awayTeam,
  settings,
  onHudUpdate,
  onMatchEnd,
  engineRef,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Create 3D GameEngine instance
    const engine = new GameEngine(
      mountRef.current,
      homeTeam,
      awayTeam,
      settings,
      onHudUpdate,
      onMatchEnd
    );
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [homeTeam, awayTeam, settings, onHudUpdate, onMatchEnd, engineRef]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full bg-[#060c18] overflow-hidden cursor-crosshair"
    />
  );
};
