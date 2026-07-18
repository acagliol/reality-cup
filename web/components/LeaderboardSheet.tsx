'use client';

import { LeaderboardList, LeaderboardLoading } from '@/components/LeaderboardList';
import type { CategoryLeaderboard } from '@/types/game';
import styles from './LeaderboardSheet.module.css';

interface LeaderboardSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  data: CategoryLeaderboard | null;
  loading?: boolean;
  onClose: () => void;
}

export function LeaderboardSheet({
  visible,
  title,
  subtitle,
  data,
  loading,
  onClose,
}: LeaderboardSheetProps) {
  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>Leaderboard · Top 10</span>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            Done
          </button>
        </div>

        <div className={styles.list}>
          {loading || !data ? <LeaderboardLoading /> : <LeaderboardList data={data} />}
        </div>
      </div>
    </div>
  );
}
