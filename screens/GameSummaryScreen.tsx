import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RoundBreakdown } from '../components/RoundBreakdown';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { getLeaderboard } from '../lib/services/gameService';
import { theme } from '../lib/theme';

interface GameSummaryScreenProps {
  gameId: string;
}

export function GameSummaryScreen({ gameId }: GameSummaryScreenProps) {
  const { activeGame, goBack, resetToTabs } = useApp();
  const game = activeGame?.id === gameId ? activeGame : null;

  if (!game) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Summary" onBack={goBack} />
      </View>
    );
  }

  const leaderboard = getLeaderboard(game);
  const playerEntry = leaderboard.find((e) => e.isCurrentPlayer);
  const avgScore = Math.round(game.totalScore / game.rounds.length);
  const bestRound = game.rounds.reduce(
    (best, r) =>
      (r.playerAnswer?.roundScore ?? 0) > (best.playerAnswer?.roundScore ?? 0) ? r : best,
    game.rounds[0],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Game Complete!"
        subtitle={`${game.categoryName} · ${game.totalScore} total points`}
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{game.totalScore}</Text>
            <Text style={styles.statLabel}>Total Score</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{avgScore}</Text>
            <Text style={styles.statLabel}>Avg / Round</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>#{playerEntry?.rank ?? '—'}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Round Breakdown</Text>
        <Text style={styles.sectionHint}>Tap a round to expand details, or open full view</Text>
        {game.rounds.map((round) => (
          <RoundBreakdown key={round.roundContentId} round={round} />
        ))}

        <Text style={[styles.sectionTitle, styles.sectionSpaced]}>Best Round</Text>
        <View style={styles.bestCard}>
          <Text style={styles.bestText}>
            Round {bestRound.roundNumber}: {bestRound.playerAnswer?.roundScore ?? 0} pts
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {leaderboard.map((entry) => (
          <View
            key={`${entry.rank}-${entry.playerName}`}
            style={[styles.leaderRow, entry.isCurrentPlayer && styles.leaderRowHighlight]}
          >
            <Text style={styles.rank}>#{entry.rank}</Text>
            <Text style={[styles.name, entry.isCurrentPlayer && styles.nameHighlight]}>
              {entry.playerName}
              {entry.isCurrentPlayer ? ' (you)' : ''}
            </Text>
            <Text style={styles.score}>{entry.score}</Text>
          </View>
        ))}

        <Pressable style={styles.button} onPress={resetToTabs}>
          <Text style={styles.buttonText}>Back to Menu</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xxl,
  },
  stat: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    ...theme.shadow.sm,
  },
  statValue: {
    color: c.accent,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: c.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  sectionHint: {
    color: c.textMuted,
    fontSize: 13,
    marginBottom: theme.spacing.lg,
  },
  sectionSpaced: {
    marginTop: theme.spacing.xxl,
  },
  bestCard: {
    backgroundColor: c.accentMuted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  bestText: {
    color: c.text,
    fontWeight: '600',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
  },
  leaderRowHighlight: {
    borderColor: c.accent,
    backgroundColor: c.accentMuted,
  },
  rank: {
    color: c.textMuted,
    width: 36,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    color: c.text,
    fontWeight: '600',
  },
  nameHighlight: {
    color: c.accent,
  },
  score: {
    color: c.warning,
    fontWeight: '800',
    fontSize: 16,
  },
  button: {
    marginTop: theme.spacing.lg,
    backgroundColor: c.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  buttonText: {
    color: c.white,
    fontWeight: '800',
    fontSize: 17,
  },
});
