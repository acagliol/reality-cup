'use client';

import { useEffect, useMemo, useState } from 'react';
import { LeaderboardList, LeaderboardLoading } from '@/components/LeaderboardList';
import { RoundBreakdown } from '@/components/RoundBreakdown';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { fetchCategoryLeaderboard } from '@/lib/services/leaderboardService';
import { formatRbp } from '@/lib/scoring';
import type { CategoryLeaderboard } from '@/types/game';
import styles from './GameSummaryScreen.module.css';

interface GameSummaryScreenProps {
  gameId: string;
}

export function GameSummaryScreen({ gameId }: GameSummaryScreenProps) {
  const { activeGame, leaveSummary, resetToTabs, gameHistory } = useApp();
  const game = useMemo(
    () =>
      activeGame?.id === gameId
        ? activeGame
        : gameHistory.find((g) => g.id === gameId) ?? null,
    [activeGame, gameHistory, gameId],
  );

  const [leaderboard, setLeaderboard] = useState<CategoryLeaderboard | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    (async () => {
      setLeaderboardLoading(true);
      try {
        const data = await fetchCategoryLeaderboard(
          game.categoryId,
          game.playerName,
          game.totalScore,
        );
        if (!cancelled) setLeaderboard(data);
      } catch (err) {
        console.warn('Leaderboard fetch failed', err);
        if (!cancelled) setLeaderboard(null);
      } finally {
        if (!cancelled) setLeaderboardLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game?.id, game?.categoryId, game?.playerName, game?.totalScore]);

  if (!game) {
    return (
      <div className={styles.container}>
        <ScreenHeader title="Results" onBack={leaveSummary} />
        <div className={styles.loadingWrap}>
          <div className="spinner" />
          <p className={styles.missing}>Loading results…</p>
        </div>
      </div>
    );
  }

  const pinned = leaderboard?.pinnedPlayerEntry;
  const topPlayer = leaderboard?.topEntries.find((e) => e.isCurrentPlayer);
  const playerRank = topPlayer?.rank ?? pinned?.rank;

  return (
    <div className={styles.container}>
      <ScreenHeader
        title="Session complete"
        subtitle={`${game.categoryName}`}
        onBack={leaveSummary}
        totalRbp={Number.isFinite(game.totalScore) ? game.totalScore : undefined}
      />

      <div className={styles.scroll}>
        <div className={styles.statsRow}>
          <div className={`${styles.stat} ${styles.statHighlight}`}>
            <span className={`${styles.statValue} mono`}>
              {Number.isFinite(game.totalScore) ? formatRbp(game.totalScore) : '—'}
            </span>
            <span className={styles.statLabel}>Total RBP</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statValue} mono`}>#{playerRank ?? '—'}</span>
            <span className={styles.statLabel}>Rank</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statValue} mono`}>{game.rounds.length}</span>
            <span className={styles.statLabel}>Images</span>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Forecast breakdown</h2>
        {game.rounds.map((round) => (
          <RoundBreakdown
            key={round.roundContentId}
            round={round}
            categoryId={game.categoryId}
          />
        ))}

        <h2 className={`${styles.sectionTitle} ${styles.sectionSpaced}`}>Global Leaderboard</h2>
        {leaderboardLoading || !leaderboard ? (
          <LeaderboardLoading />
        ) : (
          <LeaderboardList data={leaderboard} compact />
        )}

        <button type="button" className={styles.button} onClick={resetToTabs}>
          Back to Markets →
        </button>
      </div>
    </div>
  );
}
