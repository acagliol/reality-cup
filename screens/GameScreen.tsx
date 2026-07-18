import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameSlider } from '../components/GameSlider';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { completeGame, submitRoundAnswer } from '../lib/services/gameService';
import { formatCountdown } from '../lib/scoring';
import { theme } from '../lib/theme';
import { ROUND_TIME_MS } from '../types/game';

export function GameScreen() {
  const { activeGame, setActiveGame, navigate, goBack, refreshHistory } = useApp();
  const [sliderValue, setSliderValue] = useState(50);
  const [remainingMs, setRemainingMs] = useState(ROUND_TIME_MS);
  const [submitting, setSubmitting] = useState(false);

  const sliderRef = useRef(50);
  const submittingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundStartRef = useRef(Date.now());

  const currentIndex =
    activeGame?.rounds.findIndex((r) => !r.playerAnswer) ?? -1;
  const round = currentIndex >= 0 ? activeGame?.rounds[currentIndex] : undefined;
  const isUrgent = remainingMs <= 3000;

  const submitAnswer = useCallback(
    async (value: number) => {
      if (submittingRef.current || !activeGame || currentIndex < 0) return;
      submittingRef.current = true;
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const responseTimeMs = Math.min(Date.now() - roundStartRef.current, ROUND_TIME_MS);
      const updated = await submitRoundAnswer(activeGame, currentIndex, value, responseTimeMs);
      setActiveGame(updated);

      const isLastRound = currentIndex >= updated.rounds.length - 1;
      if (isLastRound) {
        const completed = await completeGame(updated);
        setActiveGame(completed);
        await refreshHistory();
        navigate({ name: 'game-summary', gameId: completed.id });
      } else {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [activeGame, currentIndex, navigate, refreshHistory, setActiveGame],
  );

  useEffect(() => {
    if (currentIndex < 0) return;

    roundStartRef.current = Date.now();
    sliderRef.current = 50;
    setSliderValue(50);
    setRemainingMs(ROUND_TIME_MS);
    submittingRef.current = false;
    setSubmitting(false);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - roundStartRef.current;
      const left = Math.max(0, ROUND_TIME_MS - elapsed);
      setRemainingMs(left);

      if (left <= 0 && !submittingRef.current) {
        submitAnswer(sliderRef.current);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, submitAnswer]);

  if (!activeGame || !round || currentIndex < 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Game" onBack={goBack} />
        <Text style={styles.error}>No active round.</Text>
      </View>
    );
  }

  function handleSliderChange(value: number) {
    sliderRef.current = value;
    setSliderValue(value);
  }

  function handleRelease(value: number) {
    submitAnswer(value);
  }

  const progress = remainingMs / ROUND_TIME_MS;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`Round ${round.roundNumber} / ${activeGame.rounds.length}`}
        subtitle={activeGame.categoryName}
        onBack={goBack}
      />

      <View style={styles.timerCard}>
        <View style={styles.timerTop}>
          <Text style={styles.timerLabel}>Time remaining</Text>
          <Text style={[styles.timerValue, isUrgent && styles.timerUrgent]}>
            {formatCountdown(remainingMs)}s
          </Text>
        </View>
        <View style={styles.timerTrack}>
          <View
            style={[
              styles.timerFill,
              { width: `${progress * 100}%` },
              isUrgent && styles.timerFillUrgent,
            ]}
          />
        </View>
      </View>

      <Image source={{ uri: round.imageUrl }} style={styles.image} contentFit="cover" />

      <View style={styles.sliderSection}>
        <Text style={styles.prompt}>How real does this look?</Text>
        <GameSlider
          value={sliderValue}
          onChange={handleSliderChange}
          onRelease={handleRelease}
          disabled={submitting}
        />
        <Text style={styles.hint}>Release the slider to submit · faster answers earn more points</Text>
      </View>

      {submitting && (
        <View style={styles.submittingOverlay}>
          <Text style={styles.submittingText}>Submitting…</Text>
        </View>
      )}
    </View>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  timerCard: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    backgroundColor: c.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: c.border,
    ...theme.shadow.sm,
  },
  timerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  timerLabel: {
    color: c.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  timerValue: {
    color: c.accent,
    fontWeight: '800',
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {
    color: c.danger,
  },
  timerTrack: {
    height: 6,
    backgroundColor: c.surfaceAlt,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: c.accent,
    borderRadius: theme.radius.full,
  },
  timerFillUrgent: {
    backgroundColor: c.danger,
  },
  image: {
    marginHorizontal: theme.spacing.xl,
    height: 260,
    borderRadius: theme.radius.lg,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
  },
  sliderSection: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  prompt: {
    color: c.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    color: c.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  error: {
    color: c.danger,
    padding: theme.spacing.xl,
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submittingText: {
    color: c.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
