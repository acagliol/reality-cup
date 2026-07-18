'use client';

import type { CategoryLeaderboard, LeaderboardEntry } from '@/types/game';
import styles from './LeaderboardList.module.css';

interface LeaderboardListProps {
  data: CategoryLeaderboard;
  compact?: boolean;
}

function LeaderboardRow({
  entry,
  compact,
}: {
  entry: LeaderboardEntry;
  compact?: boolean;
}) {
  return (
    <div
      className={`${styles.row} ${compact ? styles.rowCompact : ''} ${entry.isCurrentPlayer ? styles.rowYou : ''}`}
    >
      <span className={`${styles.rank} mono ${entry.rank <= 3 ? styles.rankTop : ''}`}>
        #{entry.rank}
      </span>
      <span className={`${styles.name} ${entry.isCurrentPlayer ? styles.nameYou : ''}`}>
        {entry.playerName}
        {entry.isCurrentPlayer ? ' (you)' : ''}
      </span>
      <span className={`${styles.score} mono`}>
        {Number.isFinite(entry.score) ? entry.score.toFixed(2) : '—'}
      </span>
    </div>
  );
}

export function LeaderboardList({ data, compact }: LeaderboardListProps) {
  const hasEntries = data.topEntries.length > 0 || data.pinnedPlayerEntry !== null;

  if (!hasEntries) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No scores yet</p>
        <p className={styles.emptyText}>Complete a session to appear on the board.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <span className={`${styles.headerCell} ${styles.rankCol}`}>#</span>
        <span className={`${styles.headerCell} ${styles.nameCol}`}>Forecaster</span>
        <span className={`${styles.headerCell} ${styles.scoreCol}`}>Score</span>
      </div>

      {data.topEntries.map((entry) => (
        <LeaderboardRow key={`top-${entry.rank}-${entry.playerName}`} entry={entry} compact={compact} />
      ))}

      {data.pinnedPlayerEntry && (
        <>
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>Your position</span>
            <div className={styles.dividerLine} />
          </div>
          <LeaderboardRow entry={data.pinnedPlayerEntry} compact={compact} />
        </>
      )}
    </div>
  );
}

export function LeaderboardLoading() {
  return (
    <div className={styles.loading}>
      <div className="spinner" />
      <span className={styles.loadingText}>Loading leaderboard…</span>
    </div>
  );
}
