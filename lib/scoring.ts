import { MAX_ROUND_SCORE, ROUND_TIME_MS } from '../types/game';

export interface RoundScoreBreakdown {
  accuracyScore: number;
  speedScore: number;
  roundScore: number;
}

export function scoreRound(
  answerValue: number,
  truthValue: number,
  responseTimeMs: number,
): RoundScoreBreakdown {
  const accuracyScore = Math.max(0, Math.round(MAX_ROUND_SCORE - Math.abs(answerValue - truthValue)));
  const timeRemainingMs = Math.max(0, ROUND_TIME_MS - responseTimeMs);
  const speedScore = Math.round((timeRemainingMs / ROUND_TIME_MS) * MAX_ROUND_SCORE);
  const roundScore = Math.round(accuracyScore * 0.7 + speedScore * 0.3);

  return { accuracyScore, speedScore, roundScore };
}

export function formatCountdown(remainingMs: number): string {
  const seconds = Math.max(0, remainingMs / 1000);
  return seconds.toFixed(1);
}

export function formatMs(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}m ${secs}s`;
}

export function labelForValue(value: number): string {
  if (value <= 15) return 'Real';
  if (value <= 35) return 'Mostly Real';
  if (value <= 65) return 'Uncertain';
  if (value <= 85) return 'Mostly Fake';
  return 'Fake';
}
