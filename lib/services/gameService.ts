import {
  buildMockLeaderboard,
  getAiAnswersForRound,
  getCategoryById,
  getCrowdMean,
  getRoundsForCategory,
} from '../mock/data';
import { upsertGame } from '../storage/gameHistoryStorage';
import { scoreRound } from '../scoring';
import type { GameRound, GameSession, LeaderboardEntry } from '../../types/game';
import { ROUNDS_PER_GAME } from '../../types/game';

export async function createGameSession(
  categoryId: string,
  playerName: string,
): Promise<GameSession> {
  const category = getCategoryById(categoryId);
  if (!category) throw new Error('Category not found');

  const content = getRoundsForCategory(categoryId, ROUNDS_PER_GAME);
  const rounds: GameRound[] = content.map((item, index) => ({
    roundNumber: index + 1,
    roundContentId: item.id,
    imageUrl: item.imageUrl,
    truthValue: item.truthValue,
    crowdMean: getCrowdMean(item.id),
    aiAnswers: getAiAnswersForRound(item.id),
  }));

  const game: GameSession = {
    id: `game_${Date.now()}`,
    categoryId,
    categoryName: category.name,
    playerName,
    status: 'in_progress',
    rounds,
    totalScore: 0,
    startedAt: new Date().toISOString(),
  };

  await upsertGame(game);
  return game;
}

export async function submitRoundAnswer(
  game: GameSession,
  roundIndex: number,
  answerValue: number,
  responseTimeMs: number,
): Promise<GameSession> {
  const round = game.rounds[roundIndex];
  if (!round) throw new Error('Round not found');

  const { accuracyScore, speedScore, roundScore } = scoreRound(
    answerValue,
    round.truthValue,
    responseTimeMs,
  );

  const updatedRounds = [...game.rounds];
  updatedRounds[roundIndex] = {
    ...round,
    playerAnswer: {
      answerValue,
      responseTimeMs,
      accuracyScore,
      speedScore,
      roundScore,
    },
  };

  const updated: GameSession = {
    ...game,
    rounds: updatedRounds,
    totalScore: updatedRounds.reduce(
      (sum, r) => sum + (r.playerAnswer?.roundScore ?? 0),
      0,
    ),
  };

  await upsertGame(updated);
  return updated;
}

export async function completeGame(game: GameSession): Promise<GameSession> {
  const completed: GameSession = {
    ...game,
    status: 'completed',
    completedAt: new Date().toISOString(),
  };
  await upsertGame(completed);
  return completed;
}

export function getLeaderboard(game: GameSession): LeaderboardEntry[] {
  return buildMockLeaderboard(game.playerName, game.totalScore, game.categoryId);
}
