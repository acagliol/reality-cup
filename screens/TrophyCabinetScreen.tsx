import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { getTrophyCabinet } from '../lib/services/gameService';
import { getCategoryTheme, theme } from '../lib/theme';
import type { TrophyEntry } from '../types/game';

export function TrophyCabinetScreen() {
  const { playerName, gameHistory, goBack } = useApp();
  const [trophies, setTrophies] = useState<TrophyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getTrophyCabinet(playerName ?? 'Anonymous', gameHistory);
        setTrophies(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [playerName, gameHistory]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Trophy cabinet"
        subtitle="Your best placement in each market"
        onBack={goBack}
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.textMuted} />
        </View>
      ) : trophies.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No trophies yet</Text>
          <Text style={styles.emptyText}>Complete a forecast session to fill your cabinet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {trophies.map((trophy) => {
            const cat = getCategoryTheme(trophy.categoryId);

            return (
              <View
                key={trophy.categoryId}
                style={[
                  styles.card,
                  { borderLeftColor: cat.primary, backgroundColor: cat.heroBg },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: cat.primaryMuted }]}>
                  <Text style={styles.icon}>{trophy.icon}</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.marketName}>{trophy.categoryName}</Text>
                  <Text style={[styles.placement, { color: cat.primary }]}>
                    #{trophy.rank ?? '—'} · {trophy.bestScore} pts
                  </Text>
                  <Text style={styles.meta}>
                    {trophy.gamesPlayed} session{trophy.gamesPlayed === 1 ? '' : 's'} completed
                  </Text>
                </View>
                {trophy.rank !== null && trophy.rank <= 3 && (
                  <Text style={styles.trophy}>🏆</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    gap: theme.spacing.md,
    ...theme.shadow.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  body: {
    flex: 1,
  },
  marketName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  placement: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  meta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  trophy: {
    fontSize: 28,
  },
});
