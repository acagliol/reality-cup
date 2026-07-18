import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { CategoryLeaderboard, LeaderboardEntry } from '../types/game';
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
  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        entry.isCurrentPlayer && styles.rowYou,
        entry.isAiModel && styles.rowAi,
      ]}
    >
      <Text style={[styles.rank, entry.rank <= 3 && !entry.isAiModel && styles.rankTop]}>
        {entry.isAiModel ? 'AI' : `#${entry.rank}`}
      </Text>
      <View style={styles.nameWrap}>
        <Text style={[styles.name, entry.isCurrentPlayer && styles.nameYou]} numberOfLines={1}>
          {entry.playerName}
          {entry.isCurrentPlayer ? ' (you)' : ''}
        </Text>
        {entry.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {entry.subtitle}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.score, { color: theme.colors.text }]}>
        {Number.isFinite(entry.score) ? entry.score.toFixed(2) : '—'}
      </Text>
    </View>
  );
}

export function LeaderboardList({ data, compact }: LeaderboardListProps) {
  const hasEntries =
    data.topEntries.length > 0 ||
    data.pinnedPlayerEntry !== null ||
    data.aiModelEntries.length > 0;

  if (!hasEntries) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No scores yet</Text>
        <Text style={styles.emptyText}>Complete a session to appear on the board.</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.rankCol]}>#</Text>
        <Text style={[styles.headerCell, styles.nameCol]}>Forecaster</Text>
        <Text style={[styles.headerCell, styles.scoreCol]}>Score</Text>
      </View>

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

      {data.aiModelEntries.length > 0 && (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>AI models</Text>
            <View style={styles.dividerLine} />
          </View>
          {data.aiModelEntries.map((entry) => (
            <LeaderboardRow
              key={`ai-${entry.playerName}`}
              entry={entry}
              compact={compact}
            />
          ))}
        </>
      )}
    </View>
  );
}

export function LeaderboardLoading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={theme.colors.text} />
      <Text style={styles.loadingText}>Loading leaderboard…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rankCol: { width: 36 },
  nameCol: { flex: 1 },
  scoreCol: { width: 72, textAlign: 'right' },
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
  rowYou: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentMuted,
  },
  rowAi: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.surfaceAlt,
  },
  rank: {
    width: 36,
    fontWeight: '800',
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  rankTop: {
    color: theme.colors.text,
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  nameYou: {
    fontWeight: '800',
  },
  score: {
    width: 72,
    textAlign: 'right',
    fontWeight: '800',
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
    color: theme.colors.text,
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
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
