import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LeaderboardList, LeaderboardLoading } from '../components/LeaderboardList';
import { RoundBreakdown } from '../components/RoundBreakdown';
import { ScreenHeader } from '../components/ScreenHeader';
import { useCategoryTheme } from '../context/CategoryThemeContext';
import { useApp } from '../context/AppContext';
import { fetchCategoryLeaderboard } from '../lib/services/leaderboardService';
import { theme } from '../lib/theme';
import type { CategoryLeaderboard } from '../types/game';

interface GameSummaryScreenProps {
  gameId: string;
}

export function GameSummaryScreen({ gameId }: GameSummaryScreenProps) {
  const cat = useCategoryTheme();
  const { activeGame, goBack, resetToTabs, gameHistory } = useApp();
  const game =
    activeGame?.id === gameId ? activeGame : gameHistory.find((g) => g.id === gameId) ?? null;

  const [leaderboard, setLeaderboard] = useState<CategoryLeaderboard | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    if (!game) return;
    (async () => {
      setLeaderboardLoading(true);
      try {
        const data = await fetchCategoryLeaderboard(
          game.categoryId,
          game.playerName,
          game.totalScore,
        );
        setLeaderboard(data);
      } finally {
        setLeaderboardLoading(false);
      }
    })();
  }, [game]);

  if (!game) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Results" onBack={goBack} />
      </View>
    );
  }

  const pinned = leaderboard?.pinnedPlayerEntry;
  const topPlayer = leaderboard?.topEntries.find((e) => e.isCurrentPlayer);
  const playerRank = topPlayer?.rank ?? pinned?.rank;
  const avgScore = Math.round(game.totalScore / game.rounds.length);

  return (
    <View style={[styles.container, { backgroundColor: cat.heroBg }]}>
      <ScreenHeader
        title="Session complete"
        subtitle={`${game.categoryName} · ${game.totalScore} pts`}
        onBack={goBack}
        accentColor={cat.primary}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statsRow}>
          <View style={[styles.stat, { borderColor: cat.primaryMuted }]}>
            <Text style={[styles.statValue, { color: cat.primary }]}>{game.totalScore}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{avgScore}</Text>
            <Text style={styles.statLabel}>Avg / round</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: cat.primary }]}>
              #{playerRank ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Forecast breakdown</Text>
        <Text style={styles.sectionHint}>Expand each round or tap ↗ for full view</Text>
        {game.rounds.map((round) => (
          <RoundBreakdown
            key={round.roundContentId}
            round={round}
            categoryId={game.categoryId}
          />
        ))}

        <Text style={[styles.sectionTitle, styles.sectionSpaced]}>Leaderboard · Top 10</Text>
        {leaderboardLoading || !leaderboard ? (
          <LeaderboardLoading />
        ) : (
          <LeaderboardList data={leaderboard} compact />
        )}

        <Pressable
          style={[styles.button, { backgroundColor: cat.primary }]}
          onPress={resetToTabs}
        >
          <Text style={styles.buttonText}>Back to markets</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
    color: theme.colors.text,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHint: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: theme.spacing.lg,
  },
  sectionSpaced: {
    marginTop: theme.spacing.xxl,
  },
  button: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontWeight: '800',
    fontSize: 17,
  },
});
