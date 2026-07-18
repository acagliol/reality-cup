import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CountdownTimer } from '../components/CountdownTimer';
import { ProbabilitySlider } from '../components/ProbabilitySlider';
import { useCategoryTheme } from '../context/CategoryThemeContext';
import { useApp } from '../context/AppContext';
import { completeGame, submitRoundAnswer } from '../lib/services/gameService';
import { getCategoryById } from '../lib/mock/data';
import { theme } from '../lib/theme';
import type { GameSession } from '../types/game';
import { ROUND_TIME_MS, ROUND_TIME_SECONDS } from '../types/game';

export function GameScreen() {
  const { activeGame, setActiveGame, finishGame, refreshHistory } = useApp();
  const cat = useCategoryTheme();
  const category = activeGame ? getCategoryById(activeGame.categoryId) : undefined;
  const [sliderValue, setSliderValue] = useState(50);
  const [remainingMs, setRemainingMs] = useState(ROUND_TIME_MS);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sliderRef = useRef(50);
  const submittingRef = useRef(false);
  const timerFiredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundStartRef = useRef(Date.now());
  const activeGameRef = useRef(activeGame);

  useEffect(() => {
    activeGameRef.current = activeGame;
  }, [activeGame]);

  const currentIndex =
    activeGame?.rounds.findIndex((r) => !r.playerAnswer) ?? -1;
  const round = currentIndex >= 0 ? activeGame?.rounds[currentIndex] : undefined;
  const totalRounds = activeGame?.rounds.length ?? 0;

  const submitAnswer = useCallback(
    async (value: number) => {
      if (submittingRef.current) return;

      const game = activeGameRef.current;
      if (!game || game.status === 'completed') return;

      const idx = game.rounds.findIndex((r) => !r.playerAnswer);
      if (idx < 0) return;

      const currentRound = game.rounds[idx];
      if (!currentRound) return;

      submittingRef.current = true;
      setSubmitError(null);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const clamped = Math.min(99, Math.max(1, Math.round(value)));
      const responseTimeMs = Math.min(Date.now() - roundStartRef.current, ROUND_TIME_MS);

      try {
        const updated = submitRoundAnswer(game, idx, clamped, responseTimeMs);
        const isLastRound = idx >= updated.rounds.length - 1;

        if (isLastRound) {
          const completed: GameSession = {
            ...updated,
            status: 'completed',
            completedAt: new Date().toISOString(),
          };

          activeGameRef.current = completed;
          setActiveGame(completed);
          finishGame(completed.id);

          void completeGame(completed)
            .then(() => refreshHistory())
            .catch((err) => console.error('Game persist failed', err));

          return;
        }

        activeGameRef.current = updated;
        setActiveGame(updated);
      } catch (err) {
        console.error('submitAnswer failed', err);
        submittingRef.current = false;
        timerFiredRef.current = false;
        setSubmitError('Could not save your forecast. Try again.');
      }
    },
    [finishGame, refreshHistory, setActiveGame],
  );

  const submitAnswerRef = useRef(submitAnswer);
  useEffect(() => {
    submitAnswerRef.current = submitAnswer;
  }, [submitAnswer]);

  // Block Android hardware back during session
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Start / reset 10s timer whenever we land on a new open round
  useEffect(() => {
    if (!activeGame || currentIndex < 0 || activeGame.status === 'completed') return;

    submittingRef.current = false;
    timerFiredRef.current = false;
    roundStartRef.current = Date.now();
    sliderRef.current = 50;
    setSliderValue(50);
    setRemainingMs(ROUND_TIME_MS);
    setSubmitError(null);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (submittingRef.current) return;

      const elapsed = Date.now() - roundStartRef.current;
      const left = Math.max(0, ROUND_TIME_MS - elapsed);
      setRemainingMs(left);

      if (left <= 0 && !timerFiredRef.current) {
        timerFiredRef.current = true;
        void submitAnswerRef.current(sliderRef.current);
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeGame?.id, activeGame?.status, currentIndex]);

  if (activeGame?.status === 'completed') {
    return null;
  }

  if (!activeGame || !round) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.text} size="large" />
        </View>
      </View>
    );
  }

  function handleConfirm() {
    if (submittingRef.current) return;
    timerFiredRef.current = true;
    void submitAnswer(sliderValue);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>In Game</Text>

        <View style={styles.questionHeader}>
          <Text style={styles.questionLabel}>QUESTION</Text>
          <Text style={styles.questionCount}>
            {round.roundNumber} / {totalRounds}
          </Text>
        </View>
        <View style={styles.progressBars}>
          {activeGame.rounds.map((r, i) => (
            <View
              key={r.roundContentId}
              style={[
                styles.progressBar,
                i < round.roundNumber - 1 && styles.progressBarDone,
                i === round.roundNumber - 1 && styles.progressBarActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.statusRow}>
          <View style={styles.categoryBadge}>
            {category?.icon ? (
              <Text style={styles.categoryIcon}>{category.icon}</Text>
            ) : null}
            <View style={styles.categoryTextWrap}>
              <Text style={styles.categoryName} numberOfLines={1}>
                {activeGame.categoryName}
              </Text>
              <Text style={styles.categoryMeta}>
                {cat.name} · {ROUND_TIME_SECONDS}s per round
              </Text>
            </View>
          </View>
          <CountdownTimer remainingMs={remainingMs} variant="clock" />
        </View>

        <View style={styles.imageFrame}>
          <Image source={{ uri: round.imageUrl }} style={styles.image} contentFit="cover" />
        </View>

        <View style={styles.questionBlock}>
          <View style={styles.questionRow}>
            <Text style={styles.questionText}>
              What is the probability this image is AI-generated or manipulated?
            </Text>
            <View style={styles.oddsBox}>
              <Text style={styles.oddsLabel}>YOUR ODDS</Text>
              <Text style={styles.oddsValue}>{sliderValue}%</Text>
            </View>
          </View>
          <ProbabilitySlider
            value={sliderValue}
            onChange={(v) => {
              if (submittingRef.current) return;
              sliderRef.current = v;
              setSliderValue(v);
            }}
            disabled={submittingRef.current}
            showOddsBox={false}
          />
        </View>

        <Pressable
          style={[styles.confirmBtn, submittingRef.current && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submittingRef.current}
        >
          <Text style={styles.confirmText}>Confirm Probability</Text>
          <Text style={styles.confirmArrow}>→</Text>
        </Pressable>

        {submitError && <Text style={styles.error}>{submitError}</Text>}

        <Text style={styles.timerHint}>
          Timer auto-submits your current odds at 0s — finish all {totalRounds} questions.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scroll: {
    paddingTop: 56,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  screenTitle: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  questionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  progressBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: theme.spacing.xl,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  progressBarDone: {
    backgroundColor: theme.colors.accent,
  },
  progressBarActive: {
    backgroundColor: theme.colors.accent,
    height: 5,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  categoryBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accentMuted,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  categoryMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  imageFrame: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  image: {
    height: 220,
    backgroundColor: theme.colors.surfaceAlt,
  },
  questionBlock: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  questionText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 28,
  },
  oddsBox: {
    backgroundColor: theme.colors.oddsBox,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 96,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  oddsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.accentText,
    letterSpacing: 0.8,
  },
  oddsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.accentText,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.accentText,
  },
  confirmArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.accentText,
  },
  timerHint: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  error: {
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },
});
