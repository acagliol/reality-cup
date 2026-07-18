import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RoundBreakdown } from '../components/RoundBreakdown';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { formatRbp } from '../lib/scoring';
import { theme } from '../lib/theme';

interface GameHistoryDetailScreenProps {
  gameId: string;
}

export function GameHistoryDetailScreen({ gameId }: GameHistoryDetailScreenProps) {
  const { gameHistory, goBack } = useApp();
  const game = gameHistory.find((g) => g.id === gameId);

  if (!game) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="History" onBack={goBack} />
        <Text style={styles.missing}>Game not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={game.categoryName}
        subtitle={`${formatRbp(game.totalScore)} RBP · ${game.status === 'completed' ? 'Completed' : 'In progress'}`}
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {game.rounds.map((round) => (
          <RoundBreakdown
            key={round.roundContentId}
            round={round}
            categoryId={game.categoryId}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  missing: {
    color: theme.colors.textMuted,
    padding: theme.spacing.xl,
  },
});
