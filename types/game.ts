export interface AiModel {
  id: string;
  name: string;
  provider: string;
  version: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
}

export interface RoundContent {
  id: string;
  categoryId: string;
  imageUrl: string;
  truthValue: number;
  sortOrder: number;
}

export interface AiAnswer {
  aiModelId: string;
  answerValue: number;
}

export interface CrowdStats {
  roundContentId: string;
  meanAnswer: number;
  answerCount: number;
}

export interface PlayerAnswer {
  answerValue: number;
  responseTimeMs: number;
  accuracyScore: number;
  speedScore: number;
  roundScore: number;
}

export interface GameRound {
  roundNumber: number;
  roundContentId: string;
  imageUrl: string;
  truthValue: number;
  playerAnswer?: PlayerAnswer;
  crowdMean: number;
  aiAnswers: AiAnswer[];
}

export interface GameSession {
  id: string;
  categoryId: string;
  categoryName: string;
  playerName: string;
  status: 'in_progress' | 'completed';
  rounds: GameRound[];
  totalScore: number;
  startedAt: string;
  completedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  isCurrentPlayer: boolean;
}

export type TabId = 'games' | 'profile';

export type Screen =
  | { name: 'tabs' }
  | { name: 'category-detail'; categoryId: string }
  | { name: 'game'; categoryId: string }
  | { name: 'game-summary'; gameId: string }
  | { name: 'game-history'; gameId: string };

export const ROUNDS_PER_GAME = 10;
export const MAX_ROUND_SCORE = 100;
export const ROUND_TIME_SECONDS = 10;
export const ROUND_TIME_MS = ROUND_TIME_SECONDS * 1000;
