import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameSession } from '../../types/game';

const HISTORY_KEY = '@realorfake/game_history';

export async function loadGameHistory(): Promise<GameSession[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GameSession[];
  } catch {
    return [];
  }
}

export async function saveGameHistory(games: GameSession[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(games));
}

export async function upsertGame(game: GameSession): Promise<void> {
  const history = await loadGameHistory();
  const index = history.findIndex((g) => g.id === game.id);
  if (index >= 0) history[index] = game;
  else history.unshift(game);
  await saveGameHistory(history);
}

export async function getGameById(gameId: string): Promise<GameSession | undefined> {
  const history = await loadGameHistory();
  return history.find((g) => g.id === gameId);
}
