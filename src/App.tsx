import React, { useState, useRef, useCallback } from 'react';
import { TEAMS } from './data/teams';
import { Team, GameView, GameSettings, CameraMode, MatchStats } from './types/game';
import { MainMenu } from './components/MainMenu';
import { TeamSelect } from './components/TeamSelect';
import { GameCanvas } from './components/GameCanvas';
import { MatchHUD } from './components/MatchHUD';
import { GoalBanner } from './components/GoalBanner';
import { SettingsModal } from './components/SettingsModal';
import { ControlsModal } from './components/ControlsModal';
import { MatchEndModal } from './components/MatchEndModal';
import { GameEngine, HudData } from './game3d/gameEngine';
import { sound } from './audio/soundSystem';

export default function App() {
  const [currentView, setCurrentView] = useState<GameView>('MAIN_MENU');

  // Selected teams (defaults: Real Madrid vs FC Barcelona El Clásico!)
  const [homeTeam, setHomeTeam] = useState<Team>(TEAMS[0]);
  const [awayTeam, setAwayTeam] = useState<Team>(TEAMS[1]);

  // Game settings
  const [settings, setSettings] = useState<GameSettings>({
    matchDurationMinutes: 3,
    difficulty: 'MEDIO',
    cameraMode: 'BROADCAST',
    soundEnabled: true,
    sfxVolume: 0.8,
    crowdVolume: 0.4,
    showRadar: true,
    quality: 'HIGH',
  });

  // Sound mute state
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);
  const [matchEndStats, setMatchEndStats] = useState<MatchStats | null>(null);

  // Match HUD state
  const [hudData, setHudData] = useState<HudData>({
    homeScore: 0,
    awayScore: 0,
    matchTimeStr: '00:00',
    halfStr: '1T',
    matchState: 'KICKOFF_WAIT',
    activePlayerName: homeTeam.players[4]?.shortName || '',
    activePlayerNumber: homeTeam.players[4]?.number || 9,
    activePlayerStamina: 100,
    shotPowerPercent: 0,
    possessionHome: 50,
    possessionAway: 50,
    radarPlayers: [],
    radarBall: { x: 0, z: 0 },
  });

  const engineRef = useRef<GameEngine | null>(null);

  const handleHudUpdate = useCallback((data: HudData) => {
    setHudData(data);
  }, []);

  const handleMatchEnd = useCallback((stats: MatchStats) => {
    setMatchEndStats(stats);
  }, []);

  const handleCycleCamera = () => {
    sound.playUiClick();
    const modes: CameraMode[] = ['BROADCAST', 'DYNAMIC', 'TACTICAL'];
    const nextIdx = (modes.indexOf(settings.cameraMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setSettings((prev) => ({ ...prev, cameraMode: nextMode }));
    if (engineRef.current) {
      engineRef.current.setCameraMode(nextMode);
    }
  };

  const handleTogglePause = () => {
    sound.playUiClick();
    if (!engineRef.current) return;
    if (hudData.matchState === 'PAUSED') {
      engineRef.current.resumeMatch();
    } else {
      engineRef.current.pauseMatch();
    }
  };

  const handleToggleSound = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  const handleStartMatch = (chosenHome: Team, chosenAway: Team) => {
    setHomeTeam(chosenHome);
    setAwayTeam(chosenAway);
    setMatchEndStats(null);
    setCurrentView('MATCH');
  };

  const handleRematch = () => {
    sound.playUiClick();
    setMatchEndStats(null);
    if (engineRef.current) {
      engineRef.current.restartMatch();
    }
  };

  const handleChangeTeamsFromEnd = () => {
    sound.playUiClick();
    setMatchEndStats(null);
    setCurrentView('TEAM_SELECT');
  };

  const handleMainMenuFromEnd = () => {
    sound.playUiClick();
    setMatchEndStats(null);
    setCurrentView('MAIN_MENU');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. MAIN MENU VIEW */}
      {currentView === 'MAIN_MENU' && (
        <MainMenu
          onPlayQuickMatch={() => handleStartMatch(homeTeam, awayTeam)}
          onGoToTeamSelect={() => setCurrentView('TEAM_SELECT')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenControls={() => setIsControlsOpen(true)}
          defaultHomeTeam={homeTeam}
          defaultAwayTeam={awayTeam}
        />
      )}

      {/* 2. TEAM SELECT VIEW */}
      {currentView === 'TEAM_SELECT' && (
        <TeamSelect
          initialHomeTeamId={homeTeam.id}
          initialAwayTeamId={awayTeam.id}
          onConfirmTeams={handleStartMatch}
          onBackToMenu={() => setCurrentView('MAIN_MENU')}
        />
      )}

      {/* 3. 3D MATCH VIEW */}
      {currentView === 'MATCH' && (
        <div className="relative w-full h-full">
          {/* Isolated WebGL Canvas */}
          <GameCanvas
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            settings={settings}
            onHudUpdate={handleHudUpdate}
            onMatchEnd={handleMatchEnd}
            engineRef={engineRef}
          />

          {/* Sibling React HUD Overlay */}
          <MatchHUD
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            hudData={hudData}
            cameraMode={settings.cameraMode}
            onCycleCamera={handleCycleCamera}
            onTogglePause={handleTogglePause}
            onOpenControls={() => setIsControlsOpen(true)}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
            showRadar={settings.showRadar}
          />

          {/* Goal Scored Celebration Overlay */}
          {hudData.matchState === 'GOAL_CELEBRATION' && (
            <GoalBanner
              scorerName={hudData.goalCelebrationScorer}
              teamName={hudData.goalCelebrationTeamName}
            />
          )}

          {/* Match End / Full Time Modal */}
          {matchEndStats && (
            <MatchEndModal
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              stats={matchEndStats}
              onRematch={handleRematch}
              onChangeTeams={handleChangeTeamsFromEnd}
              onMainMenu={handleMainMenuFromEnd}
            />
          )}
        </div>
      )}

      {/* MODALS */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          sound.setVolumes(newSettings.sfxVolume, newSettings.crowdVolume);
          sound.setMuted(!newSettings.soundEnabled);
          if (engineRef.current) {
            engineRef.current.setCameraMode(newSettings.cameraMode);
          }
        }}
      />

      <ControlsModal
        isOpen={isControlsOpen}
        onClose={() => setIsControlsOpen(false)}
      />
    </div>
  );
}
