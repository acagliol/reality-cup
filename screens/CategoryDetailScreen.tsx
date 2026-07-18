import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { getCategoryById } from '../lib/mock/data';
import { createGameSession } from '../lib/services/gameService';
import { theme } from '../lib/theme';
import { ROUND_TIME_SECONDS, ROUNDS_PER_GAME } from '../types/game';

interface CategoryDetailScreenProps {
  categoryId: string;
}

export function CategoryDetailScreen({ categoryId }: CategoryDetailScreenProps) {
  const { playerName, goBack, navigate, setActiveGame, refreshHistory } = useApp();
  const category = getCategoryById(categoryId);

  if (!category) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Not found" onBack={goBack} />
      </View>
    );
  }

  async function startGame() {
    if (!playerName) return;
    const game = await createGameSession(categoryId, playerName);
    setActiveGame(game);
    await refreshHistory();
    navigate({ name: 'game', categoryId });
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={category.name} subtitle={category.description} onBack={goBack} />

      <View style={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>{category.icon}</Text>
          <Text style={styles.heroText}>
            {ROUNDS_PER_GAME} rounds · {ROUND_TIME_SECONDS}s per round · Real (0) to Fake (100)
          </Text>
        </View>

        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>How it works</Text>
          <Text style={styles.rule}>• You have {ROUND_TIME_SECONDS} seconds per round — timer counts down</Text>
          <Text style={styles.rule}>• Slide toward Real or Fake, release to submit</Text>
          <Text style={styles.rule}>• Score = 70% accuracy + 30% speed bonus</Text>
          <Text style={styles.rule}>• Review all round stats at the end</Text>
        </View>

        <Pressable style={styles.startButton} onPress={startGame}>
          <Text style={styles.startText}>Start Game</Text>
        </Pressable>
      </View>
    </View>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.xxxl,
  },
  hero: {
    backgroundColor: c.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    ...theme.shadow.sm,
  },
  heroIcon: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  heroText: {
    color: c.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  rules: {
    backgroundColor: c.surfaceAlt,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
  },
  rulesTitle: {
    color: c.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  rule: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: c.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  startText: {
    color: c.white,
    fontSize: 18,
    fontWeight: '800',
  },
});
