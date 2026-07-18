import { SPONSOR_AI_MODELS, formatModelSubtitle } from '@/lib/ai/sponsorModels';
import { isRandomCategory, POOL_CATEGORY_IDS } from '@/lib/constants/categories';
import { scoreRound } from '@/lib/scoring';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { CategoryLeaderboard, LeaderboardEntry } from '@/types/game';
import { LEADERBOARD_TOP_N, ROUNDS_PER_GAME } from '@/types/game';

interface LeaderboardRow {
  player_name: string;
  best_score: number;
}

interface RoundRow {
  id: string;
  truth_value: number;
}

interface AiAnswerRow {
  round_content_id: string;
  ai_model_id: string;
  answer_value: number;
}

const AI_RESPONSE_TIME_MS = 0;

function rankEntries(rows: { playerName: string; score: number }[], playerName: string): LeaderboardEntry[] {
  const sorted = [...rows].sort(
    (a, b) => b.score - a.score || a.playerName.localeCompare(b.playerName),
  );
  return sorted.map((row, index) => ({
    rank: index + 1,
    playerName: row.playerName,
    score: row.score,
    isCurrentPlayer: row.playerName === playerName,
  }));
}

export function splitLeaderboard(
  entries: LeaderboardEntry[],
  playerName: string,
  topN = LEADERBOARD_TOP_N,
): CategoryLeaderboard {
  const topEntries = entries.slice(0, topN).map((e) => ({
    ...e,
    isCurrentPlayer: e.playerName === playerName,
  }));

  const playerEntry = entries.find((e) => e.playerName === playerName);
  const playerInTop = topEntries.some((e) => e.isCurrentPlayer);

  return {
    topEntries,
    pinnedPlayerEntry: playerInTop ? null : playerEntry ?? null,
    aiModelEntries: [],
  };
}

function emptyLeaderboard(): CategoryLeaderboard {
  return { topEntries: [], pinnedPlayerEntry: null, aiModelEntries: [] };
}

function localOnlyLeaderboard(playerName: string, localBestScore: number): CategoryLeaderboard {
  if (localBestScore <= 0) {
    return emptyLeaderboard();
  }
  return splitLeaderboard(
    [{ rank: 1, playerName, score: localBestScore, isCurrentPlayer: true }],
    playerName,
  );
}

async function fetchAiModelLeaderboardEntries(categoryId: string): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  let query = supabase
    .from('round_content')
    .select('id, truth_value')
    .eq('active', true);

  if (isRandomCategory(categoryId)) {
    query = query.in('category_id', [...POOL_CATEGORY_IDS]);
  } else {
    query = query.eq('category_id', categoryId);
  }

  const { data: rounds, error: roundsError } = await query;
  if (roundsError) {
    console.warn('AI leaderboard rounds fetch failed:', roundsError.message);
    return [];
  }

  const roundList = (rounds ?? []) as RoundRow[];
  if (roundList.length === 0) return [];

  const truthByRound = new Map(roundList.map((row) => [row.id, row.truth_value]));
  const roundIds = roundList.map((row) => row.id);

  const { data: aiRows, error: aiError } = await supabase
    .from('ai_answers')
    .select('round_content_id, ai_model_id, answer_value')
    .in('round_content_id', roundIds);

  if (aiError) {
    console.warn('AI leaderboard answers fetch failed:', aiError.message);
    return [];
  }

  const roundScoresByModel = new Map<string, number[]>();
  for (const model of SPONSOR_AI_MODELS) {
    roundScoresByModel.set(model.id, []);
  }

  for (const row of (aiRows ?? []) as AiAnswerRow[]) {
    const truth = truthByRound.get(row.round_content_id);
    if (truth === undefined) continue;

    const bucket = roundScoresByModel.get(row.ai_model_id);
    if (!bucket) continue;

    bucket.push(scoreRound(row.answer_value, truth, AI_RESPONSE_TIME_MS).roundScore);
  }

  return SPONSOR_AI_MODELS.map((model) => {
    const roundScores = roundScoresByModel.get(model.id) ?? [];
    if (roundScores.length === 0) return null;

    const avgRoundScore =
      roundScores.reduce((total, score) => total + score, 0) / roundScores.length;

    return {
      rank: 0,
      playerName: model.name,
      score: Math.round(avgRoundScore * ROUNDS_PER_GAME),
      isCurrentPlayer: false,
      isAiModel: true,
      subtitle: formatModelSubtitle(model),
    };
  })
    .filter((entry): entry is LeaderboardEntry => entry !== null)
    .sort((a, b) => b.score - a.score || a.playerName.localeCompare(b.playerName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function fetchCategoryLeaderboard(
  categoryId: string,
  playerName: string,
  localBestScore: number,
): Promise<CategoryLeaderboard> {
  const aiModelEntries = await fetchAiModelLeaderboardEntries(categoryId);

  if (!isSupabaseConfigured || !supabase) {
    const local = localOnlyLeaderboard(playerName, localBestScore);
    return { ...local, aiModelEntries };
  }

  const { data, error } = await supabase
    .from('leaderboard_by_category')
    .select('player_name, best_score')
    .eq('category_id', categoryId)
    .order('best_score', { ascending: false });

  if (error) {
    console.warn('Leaderboard fetch failed:', error.message);
    const local = localOnlyLeaderboard(playerName, localBestScore);
    return { ...local, aiModelEntries };
  }

  const rows = (data ?? []) as LeaderboardRow[];
  const playerRows = rows.map((r) => ({
    playerName: r.player_name,
    score: Number(r.best_score),
  }));

  if (playerRows.length === 0) {
    if (localBestScore > 0) {
      return {
        ...splitLeaderboard(
          [{ rank: 1, playerName, score: localBestScore, isCurrentPlayer: true }],
          playerName,
        ),
        aiModelEntries,
      };
    }
    return { ...emptyLeaderboard(), aiModelEntries };
  }

  const playerInDb = playerRows.some((r) => r.playerName === playerName);
  const mergedRows =
    !playerInDb && localBestScore > 0
      ? [...playerRows, { playerName, score: localBestScore }]
      : playerRows;

  const ranked = rankEntries(mergedRows, playerName);
  return { ...splitLeaderboard(ranked, playerName), aiModelEntries };
}
