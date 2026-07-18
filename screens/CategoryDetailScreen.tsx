import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LeaderboardSheet } from '../components/LeaderboardSheet';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { createGameSession, getBestScoreForCategory } from '../lib/services/gameService';
import { fetchCategoryLeaderboard } from '../lib/services/leaderboardService';
import { theme } from '../lib/theme';
import type { CategoryLeaderboard } from '../types/game';
import { ROUND_TIME_SECONDS, ROUNDS_PER_GAME } from '../types/game';

interface CategoryDetailScreenProps {
  categoryId: string;
}

export function CategoryDetailScreen({ categoryId }: CategoryDetailScreenProps) {
  const {
    playerName,
    goBack,
    navigate,
    setActiveGame,
    abandonActiveGame,
    gameHistory,
    getCategoryById,
    categoriesLoading,
  } = useApp();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<CategoryLeaderboard | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const category = getCategoryById(categoryId);

  const bestScore = getBestScoreForCategory(gameHistory, categoryId, playerName ?? '');

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const data = await fetchCategoryLeaderboard(
        categoryId,
        playerName ?? 'You',
        bestScore,
      );
      setLeaderboardData(data);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [categoryId, playerName, bestScore]);

  useEffect(() => {
    if (leaderboardOpen) loadLeaderboard();
  }, [leaderboardOpen, loadLeaderboard]);

  if (categoriesLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Loading…" onBack={goBack} />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Not found" onBack={goBack} />
      </View>
    );
  }

  async function startGame() {
    if (!playerName || starting) return;
    setStarting(true);
    try {
      abandonActiveGame();
      const game = await createGameSession(categoryId, playerName);
      setActiveGame(game);
      navigate({ name: 'game', categoryId });
    } finally {
      setStarting(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={category.name}
        subtitle={category.description}
        onBack={goBack}
        totalRbp={bestScore > 0 ? bestScore : undefined}
      />

      <View style={styles.body}>
        <View style={styles.hero}>
          <View style={styles.closingBadge}>
            <View style={styles.closingDot} />
            <Text style={styles.closingText}>OPEN</Text>
          </View>

          <Text style={styles.heroIcon}>{category.icon}</Text>
          <Text style={styles.heroStat}>
            {ROUNDS_PER_GAME} × {ROUND_TIME_SECONDS}s
          </Text>
          <Text style={styles.heroText}>Probability forecasts per session</Text>
          {bestScore > 0 && (
            <Text style={styles.bestScore}>Your best score: {bestScore}</Text>
          )}
        </View>

        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>Scoring</Text>
          <Text style={styles.rule}>• Submit 0–100% probability the image is fake</Text>
          <Text style={styles.rule}>• Ground truth is Real (0) or Fake (100)</Text>
          <Text style={styles.rule}>• Round score = 70% accuracy + 30% speed</Text>
          <Text style={styles.rule}>• Faster answers earn more speed points</Text>
          <Text style={styles.rule}>• {ROUND_TIME_SECONDS}s countdown — lock before zero</Text>
          <Text style={styles.rule}>• Compare vs Codex, Cursor & Gemini after</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.leaderboardButton} onPress={() => setLeaderboardOpen(true)}>
            <Text style={styles.leaderboardText}>Global Leaderboard</Text>
          </Pressable>

          <Pressable style={styles.startButton} onPress={startGame} disabled={starting}>
            <Text style={styles.startText}>
              {starting ? 'Loading images…' : 'Begin Forecasting →'}
            </Text>
          </Pressable>
        </View>
      </View>

      <LeaderboardSheet
        visible={leaderboardOpen}
        title={category.name}
        subtitle={
          bestScore > 0
            ? `Your best score: ${bestScore}`
            : 'Complete a session to appear on the board'
        }
        data={leaderboardData}
        loading={leaderboardLoading}
        onClose={() => setLeaderboardOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.xxxl,
  },
  hero: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.md,
  },
  closingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.accentMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.lg,
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
  heroIcon: {
    fontSize: 52,
    marginBottom: theme.spacing.md,
  },
  heroStat: {
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
    color: theme.colors.text,
  },
  heroText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: theme.spacing.sm,
  },
  bestScore: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: theme.colors.textSecondary,
  },
  rules: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rulesTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rule: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  leaderboardButton: {
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  leaderboardText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  startButton: {
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    ...theme.shadow.sm,
  },
  startText: {
    color: theme.colors.accentText,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
