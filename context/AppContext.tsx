import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { loadGameHistory } from '../lib/storage/gameHistoryStorage';
import { getPlayerName, savePlayerName } from '../lib/storage/playerStorage';
import { syncProfile } from '../lib/services/gameService';
import type { GameSession, Screen, TabId } from '../types/game';

interface AppContextValue {
  playerName: string | null;
  loading: boolean;
  activeTab: TabId;
  screen: Screen;
  gameHistory: GameSession[];
  activeGame: GameSession | null;
  setActiveTab: (tab: TabId) => void;
  navigate: (screen: Screen) => void;
  goBack: () => void;
  resetToTabs: () => void;
  saveName: (name: string) => Promise<void>;
  setActiveGame: (game: GameSession | null) => void;
  refreshHistory: () => Promise<void>;
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

  const screen = screenStack[screenStack.length - 1];

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
    })();
  }, []);

  const navigate = useCallback((next: Screen) => {
    setScreenStack((stack) => [...stack, next]);
  }, []);

  const goBack = useCallback(() => {
    setScreenStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
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
      activeTab,
      screen,
      gameHistory,
      activeGame,
      setActiveTab,
      navigate,
      goBack,
      resetToTabs,
      saveName,
      setActiveGame,
      refreshHistory,
      abandonActiveGame,
    }),
    [
      playerName,
      loading,
      activeTab,
      screen,
      gameHistory,
      activeGame,
      navigate,
      goBack,
      resetToTabs,
      saveName,
      refreshHistory,
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
