'use client';

import { useCallback, useEffect, useState } from 'react';
import { LeaderboardSheet } from '@/components/LeaderboardSheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { createGameSession, getBestScoreForCategory } from '@/lib/services/gameService';
import { fetchCategoryLeaderboard } from '@/lib/services/leaderboardService';
import type { CategoryLeaderboard } from '@/types/game';
import { ROUND_TIME_SECONDS, ROUNDS_PER_GAME } from '@/types/game';
import styles from './CategoryDetailScreen.module.css';

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
      <div className={styles.container}>
        <ScreenHeader title="Loading…" onBack={goBack} />
      </div>
    );
  }

  if (!category) {
    return (
      <div className={styles.container}>
        <ScreenHeader title="Not found" onBack={goBack} />
      </div>
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
    <div className={styles.container}>
      <ScreenHeader
        title={category.name}
        subtitle={category.description}
        onBack={goBack}
        totalRbp={bestScore > 0 ? bestScore : undefined}
      />

      <div className={styles.body}>
        <div className={styles.hero}>
          <div className={styles.closingBadge}>
            <span className={styles.closingDot} />
            <span className={styles.closingText}>OPEN</span>
          </div>

          <span className={styles.heroIcon}>{category.icon}</span>
          <span className={`${styles.heroStat} mono`}>
            {ROUNDS_PER_GAME} × {ROUND_TIME_SECONDS}s
          </span>
          <span className={styles.heroText}>Probability forecasts per session</span>
          {bestScore > 0 && (
            <span className={`${styles.bestScore} mono`}>Your best score: {bestScore}</span>
          )}
        </div>

        <div className={styles.rules}>
          <span className={styles.rulesTitle}>Scoring</span>
          <span className={styles.rule}>• Submit 0–100% probability the image is fake</span>
          <span className={styles.rule}>• Ground truth is Real (0) or Fake (100)</span>
          <span className={styles.rule}>• Round score = 70% accuracy + 30% speed</span>
          <span className={styles.rule}>• Faster answers earn more speed points</span>
          <span className={styles.rule}>• {ROUND_TIME_SECONDS}s countdown — lock before zero</span>
          <span className={styles.rule}>• Compare vs Codex, Cursor & Gemini after</span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.leaderboardButton}
            onClick={() => setLeaderboardOpen(true)}
          >
            Global Leaderboard
          </button>

          <button
            type="button"
            className={styles.startButton}
            onClick={startGame}
            disabled={starting}
          >
            {starting ? 'Loading images…' : 'Begin Forecasting →'}
          </button>
        </div>
      </div>

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
    </div>
  );
}
