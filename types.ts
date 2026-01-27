
export enum GameStatus {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  WON = 'WON'
}

export enum ThemeType {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  COLORFUL = 'COLORFUL'
}

export interface Player {
  id: string;
  name: string;
  isComputer: boolean;
  card: number[][];
  marked: boolean[][];
  hasWon: boolean;
}

export interface GameSettings {
  playerCount: number;
  computerCount: number;
  speed: number; // in milliseconds
  maxNumber: number;
  gridSize: number;
}

export interface GameStats {
  totalGames: number;
  humanWins: number;
  computerWins: number;
  totalDurationMs: number;
  recentWinners: Array<{ name: string; date: string }>;
}
