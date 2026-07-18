import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { CategoryLeaderboard, LeaderboardEntry } from '../types/game';
import { useCategoryTheme } from '../context/CategoryThemeContext';
import { theme } from '../lib/theme';

interface LeaderboardListProps {
  data: CategoryLeaderboard;
  compact?: boolean;
}

function LeaderboardRow({
  entry,
  compact,
}: {
  entry: LeaderboardEntry;
  compact?: boolean;
}) {
  const cat = useCategoryTheme();

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        entry.isCurrentPlayer && {
          borderColor: cat.primary,
          backgroundColor: cat.primaryMuted,
        },
      ]}
    >
      <Text style={[styles.rank, entry.rank <= 3 && { color: cat.primary }]}>#{entry.rank}</Text>
      <Text
        style={[styles.name, entry.isCurrentPlayer && { color: cat.primary }]}
        numberOfLines={1}
      >
        {entry.playerName}
        {entry.isCurrentPlayer ? ' (you)' : ''}
      </Text>
      <Text style={[styles.score, { color: cat.primary }]}>{entry.score}</Text>
    </View>
  );
}

export function LeaderboardList({ data, compact }: LeaderboardListProps) {
  return (
    <View>
      {data.topEntries.map((entry) => (
        <LeaderboardRow key={`top-${entry.rank}-${entry.playerName}`} entry={entry} compact={compact} />
      ))}

      {data.pinnedPlayerEntry && (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Your position</Text>
            <View style={styles.dividerLine} />
          </View>
          <LeaderboardRow entry={data.pinnedPlayerEntry} compact={compact} />
        </>
      )}
    </View>
  );
}

export function LeaderboardLoading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={theme.colors.textMuted} />
      <Text style={styles.loadingText}>Loading leaderboard…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowCompact: {
    backgroundColor: theme.colors.surface,
  },
  rank: {
    width: 36,
    fontWeight: '800',
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  name: {
    flex: 1,
    fontWeight: '600',
    color: theme.colors.text,
  },
  score: {
    fontWeight: '800',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});
