import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { loadGameHistory } from '../lib/storage/gameHistoryStorage';
import { getPlayerName, savePlayerName } from '../lib/storage/playerStorage';
import { syncProfile } from '../lib/services/gameService';
import { fetchCategories } from '../lib/services/categoryService';
import type { Category, GameSession, Screen, TabId } from '../types/game';

interface AppContextValue {
  playerName: string | null;
  loading: boolean;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  activeTab: TabId;
  screen: Screen;
  gameHistory: GameSession[];
  activeGame: GameSession | null;
  setActiveTab: (tab: TabId) => void;
  navigate: (screen: Screen) => void;
  finishGame: (gameId: string) => void;
  goBack: () => void;
  leaveSummary: () => void;
  resetToTabs: () => void;
  saveName: (name: string) => Promise<void>;
  setActiveGame: (game: GameSession | null) => void;
  refreshHistory: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  abandonActiveGame: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('games');
  const [screenStack, setScreenStack] = useState<Screen[]>([{ name: 'tabs' }]);
  const [gameHistory, setGameHistory] = useState<GameSession[]>([]);
  const [activeGame, setActiveGame] = useState<GameSession | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const screen = screenStack[screenStack.length - 1];

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setCategories([]);
      setCategoriesError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories],
  );

  const refreshHistory = useCallback(async () => {
    const history = await loadGameHistory();
    setGameHistory(history);
  }, []);

  useEffect(() => {
    (async () => {
      const [name, history] = await Promise.all([getPlayerName(), loadGameHistory()]);
      setPlayerName(name);
      setGameHistory(history);
      setLoading(false);
      await refreshCategories();
    })();
  }, [refreshCategories]);

  const navigate = useCallback((next: Screen) => {
    setScreenStack((stack) => [...stack, next]);
  }, []);

  /** Replace the in-progress game screen with the summary (so Back skips the dead game screen). */
  const finishGame = useCallback((gameId: string) => {
    setScreenStack((stack) => {
      const alreadyOnSummary = stack.some(
        (s) => s.name === 'game-summary' && s.gameId === gameId,
      );
      if (alreadyOnSummary) return stack;

      const withoutGame =
        stack.length > 0 && stack[stack.length - 1].name === 'game'
          ? stack.slice(0, -1)
          : stack;
      return [...withoutGame, { name: 'game-summary', gameId }];
    });
  }, []);

  const goBack = useCallback(() => {
    setScreenStack((stack) => {
      if (stack.length <= 1) return stack;
      // Cannot leave mid-session — must finish all questions
      if (stack[stack.length - 1].name === 'game') return stack;
      return stack.slice(0, -1);
    });
  }, []);

  const leaveSummary = useCallback(() => {
    setActiveGame(null);
    setScreenStack([{ name: 'tabs' }]);
  }, []);

  const resetToTabs = useCallback(() => {
    setScreenStack([{ name: 'tabs' }]);
    setActiveGame(null);
  }, []);

  const abandonActiveGame = useCallback(() => {
    setActiveGame(null);
  }, []);

  const saveName = useCallback(async (name: string) => {
    await savePlayerName(name);
    setPlayerName(name.trim());
    await syncProfile(name.trim());
  }, []);

  const value = useMemo(
    () => ({
      playerName,
      loading,
      categories,
      categoriesLoading,
      categoriesError,
      activeTab,
      screen,
      gameHistory,
      activeGame,
      setActiveTab,
      navigate,
      finishGame,
      goBack,
      leaveSummary,
      resetToTabs,
      saveName,
      setActiveGame,
      refreshHistory,
      refreshCategories,
      getCategoryById,
      abandonActiveGame,
    }),
    [
      playerName,
      loading,
      categories,
      categoriesLoading,
      categoriesError,
      activeTab,
      screen,
      gameHistory,
      activeGame,
      navigate,
      finishGame,
      goBack,
      leaveSummary,
      resetToTabs,
      saveName,
      refreshHistory,
      refreshCategories,
      getCategoryById,
      abandonActiveGame,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
