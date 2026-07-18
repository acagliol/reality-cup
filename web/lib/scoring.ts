import { ACCURACY_WEIGHT, ROUND_TIME_MS, SPEED_WEIGHT } from '@/types/game';

export interface RoundScoreBreakdown {
  accuracyScore: number;
  speedScore: number;
  roundScore: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function truthToBinary(truthValue: number): 0 | 1 {
  return truthValue >= 50 ? 1 : 0;
}

export function displayTruthValue(truthValue: number): 0 | 100 {
  return truthValue >= 50 ? 100 : 0;
}

export function truthLabel(truthValue: number): 'Real' | 'Fake' {
  return truthToBinary(truthValue) === 1 ? 'Fake' : 'Real';
}

export function scoreRound(
  answerValue: number,
  truthValue: number,
  responseTimeMs: number,
): RoundScoreBreakdown {
  const answer = clamp(Math.round(answerValue), 0, 100);
  const truth = clamp(Math.round(truthValue), 0, 100);

  const accuracyScore = Math.max(0, 100 - Math.abs(answer - truth));
  const elapsed = clamp(responseTimeMs, 0, ROUND_TIME_MS);
  const speedScore = Math.round(((ROUND_TIME_MS - elapsed) / ROUND_TIME_MS) * 100);

  const roundScore = Math.round(
    ACCURACY_WEIGHT * accuracyScore + SPEED_WEIGHT * speedScore,
  );

  return { accuracyScore, speedScore, roundScore };
}

export function sumRoundScores(roundScores: number[]): number {
  return roundScores.reduce((total, score) => total + score, 0);
}

export function formatScore(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return String(Math.round(value));
}

/** @deprecated Use formatScore */
export function formatRbp(value: number): string {
  return formatScore(value);
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
