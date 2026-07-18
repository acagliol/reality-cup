import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LeaderboardList, LeaderboardLoading } from '../components/LeaderboardList';
import { RoundBreakdown } from '../components/RoundBreakdown';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { fetchCategoryLeaderboard } from '../lib/services/leaderboardService';
import { formatRbp } from '../lib/scoring';
import { theme } from '../lib/theme';
import type { CategoryLeaderboard } from '../types/game';

interface GameSummaryScreenProps {
  gameId: string;
}

export function GameSummaryScreen({ gameId }: GameSummaryScreenProps) {
  const { activeGame, leaveSummary, resetToTabs, gameHistory } = useApp();
  const game = useMemo(
    () =>
      activeGame?.id === gameId
        ? activeGame
        : gameHistory.find((g) => g.id === gameId) ?? null,
    [activeGame, gameHistory, gameId],
  );

  const [leaderboard, setLeaderboard] = useState<CategoryLeaderboard | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    (async () => {
      setLeaderboardLoading(true);
      try {
        const data = await fetchCategoryLeaderboard(
          game.categoryId,
          game.playerName,
          game.totalScore,
        );
        if (!cancelled) setLeaderboard(data);
      } catch (err) {
        console.warn('Leaderboard fetch failed', err);
        if (!cancelled) setLeaderboard(null);
      } finally {
        if (!cancelled) setLeaderboardLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game?.id, game?.categoryId, game?.playerName, game?.totalScore]);

  if (!game) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Results" onBack={leaveSummary} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.text} size="large" />
          <Text style={styles.missing}>Loading results…</Text>
        </View>
      </View>
    );
  }

  const pinned = leaderboard?.pinnedPlayerEntry;
  const topPlayer = leaderboard?.topEntries.find((e) => e.isCurrentPlayer);
  const playerRank = topPlayer?.rank ?? pinned?.rank;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Session complete"
        subtitle={`${game.categoryName}`}
        onBack={leaveSummary}
        totalRbp={Number.isFinite(game.totalScore) ? game.totalScore : undefined}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statsRow}>
          <View style={[styles.stat, styles.statHighlight]}>
            <Text style={styles.statValue}>
              {Number.isFinite(game.totalScore) ? formatRbp(game.totalScore) : '—'}
            </Text>
            <Text style={styles.statLabel}>Total RBP</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>#{playerRank ?? '—'}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{game.rounds.length}</Text>
            <Text style={styles.statLabel}>Images</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Forecast breakdown</Text>
        {game.rounds.map((round) => (
          <RoundBreakdown
            key={round.roundContentId}
            round={round}
            categoryId={game.categoryId}
          />
        ))}

        <Text style={[styles.sectionTitle, styles.sectionSpaced]}>Global Leaderboard</Text>
        {leaderboardLoading || !leaderboard ? (
          <LeaderboardLoading />
        ) : (
          <LeaderboardList data={leaderboard} compact />
        )}

        <Pressable style={styles.button} onPress={resetToTabs}>
          <Text style={styles.buttonText}>Back to Markets →</Text>
        </Pressable>
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
  },
  statHighlight: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: theme.colors.accent,
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
    fontSize: 10,
    marginTop: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSpaced: {
    marginTop: theme.spacing.xxl,
  },
  button: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    ...theme.shadow.sm,
  },
  buttonText: {
    color: theme.colors.accentText,
    fontWeight: '800',
    fontSize: 17,
  },
  missing: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
});
