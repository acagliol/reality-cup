import type { CategoryLeaderboard, LeaderboardEntry } from '../../types/game';
import { LEADERBOARD_TOP_N } from '../../types/game';
import { isSupabaseConfigured, supabase } from '../supabase';

interface LeaderboardRow {
  player_name: string;
  best_score: number;
}

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
  };
}

function localOnlyLeaderboard(playerName: string, localBestScore: number): CategoryLeaderboard {
  if (localBestScore <= 0) {
    return { topEntries: [], pinnedPlayerEntry: null };
  }
  return splitLeaderboard(
    [{ rank: 1, playerName, score: localBestScore, isCurrentPlayer: true }],
    playerName,
  );
}

export async function fetchCategoryLeaderboard(
  categoryId: string,
  playerName: string,
  localBestScore: number,
): Promise<CategoryLeaderboard> {
  if (!isSupabaseConfigured || !supabase) {
    return localOnlyLeaderboard(playerName, localBestScore);
  }

  const { data, error } = await supabase
    .from('leaderboard_by_category')
    .select('player_name, best_score')
    .eq('category_id', categoryId)
    .order('best_score', { ascending: false });

  if (error) {
    console.warn('Leaderboard fetch failed:', error.message);
    return localOnlyLeaderboard(playerName, localBestScore);
  }

  const rows = (data ?? []) as LeaderboardRow[];
  const playerRows = rows.map((r) => ({
    playerName: r.player_name,
    score: Number(r.best_score),
  }));

  if (playerRows.length === 0) {
    if (localBestScore > 0) {
      return splitLeaderboard(
        [{ rank: 1, playerName, score: localBestScore, isCurrentPlayer: true }],
        playerName,
      );
    }
    return { topEntries: [], pinnedPlayerEntry: null };
  }

  const playerInDb = playerRows.some((r) => r.playerName === playerName);
  const mergedRows =
    !playerInDb && localBestScore > 0
      ? [...playerRows, { playerName, score: localBestScore }]
      : playerRows;

  const ranked = rankEntries(mergedRows, playerName);
  return splitLeaderboard(ranked, playerName);
}
