export type TeamId = 'real-madrid' | 'fc-barcelona' | 'manchester-city' | 'bayern-munich' | 'liverpool';

export interface Player {
  id: string;
  name: string;
  shortName: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD' | 'ST';
  role: 'Portero' | 'Defensa' | 'Centrocampista' | 'Extremo' | 'Delantero';
  stats: {
    speed: number;       // 1 - 99
    shooting: number;    // 1 - 99
    passing: number;     // 1 - 99
    defense: number;     // 1 - 99
    dribbling: number;   // 1 - 99
  };
  skinTone: string;     // Hex color
  hairColor: string;    // Hex color
  hairStyle: 'short' | 'buzz' | 'dreads' | 'slick' | 'curly';
  height: number;       // scale factor around 1.0
  isGoalkeeper?: boolean;
}

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  abbreviation: string;
  country: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  numberColor: string;
  badgeStyle: 'crown' | 'stripes' | 'ship' | 'diamonds' | 'bird';
  badgeDescription: string;
  homeKit: {
    jersey: string;
    shorts: string;
    socks: string;
    stripes?: boolean;
    stripeColor?: string;
  };
  gkKit: {
    jersey: string;
    shorts: string;
    socks: string;
  };
  stats: {
    overall: number;
    attack: number;
    midfield: number;
    defense: number;
    speed: number;
    ballControl: number;
  };
  keyPlayer: {
    name: string;
    role: string;
    number: number;
    rating: number;
  };
  players: Player[];
}

export type GameView = 'MAIN_MENU' | 'TEAM_SELECT' | 'MATCH' | 'SETTINGS';

export type MatchState =
  | 'KICKOFF_WAIT'
  | 'PLAYING'
  | 'GOAL_CELEBRATION'
  | 'OUT_OF_BOUNDS'
  | 'HALF_TIME'
  | 'FULL_TIME'
  | 'PAUSED';

export type CameraMode = 'BROADCAST' | 'DYNAMIC' | 'TACTICAL';
export type MatchDifficulty = 'FACIL' | 'MEDIO' | 'LEYENDA';

export interface GameSettings {
  matchDurationMinutes: number; // 2, 3, 5 real minutes
  difficulty: MatchDifficulty;
  cameraMode: CameraMode;
  soundEnabled: boolean;
  crowdVolume: number; // 0 - 1
  sfxVolume: number;   // 0 - 1
  showRadar: boolean;
  quality: 'HIGH' | 'MEDIUM';
}

export interface MatchStats {
  homeScore: number;
  awayScore: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePossessionPercent: number;
  awayPossessionPercent: number;
  homePassesCompleted: number;
  awayPassesCompleted: number;
  homeTackles: number;
  awayTackles: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls: number;
  awayFouls: number;
  scorers: Array<{
    teamId: TeamId;
    playerName: string;
    minute: number;
  }>;
}
