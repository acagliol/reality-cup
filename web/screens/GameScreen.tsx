'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ProbabilitySlider } from '@/components/ProbabilitySlider';
import { useCategoryTheme } from '@/context/CategoryThemeContext';
import { useApp } from '@/context/AppContext';
import { completeGame, submitRoundAnswer } from '@/lib/services/gameService';
import type { GameSession } from '@/types/game';
import { ROUND_TIME_MS, ROUND_TIME_SECONDS } from '@/types/game';
import styles from './GameScreen.module.css';

export function GameScreen() {
  const { activeGame, setActiveGame, finishGame, refreshHistory, getCategoryById } = useApp();
  const cat = useCategoryTheme();
  const category = activeGame ? getCategoryById(activeGame.categoryId) : undefined;
  const [sliderValue, setSliderValue] = useState(50);
  const [remainingMs, setRemainingMs] = useState(ROUND_TIME_MS);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [imageRetry, setImageRetry] = useState(0);

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
  const roundImageUri =
    round && imageRetry > 0
      ? `${round.imageUrl}${round.imageUrl.includes('?') ? '&' : '?'}retry=${imageRetry}&t=${Date.now()}`
      : round?.imageUrl;

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
      setIsSubmitting(true);
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
        setIsSubmitting(false);
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

  // Block browser back during session
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Reset round UI when advancing to the next question
  useEffect(() => {
    if (!activeGame || currentIndex < 0 || activeGame.status === 'completed') return;

    submittingRef.current = false;
    setIsSubmitting(false);
    timerFiredRef.current = false;
    setImageReady(false);
    setImageRetry(0);
    sliderRef.current = 50;
    setSliderValue(50);
    setRemainingMs(ROUND_TIME_MS);
    setSubmitError(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [activeGame?.id, activeGame?.status, currentIndex, round?.roundContentId]);

  // Start the countdown only after the current round image has loaded
  useEffect(() => {
    if (!activeGame || currentIndex < 0 || activeGame.status === 'completed' || !imageReady) {
      return;
    }

    roundStartRef.current = Date.now();
    setRemainingMs(ROUND_TIME_MS);
    timerFiredRef.current = false;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (submittingRef.current) return;

      const elapsed = Date.now() - roundStartRef.current;
      const left = Math.max(0, ROUND_TIME_MS - elapsed);
      setRemainingMs(left);

      if (left <= 0 && !timerFiredRef.current) {
        timerFiredRef.current = true;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRemainingMs(0);
        const value = sliderRef.current;
        setSliderValue(value);
        void submitAnswerRef.current(value);
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeGame?.id, activeGame?.status, currentIndex, round?.roundContentId, imageReady]);

  if (activeGame?.status === 'completed') {
    return null;
  }

  if (!activeGame || !round) {
    return (
      <div className={styles.container}>
        <div className={styles.centered}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  function handleConfirm() {
    if (isSubmitting) return;
    timerFiredRef.current = true;
    void submitAnswer(sliderValue);
  }

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <p className={styles.screenTitle}>In Game</p>

        <div className={styles.questionHeader}>
          <span className={styles.questionLabel}>QUESTION</span>
          <span className={`${styles.questionCount} mono`}>
            {round.roundNumber} / {totalRounds}
          </span>
        </div>
        <div className={styles.progressBars}>
          {activeGame.rounds.map((r, i) => (
            <div
              key={r.roundContentId}
              className={`${styles.progressBar} ${
                i < round.roundNumber - 1 ? styles.progressBarDone : ''
              } ${i === round.roundNumber - 1 ? styles.progressBarActive : ''}`}
            />
          ))}
        </div>

        <div className={styles.statusRow}>
          <div className={styles.categoryBadge}>
            {category?.icon ? (
              <span className={styles.categoryIcon}>{category.icon}</span>
            ) : null}
            <div className={styles.categoryTextWrap}>
              <span className={styles.categoryName}>{activeGame.categoryName}</span>
              <span className={styles.categoryMeta}>
                {cat.name} · {ROUND_TIME_SECONDS}s per round
              </span>
            </div>
          </div>
          <CountdownTimer remainingMs={remainingMs} variant="clock" />
        </div>
      </div>

      <div className={styles.imageSection}>
        <div className={styles.imageFrame}>
          {!imageReady && (
            <div className={styles.imageLoading}>
              <div className="spinner" />
              <span className={styles.imageLoadingText}>Loading image…</span>
            </div>
          )}
          {roundImageUri ? (
            <img
              key={`${round.roundContentId}-${imageRetry}`}
              src={roundImageUri}
              alt=""
              className={styles.image}
              onLoad={() => setImageReady(true)}
              onError={() => {
                if (imageRetry < 2) {
                  setImageReady(false);
                  setImageRetry((retry) => retry + 1);
                } else {
                  setSubmitError('Image failed to load — timer started anyway.');
                  setImageReady(true);
                }
              }}
            />
          ) : null}
        </div>
      </div>

      <div className={styles.bottomPanel}>
        <div className={styles.questionRow}>
          <p className={styles.questionText}>
            What is the probability this image is AI-generated or manipulated?
          </p>
          <div className={styles.oddsBox}>
            <span className={styles.oddsLabel}>YOUR ODDS</span>
            <span className={`${styles.oddsValue} mono`}>{sliderValue}%</span>
          </div>
        </div>

        <ProbabilitySlider
          key={round.roundContentId}
          value={sliderValue}
          onChange={(v) => {
            if (isSubmitting || !imageReady) return;
            sliderRef.current = v;
            setSliderValue(v);
          }}
          disabled={isSubmitting || !imageReady}
          showOddsBox={false}
        />

        <button
          type="button"
          className={`${styles.confirmBtn} ${
            isSubmitting || !imageReady ? styles.confirmBtnDisabled : ''
          }`}
          onClick={handleConfirm}
          disabled={isSubmitting || !imageReady}
        >
          <span className={styles.confirmText}>Confirm Probability</span>
          <span className={styles.confirmArrow}>→</span>
        </button>

        {submitError ? <p className={styles.error}>{submitError}</p> : null}

        <p className={styles.timerHint}>
          {imageReady
            ? `Timer auto-submits at 0s — ${totalRounds} questions total.`
            : 'Timer starts once the image finishes loading.'}
        </p>
      </div>
    </div>
  );
}
