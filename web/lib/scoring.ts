import type { AiAnswer } from '@/types/game';

export const BENCHMARK_CROWD_WEIGHT = 0.45;
export const BENCHMARK_MODEL_WEIGHT = 0.55;
export const RBP_HARDNESS_MARGIN = 0.015;
export const RBP_SCALE = 100;

export interface RoundScoreBreakdown {
  userBrier: number;
  crowdBrier: number;
  modelBrier: number;
  benchmarkBrier: number;
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

export function answerToProbability(answerValue: number): number {
  return clamp(Math.round(answerValue), 1, 99) / 100;
}

export function brierScore(probabilityFake: number, y: 0 | 1): number {
  const p = clamp(probabilityFake, 0.01, 0.99);
  return (p - y) ** 2;
}

function meanModelBrier(aiAnswers: AiAnswer[], y: 0 | 1): number {
  if (aiAnswers.length === 0) return 0;
  const total = aiAnswers.reduce(
    (sum, ai) => sum + brierScore(answerToProbability(ai.answerValue), y),
    0,
  );
  return total / aiAnswers.length;
}

function compositeBenchmarkBrier(crowdBrier: number, modelBrier: number): number {
  return BENCHMARK_CROWD_WEIGHT * crowdBrier + BENCHMARK_MODEL_WEIGHT * modelBrier;
}

export function scoreRound(
  answerValue: number,
  truthValue: number,
  crowdMean: number,
  aiAnswers: AiAnswer[],
): RoundScoreBreakdown {
  const y = truthToBinary(truthValue);
  const userBrier = brierScore(answerToProbability(answerValue), y);
  const crowdBrier = brierScore(answerToProbability(crowdMean), y);
  const modelBrier = meanModelBrier(aiAnswers, y);
  const benchmarkBrier = compositeBenchmarkBrier(crowdBrier, modelBrier);

  const rawRbp = (benchmarkBrier - userBrier - RBP_HARDNESS_MARGIN) * RBP_SCALE;
  const roundScore = Math.round(rawRbp * 10) / 10;

  return {
    userBrier: round4(userBrier),
    crowdBrier: round4(crowdBrier),
    modelBrier: round4(modelBrier),
    benchmarkBrier: round4(benchmarkBrier),
    roundScore,
  };
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

export function sumRoundScores(roundScores: number[]): number {
  return Math.round(roundScores.reduce((total, score) => total + score, 0) * 10) / 10;
}

export function formatRbp(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
}

export function formatBrier(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(4);
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
