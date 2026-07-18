import type { GameSession, TrophyEntry } from '../../types/game';
import {
  getAiAnswersForRound,
  getCategoryById,
  getCrowdMean,
  getRoundsForCategory,
  MOCK_CATEGORIES,
} from '../mock/data';
import { upsertGame } from '../storage/gameHistoryStorage';
import { scoreRound, sumRoundScores } from '../scoring';
import { fetchCategoryLeaderboard } from './leaderboardService';
import { syncCompletedGame, syncProfile } from './supabaseSyncService';
import type { GameRound } from '../../types/game';
import { ROUNDS_PER_GAME } from '../../types/game';
export function createGameSession(categoryId: string, playerName: string): GameSession {
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

  return {
    id: `game_${Date.now()}`,
    categoryId,
    categoryName: category.name,
    playerName,
    status: 'in_progress',
    rounds,
    totalScore: 0,
    startedAt: new Date().toISOString(),
  };
}

export function submitRoundAnswer(
  game: GameSession,
  roundIndex: number,
  answerValue: number,
  responseTimeMs: number,
): GameSession {
  const round = game.rounds[roundIndex];
  if (!round) throw new Error('Round not found');

  const { userBrier, crowdBrier, modelBrier, benchmarkBrier, roundScore } = scoreRound(
    answerValue,
    round.truthValue,
    round.crowdMean,
    round.aiAnswers,
  );

  const updatedRounds = [...game.rounds];
  updatedRounds[roundIndex] = {
    ...round,
    playerAnswer: {
      answerValue,
      responseTimeMs,
      userBrier,
      crowdBrier,
      modelBrier,
      benchmarkBrier,
      roundScore,
    },
  };

  return {
    ...game,
    rounds: updatedRounds,
    totalScore: sumRoundScores(updatedRounds.map((r) => r.playerAnswer?.roundScore ?? 0)),
  };
}

export async function completeGame(game: GameSession): Promise<GameSession> {
  const completed: GameSession = {
    ...game,
    status: 'completed',
    completedAt: new Date().toISOString(),
  };

  try {
    await upsertGame(completed);
  } catch (err) {
    console.warn('Local save failed (game still complete in memory):', err);
  }

  try {
    await syncCompletedGame(completed);
  } catch (err) {
    console.warn('Remote sync failed (game still saved locally):', err);
  }

  return completed;
}

export function getBestScoreForCategory(
  history: GameSession[],
  categoryId: string,
  playerName: string,
): number {
  const scores = history
    .filter((g) => g.categoryId === categoryId && g.playerName === playerName)
    .map((g) => g.totalScore);
  return scores.length ? Math.max(...scores) : 0;
}

export async function getLeaderboardForCategory(
  categoryId: string,
  playerName: string,
  playerScore: number,
) {
  return fetchCategoryLeaderboard(categoryId, playerName, playerScore);
}

export async function getLeaderboard(game: GameSession) {
  return fetchCategoryLeaderboard(game.categoryId, game.playerName, game.totalScore);
}

export async function getTrophyCabinet(
  playerName: string,
  history: GameSession[],
): Promise<TrophyEntry[]> {
  const entries = await Promise.all(
    MOCK_CATEGORIES.map(async (category) => {
      const categoryGames = history.filter(
        (g) => g.categoryId === category.id && g.playerName === playerName,
      );
      const bestScore = categoryGames.length
        ? Math.max(...categoryGames.map((g) => g.totalScore))
        : 0;

      let rank: number | null = null;
      if (categoryGames.length > 0) {
        const board = await fetchCategoryLeaderboard(category.id, playerName, bestScore);
        const top = board.topEntries.find((e) => e.isCurrentPlayer);
        rank = top?.rank ?? board.pinnedPlayerEntry?.rank ?? null;
      }

      return {
        categoryId: category.id,
        categoryName: category.name,
        icon: category.icon,
        bestScore,
        rank,
        gamesPlayed: categoryGames.length,
      };
    }),
  );

  return entries.sort((a, b) => {
    if (a.rank === null && b.rank === null) return a.categoryName.localeCompare(b.categoryName);
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });
}

export { syncProfile };
