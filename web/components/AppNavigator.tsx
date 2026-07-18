'use client';

import { CategoryThemeProvider } from '@/context/CategoryThemeContext';
import { useApp } from '@/context/AppContext';
import { CategoryDetailScreen } from '@/screens/CategoryDetailScreen';
import { GameHistoryDetailScreen } from '@/screens/GameHistoryDetailScreen';
import { GameScreen } from '@/screens/GameScreen';
import { GameSummaryScreen } from '@/screens/GameSummaryScreen';
import { MainTabsScreen } from '@/screens/MainTabsScreen';
import { TrophyCabinetScreen } from '@/screens/TrophyCabinetScreen';
import styles from './AppNavigator.module.css';

function resolveCategoryId(
  screen: ReturnType<typeof useApp>['screen'],
  activeGame: ReturnType<typeof useApp>['activeGame'],
  gameHistory: ReturnType<typeof useApp>['gameHistory'],
): string | null {
  switch (screen.name) {
    case 'category-detail':
      return screen.categoryId;
    case 'game':
      return screen.categoryId;
    case 'game-summary': {
      if (activeGame?.id === screen.gameId) return activeGame.categoryId;
      return gameHistory.find((g) => g.id === screen.gameId)?.categoryId ?? null;
    }
    case 'game-history': {
      const game = gameHistory.find((g) => g.id === screen.gameId);
      return game?.categoryId ?? null;
    }
    default:
      return null;
  }
}

export function AppNavigator() {
  const { screen, loading, activeGame, gameHistory } = useApp();
  const categoryId = resolveCategoryId(screen, activeGame, gameHistory);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner" />
      </div>
    );
  }

  const content = (() => {
    switch (screen.name) {
      case 'tabs':
        return <MainTabsScreen />;
      case 'category-detail':
        return <CategoryDetailScreen categoryId={screen.categoryId} />;
      case 'game':
        return <GameScreen />;
      case 'game-summary':
        return <GameSummaryScreen gameId={screen.gameId} />;
      case 'game-history':
        return <GameHistoryDetailScreen gameId={screen.gameId} />;
      case 'trophy-cabinet':
        return <TrophyCabinetScreen />;
      default:
        return <MainTabsScreen />;
    }
  })();

  return (
    <div className={styles.root}>
      <CategoryThemeProvider categoryId={categoryId}>{content}</CategoryThemeProvider>
    </div>
  );
}
