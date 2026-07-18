import type { CategoryLeaderboard, LeaderboardEntry } from '../../types/game';
import { LEADERBOARD_TOP_N } from '../../types/game';
import { buildMockLeaderboard } from '../mock/data';
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

export async function fetchCategoryLeaderboard(
  categoryId: string,
  playerName: string,
  localBestScore: number,
): Promise<CategoryLeaderboard> {
  if (!isSupabaseConfigured || !supabase) {
    return splitLeaderboard(
      buildMockLeaderboard(playerName, localBestScore, categoryId),
      playerName,
    );
  }

  const { data, error } = await supabase
    .from('leaderboard_by_category')
    .select('player_name, best_score')
    .eq('category_id', categoryId)
    .order('best_score', { ascending: false });

  if (error) {
    console.warn('Leaderboard fetch failed, using mock data:', error.message);
    return splitLeaderboard(
      buildMockLeaderboard(playerName, localBestScore, categoryId),
      playerName,
    );
  }

  const rows = (data ?? []) as LeaderboardRow[];
  let playerRows = rows.map((r) => ({
    playerName: r.player_name,
    score: Number(r.best_score),
  }));

  const playerInDb = playerRows.some((r) => r.playerName === playerName);
  if (!playerInDb && localBestScore > 0) {
    playerRows = [...playerRows, { playerName, score: localBestScore }];
  }

  const ranked = rankEntries(playerRows, playerName);
  return splitLeaderboard(ranked, playerName);
}

export function getMockCategoryLeaderboard(
  categoryId: string,
  playerName: string,
  localBestScore: number,
): CategoryLeaderboard {
  return splitLeaderboard(
    buildMockLeaderboard(playerName, localBestScore, categoryId),
    playerName,
  );
}
