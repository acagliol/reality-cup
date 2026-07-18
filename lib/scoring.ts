import {
  ACCURACY_WEIGHT,
  MAX_ROUND_SCORE,
  ROUND_TIME_MS,
  SPEED_WEIGHT,
} from '../types/game';

export interface RoundScoreBreakdown {
  accuracyScore: number;
  speedScore: number;
  roundScore: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Score one round on a 0–100 scale.
 *
 * All values use the same 0–100 probability scale (P fake / AI-generated).
 *
 * Accuracy (0–100): linear calibration — perfect forecast scores 100.
 *   A = max(0, 100 − |answer − truth|)
 *
 * Speed (0–100): linear bonus from time remaining in the countdown window.
 *   S = (ROUND_TIME_MS − min(responseMs, ROUND_TIME_MS)) / ROUND_TIME_MS × 100
 *
 * Round score (integer): weighted composite, rounded once at the end.
 *   R = round(A × 0.7 + S × 0.3)
 *
 * Max per round: 100. Max game total: 1000 (10 rounds).
 */
export function scoreRound(
  answerValue: number,
  truthValue: number,
  responseTimeMs: number,
): RoundScoreBreakdown {
  const answer = clamp(Math.round(answerValue), 0, MAX_ROUND_SCORE);
  const truth = clamp(Math.round(truthValue), 0, MAX_ROUND_SCORE);
  const responseMs = clamp(responseTimeMs, 0, ROUND_TIME_MS);

  const accuracyRaw = Math.max(0, MAX_ROUND_SCORE - Math.abs(answer - truth));
  const timeRemainingMs = ROUND_TIME_MS - responseMs;
  const speedRaw = (timeRemainingMs / ROUND_TIME_MS) * MAX_ROUND_SCORE;

  const roundScore = Math.round(accuracyRaw * ACCURACY_WEIGHT + speedRaw * SPEED_WEIGHT);
  const accuracyScore = Math.round(accuracyRaw);
  const speedScore = Math.round(speedRaw * 10) / 10;

  return { accuracyScore, speedScore, roundScore };
}

export function sumRoundScores(roundScores: number[]): number {
  return roundScores.reduce((total, score) => total + score, 0);
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
