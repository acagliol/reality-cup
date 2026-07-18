'use client';

import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import styles from './GamesScreen.module.css';

/** Soft per-category accent tints so each market row reads distinctly. */
const CATEGORY_ACCENTS: Record<string, { soft: string; dot: string }> = {
  'cat-world-cup': { soft: '#DCFCE7', dot: '#16A34A' },
  'cat-lebron-decision': { soft: '#F3E8FF', dot: '#7C3AED' },
  'cat-brain-rot': { soft: '#FCE7F3', dot: '#DB2777' },
  'cat-nyc-core': { soft: '#DBEAFE', dot: '#2563EB' },
  'cat-food': { soft: '#FFEDD5', dot: '#EA580C' },
  'cat-random': { soft: '#F7FFDE', dot: '#1a1919' },
};

function categoryAccent(id: string): { soft: string; dot: string } {
  return CATEGORY_ACCENTS[id] ?? { soft: '#F4F4F5', dot: '#1a1919' };
}

export function GamesScreen() {
  const {
    playerName,
    navigate,
    gameHistory,
    categories,
    categoriesLoading,
    categoriesError,
    refreshCategories,
  } = useApp();

  const bestScore = gameHistory.length
    ? Math.max(...gameHistory.map((g) => g.totalScore))
    : 0;
  const streak = gameHistory.length;

  return (
    <div className={styles.container}>
      <ScreenHeader
        title={`Hey, ${playerName ?? 'Analyst'}!`}
        subtitle={
          streak > 0
            ? `${streak} session${streak === 1 ? '' : 's'} forecasted`
            : 'Price the probability. Beat the machines.'
        }
        totalRbp={bestScore > 0 ? bestScore : undefined}
      />

      {!categoriesLoading && !categoriesError && (
        <div className={styles.statStrip}>
          <div className={styles.stat}>
            <span className={`${styles.statValue} mono`}>
              {bestScore > 0 ? bestScore.toFixed(0) : '—'}
            </span>
            <span className={styles.statLabel}>Best Score</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={`${styles.statValue} mono`}>{streak}</span>
            <span className={styles.statLabel}>Sessions</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={`${styles.statValue} mono`}>{categories.length || '—'}</span>
            <span className={styles.statLabel}>Markets</span>
          </div>
        </div>
      )}

      <div className={styles.sectionRow}>
        <h2 className={styles.sectionTitle}>Open Markets</h2>
        <span className={styles.sectionHint}>Tap to forecast</span>
      </div>

      {categoriesLoading ? (
        <div className={styles.center}>
          <div className="spinner" />
        </div>
      ) : categoriesError ? (
        <div className={styles.center}>
          <p className={styles.errorTitle}>Could not load markets</p>
          <p className={styles.errorText}>{categoriesError}</p>
          <button type="button" className={styles.retryButton} onClick={refreshCategories}>
            Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className={styles.center}>
          <p className={styles.errorTitle}>No markets available</p>
          <p className={styles.errorText}>
            Categories are missing in Supabase. Run npm run pools:seed:descriptions.
          </p>
          <button type="button" className={styles.retryButton} onClick={refreshCategories}>
            Retry
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {categories.map((item) => {
            const accent = categoryAccent(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={styles.card}
                onClick={() => navigate({ name: 'category-detail', categoryId: item.id })}
              >
                <div className={styles.cardMain}>
                  <span className={styles.iconTile} style={{ background: accent.soft }}>
                    {item.icon}
                  </span>
                  <span className={styles.cardText}>
                    <span className={styles.cardTitle}>{item.name}</span>
                    <span className={styles.cardDesc}>{item.description}</span>
                  </span>
                  <span className={styles.statusPill}>
                    <span className={styles.statusDot} style={{ background: accent.dot }} />
                    OPEN
                  </span>
                </div>

                <span className={styles.divider} />

                <div className={styles.cardFooter}>
                  <span className={`${styles.meta} mono`}>10 rounds · 10s · accuracy + speed</span>
                  <span className={styles.playPill}>Play →</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
