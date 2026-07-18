'use client';

import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { formatRbp } from '@/lib/scoring';
import styles from './ProfileScreen.module.css';

export function ProfileScreen() {
  const { playerName, gameHistory, navigate } = useApp();

  const completedGames = gameHistory;
  const bestScore = completedGames.length
    ? Math.max(...completedGames.map((g) => g.totalScore))
    : 0;

  return (
    <div className={styles.container}>
      <ScreenHeader
        title="Analyst profile"
        subtitle={`Forecasting as ${playerName ?? 'Anonymous'}`}
        totalRbp={completedGames.length > 0 ? bestScore : undefined}
      />

      <button
        type="button"
        className={styles.trophyButton}
        onClick={() => navigate({ name: 'trophy-cabinet' })}
      >
        <span className={styles.trophyIcon}>🏆</span>
        <div className={styles.trophyBody}>
          <span className={styles.trophyTitle}>Trophy cabinet</span>
          <span className={styles.trophySub}>Podium placements & cash prizes</span>
        </div>
        <span className={styles.trophyChevron}>→</span>
      </button>

      <div className={styles.stats}>
        <div className={`${styles.statBox} ${styles.statBoxHighlight}`}>
          <span className={`${styles.statNum} mono`}>
            {completedGames.length > 0 ? formatRbp(bestScore) : '—'}
          </span>
          <span className={styles.statLabel}>Best score</span>
        </div>
        <div className={styles.statBox}>
          <span className={`${styles.statNum} mono`}>{completedGames.length}</span>
          <span className={styles.statLabel}>Sessions</span>
        </div>
      </div>

      <h2 className={styles.section}>Track Your Forecasts</h2>

      <div className={styles.list}>
        {completedGames.length === 0 ? (
          <p className={styles.empty}>No completed sessions yet.</p>
        ) : (
          completedGames.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.card}
              onClick={() => navigate({ name: 'game-history', gameId: item.id })}
            >
              <div className={styles.cardTop}>
                <div className={styles.openBadge}>
                  <span className={styles.openDot} />
                  <span className={styles.openText}>SETTLED</span>
                </div>
                <span className={styles.editLink}>View →</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardTitle}>{item.categoryName}</span>
                <span className={`${styles.score} mono`}>{formatRbp(item.totalScore)}</span>
              </div>
              <span className={styles.cardMeta}>
                {new Date(item.completedAt ?? item.startedAt).toLocaleDateString()} ·{' '}
                {item.rounds.length} images
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
