import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CountdownTimer } from '../components/CountdownTimer';
import { ProbabilitySlider } from '../components/ProbabilitySlider';
import { ScreenHeader } from '../components/ScreenHeader';
import { useCategoryTheme } from '../context/CategoryThemeContext';
import { useApp } from '../context/AppContext';
import { completeGame, submitRoundAnswer } from '../lib/services/gameService';
import { theme } from '../lib/theme';
import { ROUND_TIME_MS } from '../types/game';

type Phase = 'playing' | 'locking' | 'submitting';

export function GameScreen() {
  const cat = useCategoryTheme();
  const { activeGame, setActiveGame, navigate, goBack, refreshHistory, abandonActiveGame } =
    useApp();
  const [sliderValue, setSliderValue] = useState(50);
  const [remainingMs, setRemainingMs] = useState(ROUND_TIME_MS);
  const [phase, setPhase] = useState<Phase>('playing');
  const [lockedRound, setLockedRound] = useState<number | null>(null);

  const sliderRef = useRef(50);
  const phaseRef = useRef<Phase>('playing');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundStartRef = useRef(Date.now());

  const currentIndex =
    activeGame?.rounds.findIndex((r) => !r.playerAnswer) ?? -1;
  const round = currentIndex >= 0 ? activeGame?.rounds[currentIndex] : undefined;

  const submitAnswer = useCallback(
    async (value: number) => {
      if (phaseRef.current !== 'playing' || !activeGame || currentIndex < 0 || !round) return;

      phaseRef.current = 'locking';
      setPhase('locking');
      setLockedRound(round.roundNumber);
      if (timerRef.current) clearInterval(timerRef.current);

      const responseTimeMs = Math.min(Date.now() - roundStartRef.current, ROUND_TIME_MS);
      const updated = submitRoundAnswer(activeGame, currentIndex, value, responseTimeMs);

      const isLastRound = currentIndex >= updated.rounds.length - 1;
      if (isLastRound) {
        phaseRef.current = 'submitting';
        setPhase('submitting');
        const completed = await completeGame(updated);
        setActiveGame(completed);
        await refreshHistory();
        navigate({ name: 'game-summary', gameId: completed.id });
        return;
      }

      setActiveGame(updated);
      await new Promise((r) => setTimeout(r, 450));
      phaseRef.current = 'playing';
      setPhase('playing');
      setLockedRound(null);
    },
    [activeGame, currentIndex, navigate, refreshHistory, round, setActiveGame],
  );

  useEffect(() => {
    if (currentIndex < 0 || phase !== 'playing') return;

    roundStartRef.current = Date.now();
    sliderRef.current = 50;
    setSliderValue(50);
    setRemainingMs(ROUND_TIME_MS);

    timerRef.current = setInterval(() => {
      if (phaseRef.current !== 'playing') return;
      const elapsed = Date.now() - roundStartRef.current;
      const left = Math.max(0, ROUND_TIME_MS - elapsed);
      setRemainingMs(left);
      if (left <= 0) submitAnswer(sliderRef.current);
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, phase, submitAnswer]);

  if (!activeGame || !round) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Forecast" onBack={() => { abandonActiveGame(); goBack(); }} />
        <Text style={styles.error}>No active round.</Text>
      </View>
    );
  }

  const answeredCount = activeGame.rounds.filter((r) => r.playerAnswer).length;

  return (
    <View style={[styles.container, { backgroundColor: cat.heroBg }]}>
      <ScreenHeader
        title={`Forecast ${round.roundNumber} / ${activeGame.rounds.length}`}
        subtitle={activeGame.categoryName}
        onBack={() => {
          abandonActiveGame();
          goBack();
        }}
        accentColor={cat.primary}
      />

      <View style={styles.progressDots}>
        {activeGame.rounds.map((r, i) => (
          <View
            key={r.roundContentId}
            style={[
              styles.dot,
              i < answeredCount && { backgroundColor: cat.primary },
              i === currentIndex && phase === 'playing' && styles.dotActive,
              i === currentIndex && phase === 'playing' && { borderColor: cat.primary },
            ]}
          />
        ))}
      </View>

      {phase === 'playing' && (
        <>
          <CountdownTimer remainingMs={remainingMs} />

          <View style={[styles.imageFrame, { borderColor: cat.primaryMuted }]}>
            <Image source={{ uri: round.imageUrl }} style={styles.image} contentFit="cover" />
          </View>

          <View style={styles.sliderSection}>
            <Text style={styles.prompt}>Assign probability this image is AI-generated</Text>
            <ProbabilitySlider
              value={sliderValue}
              onChange={(v) => {
                sliderRef.current = v;
                setSliderValue(v);
              }}
              onRelease={submitAnswer}
            />
          </View>
        </>
      )}

      {(phase === 'locking' || phase === 'submitting') && (
        <View style={styles.lockOverlay}>
          <View style={[styles.lockCard, { backgroundColor: cat.primaryMuted }]}>
            {phase === 'submitting' ? (
              <>
                <ActivityIndicator color={cat.primary} size="large" />
                <Text style={[styles.lockTitle, { color: cat.primary }]}>Calculating results…</Text>
              </>
            ) : (
              <>
                <Text style={[styles.lockIcon, { color: cat.primary }]}>✓</Text>
                <Text style={[styles.lockTitle, { color: cat.primary }]}>
                  Round {lockedRound} locked in
                </Text>
                <Text style={styles.lockSub}>Results after all {activeGame.rounds.length} forecasts</Text>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
  },
  imageFrame: {
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    ...theme.shadow.md,
  },
  image: {
    height: 240,
    backgroundColor: theme.colors.surfaceAlt,
  },
  sliderSection: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  prompt: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  error: {
    color: theme.colors.danger,
    padding: theme.spacing.xl,
  },
  lockOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  lockCard: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    minWidth: 260,
    ...theme.shadow.md,
  },
  lockIcon: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  lockSub: {
    marginTop: theme.spacing.sm,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
