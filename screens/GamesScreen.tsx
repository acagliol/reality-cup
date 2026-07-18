import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { theme } from '../lib/theme';

export function GamesScreen() {
  const {
    playerName,
    navigate,
    gameHistory,
    categories,
    categoriesLoading,
    categoriesError,
    refreshCategories,
  } = useApp();

  const bestScore = gameHistory.length
    ? Math.max(...gameHistory.map((g) => g.totalScore))
    : 0;
  const streak = gameHistory.length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`Hey, ${playerName ?? 'Analyst'}!`}
        subtitle={
          streak > 0
            ? `${streak} session${streak === 1 ? '' : 's'} forecasted`
            : 'Price the probability. Beat the machines.'
        }
        totalRbp={bestScore > 0 ? bestScore : undefined}
      />

      <Text style={styles.sectionTitle}>Track Your Forecasts</Text>

      {categoriesLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.textMuted} />
        </View>
      ) : categoriesError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Could not load markets</Text>
          <Text style={styles.errorText}>{categoriesError}</Text>
          <Pressable style={styles.retryButton} onPress={refreshCategories}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>No markets available</Text>
          <Text style={styles.errorText}>
            Categories are missing in Supabase. Run npm run pools:seed:descriptions.
          </Text>
          <Pressable style={styles.retryButton} onPress={refreshCategories}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={styles.listContainer}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigate({ name: 'category-detail', categoryId: item.id })}
            >
              <View style={styles.cardTop}>
                <View style={styles.closingBadge}>
                  <View style={styles.closingDot} />
                  <Text style={styles.closingText}>OPEN</Text>
                </View>
                <Text style={styles.editLink}>Play →</Text>
              </View>

              <View style={styles.cardMatch}>
                <View style={styles.side}>
                  <Text style={styles.sideIcon}>{item.icon}</Text>
                  <Text style={styles.sideLabel}>Real</Text>
                </View>
                <View style={styles.cardCenter}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <View style={[styles.side, styles.sideRight]}>
                  <Text style={styles.sideIcon}>🤖</Text>
                  <Text style={styles.sideLabel}>Fake</Text>
                </View>
              </View>

              <Text style={styles.cardMeta}>10 images · 10s window · accuracy + speed</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  errorTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retryText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  closingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  closingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  closingText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 0.6,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  cardMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  side: {
    alignItems: 'center',
    width: 52,
  },
  sideRight: {
    alignItems: 'center',
  },
  sideIcon: {
    fontSize: 24,
  },
  sideLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  cardCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  cardMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
