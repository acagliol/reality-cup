import type { GameSession } from '@/types/game';

const HISTORY_KEY = '@realorfake/game_history';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export async function loadGameHistory(): Promise<GameSession[]> {
  const raw = getStorage()?.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GameSession[];
    const completed = parsed.filter((g) => g.status === 'completed');
    if (completed.length !== parsed.length) {
      await saveGameHistory(completed);
    }
    return completed;
  } catch {
    return [];
  }
}

export async function saveGameHistory(games: GameSession[]): Promise<void> {
  getStorage()?.setItem(HISTORY_KEY, JSON.stringify(games));
}

export async function upsertGame(game: GameSession): Promise<void> {
  if (game.status !== 'completed') return;
  const history = await loadGameHistory();
  const index = history.findIndex((g) => g.id === game.id);
  if (index >= 0) history[index] = game;
  else history.unshift(game);
  await saveGameHistory(history);
}
