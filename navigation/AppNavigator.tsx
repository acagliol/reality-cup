import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen';
import { GameHistoryDetailScreen } from '../screens/GameHistoryDetailScreen';
import { GameScreen } from '../screens/GameScreen';
import { GameSummaryScreen } from '../screens/GameSummaryScreen';
import { GamesScreen } from '../screens/GamesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { theme } from '../lib/theme';

export function AppNavigator() {
  const { screen, activeTab, loading } = useApp();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  switch (screen.name) {
    case 'tabs':
      return activeTab === 'games' ? <GamesScreen /> : <ProfileScreen />;
    case 'category-detail':
      return <CategoryDetailScreen categoryId={screen.categoryId} />;
    case 'game':
      return <GameScreen />;
    case 'game-summary':
      return <GameSummaryScreen gameId={screen.gameId} />;
    case 'game-history':
      return <GameHistoryDetailScreen gameId={screen.gameId} />;
    default:
      return <GamesScreen />;
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
