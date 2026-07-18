'use client';

import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import styles from './GamesScreen.module.css';

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

      <h2 className={styles.sectionTitle}>Track Your Forecasts</h2>

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
      ) : (
        <div className={styles.list}>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.card}
              onClick={() => navigate({ name: 'category-detail', categoryId: item.id })}
            >
              <div className={styles.cardTop}>
                <div className={styles.closingBadge}>
                  <span className={styles.closingDot} />
                  <span className={styles.closingText}>OPEN</span>
                </div>
                <span className={styles.editLink}>Play →</span>
              </div>

              <div className={styles.cardMatch}>
                <div className={styles.side}>
                  <span className={styles.sideIcon}>{item.icon}</span>
                  <span className={styles.sideLabel}>Real</span>
                </div>
                <div className={styles.cardCenter}>
                  <span className={styles.cardTitle}>{item.name}</span>
                  <span className={styles.cardDesc}>{item.description}</span>
                </div>
                <div className={`${styles.side} ${styles.sideRight}`}>
                  <span className={styles.sideIcon}>🤖</span>
                  <span className={styles.sideLabel}>Fake</span>
                </div>
              </div>

              <span className={styles.cardMeta}>10 images · 10s window · Brier + RBP</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
