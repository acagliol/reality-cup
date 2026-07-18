import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { formatRbp } from '../lib/scoring';
import { theme } from '../lib/theme';

export function ProfileScreen() {
  const { playerName, gameHistory, navigate } = useApp();

  const completedGames = gameHistory;
  const bestScore = completedGames.length
    ? Math.max(...completedGames.map((g) => g.totalScore))
    : 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Analyst profile"
        subtitle={`Forecasting as ${playerName ?? 'Anonymous'}`}
        totalRbp={completedGames.length > 0 ? bestScore : undefined}
      />

      <Pressable
        style={styles.trophyButton}
        onPress={() => navigate({ name: 'trophy-cabinet' })}
      >
        <Text style={styles.trophyIcon}>🏆</Text>
        <View style={styles.trophyBody}>
          <Text style={styles.trophyTitle}>Trophy cabinet</Text>
          <Text style={styles.trophySub}>Podium placements & cash prizes</Text>
        </View>
        <Text style={styles.trophyChevron}>→</Text>
      </Pressable>

      <View style={styles.stats}>
        <View style={[styles.statBox, styles.statBoxHighlight]}>
          <Text style={styles.statNum}>
            {completedGames.length > 0 ? formatRbp(bestScore) : '—'}
          </Text>
          <Text style={styles.statLabel}>Best RBP</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{completedGames.length}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </View>

      <Text style={styles.section}>Track Your Forecasts</Text>

      <FlatList
        data={completedGames}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No completed sessions yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigate({ name: 'game-history', gameId: item.id })}
          >
            <View style={styles.cardTop}>
              <View style={styles.openBadge}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>SETTLED</Text>
              </View>
              <Text style={styles.editLink}>View →</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>{item.categoryName}</Text>
              <Text style={styles.score}>{formatRbp(item.totalScore)}</Text>
            </View>
            <Text style={styles.cardMeta}>
              {new Date(item.completedAt ?? item.startedAt).toLocaleDateString()} ·{' '}
              {item.rounds.length} images
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  trophyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  trophyIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  trophyBody: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  trophySub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  trophyChevron: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statBoxHighlight: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: theme.colors.accent,
  },
  statNum: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  section: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textMuted,
  },
  openText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
  },
  score: {
    color: theme.colors.text,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
    fontSize: 16,
  },
  cardMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
