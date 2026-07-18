import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LeaderboardSheet } from '../components/LeaderboardSheet';
import { ScreenHeader } from '../components/ScreenHeader';
import { useCategoryTheme } from '../context/CategoryThemeContext';
import { useApp } from '../context/AppContext';
import { getCategoryById } from '../lib/mock/data';
import { createGameSession, getBestScoreForCategory } from '../lib/services/gameService';
import { fetchCategoryLeaderboard } from '../lib/services/leaderboardService';
import { theme } from '../lib/theme';
import type { CategoryLeaderboard } from '../types/game';
import { ACCURACY_WEIGHT, MAX_GAME_SCORE, ROUND_TIME_SECONDS, ROUNDS_PER_GAME, SPEED_WEIGHT } from '../types/game';

interface CategoryDetailScreenProps {
  categoryId: string;
}

export function CategoryDetailScreen({ categoryId }: CategoryDetailScreenProps) {
  const cat = useCategoryTheme();
  const { playerName, goBack, navigate, setActiveGame, abandonActiveGame, gameHistory } =
    useApp();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<CategoryLeaderboard | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
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

  if (!category) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Not found" onBack={goBack} />
      </View>
    );
  }

  function startGame() {
    if (!playerName) return;
    abandonActiveGame();
    const game = createGameSession(categoryId, playerName);
    setActiveGame(game);
    navigate({ name: 'game', categoryId });
  }

  return (
    <View style={[styles.container, { backgroundColor: cat.heroBg }]}>
      <ScreenHeader
        title={category.name}
        subtitle={category.description}
        onBack={goBack}
        accentColor={cat.primary}
      />

      <View style={styles.body}>
        <View style={[styles.hero, { borderColor: cat.primaryMuted }]}>
          <View style={[styles.iconCircle, { backgroundColor: cat.primaryMuted }]}>
            <Text style={styles.heroIcon}>{category.icon}</Text>
          </View>
          <Text style={[styles.heroStat, { color: cat.primary }]}>
            {ROUNDS_PER_GAME} × {ROUND_TIME_SECONDS}s
          </Text>
          <Text style={styles.heroText}>Probability forecasts per session</Text>
          {bestScore > 0 && (
            <Text style={[styles.bestScore, { color: cat.primary }]}>
              Your best: {bestScore} pts
            </Text>
          )}
        </View>

        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>Scoring model</Text>
          <Text style={styles.rule}>• {ROUND_TIME_SECONDS}s countdown — lock before zero</Text>
          <Text style={styles.rule}>
            • {Math.round(ACCURACY_WEIGHT * 100)}% calibration (100 − |your guess − truth|)
          </Text>
          <Text style={styles.rule}>
            • {Math.round(SPEED_WEIGHT * 100)}% speed bonus from ms remaining
          </Text>
          <Text style={styles.rule}>• Max {MAX_GAME_SCORE} pts per session ({ROUNDS_PER_GAME} rounds)</Text>
          <Text style={styles.rule}>• Compare vs Codex, Cursor & Gemini sponsor models after</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.leaderboardButton, { borderColor: cat.primary }]}
            onPress={() => setLeaderboardOpen(true)}
          >
            <Text style={[styles.leaderboardText, { color: cat.primary }]}>Leaderboard</Text>
          </Pressable>

          <Pressable
            style={[styles.startButton, { backgroundColor: cat.primary }]}
            onPress={startGame}
          >
            <Text style={styles.startText}>Begin forecasting</Text>
          </Pressable>
        </View>
      </View>

      <LeaderboardSheet
        visible={leaderboardOpen}
        title={category.name}
        subtitle={
          bestScore > 0
            ? `Your best score: ${bestScore} pts`
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
    ...theme.shadow.md,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  heroIcon: {
    fontSize: 44,
  },
  heroStat: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
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
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
  },
  leaderboardText: {
    fontSize: 16,
    fontWeight: '800',
  },
  startButton: {
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  startText: {
    color: theme.colors.textInverse,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
