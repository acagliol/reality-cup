'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { fetchPlatformInsights } from '@/lib/services/insightsService';
import type { InsightPhoto, PlatformInsights } from '@/types/insights';
import styles from './InsightsScreen.module.css';

function PhotoStrip({
  title,
  subtitle,
  photos,
}: {
  title: string;
  subtitle: string;
  photos: InsightPhoto[];
}) {
  if (photos.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionSub}>{subtitle}</p>
      <div className={styles.photoStrip}>
        {photos.map((photo, index) => (
          <article key={photo.roundContentId} className={styles.photoCard}>
            <span className={styles.rankBadge}>#{index + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.imageUrl} alt="" className={styles.photoImage} />
            <div className={styles.photoMeta}>
              <span className={styles.photoCategory}>{photo.categoryName}</span>
              <span className={styles.photoStatLabel}>{photo.statLabel}</span>
              <span className={styles.photoStatValue}>{photo.statValue}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function InsightsScreen() {
  const [insights, setInsights] = useState<PlatformInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInsights(await fetchPlatformInsights());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className={styles.container}>
        <ScreenHeader title="Insights" subtitle="Public forecast data and photo analytics" />
        <div className={styles.center}>Loading insights…</div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className={styles.container}>
        <ScreenHeader title="Insights" subtitle="Public forecast data and photo analytics" />
        <div className={styles.center}>
          <p className={styles.errorTitle}>Could not load insights</p>
          <p className={styles.errorText}>{error ?? 'Unknown error'}</p>
          <button type="button" className={styles.retryButton} onClick={load}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const controversialTitle = insights.crowdActive
    ? 'Most controversial'
    : 'Most AI-disputed';
  const controversialSub = insights.crowdActive
    ? 'Photos where the crowd split closest to 50/50 real vs fake.'
    : 'Photos where GPT-4o, Claude, and Gemini disagreed the most.';
  const agreedTitle = insights.crowdActive ? 'Most agreed upon' : 'Strongest AI consensus';
  const agreedSub = insights.crowdActive
    ? 'Crowd forecasts closest to the ground-truth label.'
    : 'Photos where all three sponsor models landed near the same odds.';

  return (
    <div className={styles.container}>
      <ScreenHeader title="Insights" subtitle="Public forecast data and photo analytics" />

      <div className={styles.statsGrid}>
        <div className={`${styles.statBox} ${styles.statHighlight}`}>
          <span className={styles.statNum}>{insights.totalImages}</span>
          <span className={styles.statLabel}>Images in pool</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{insights.totalCrowdForecasts}</span>
          <span className={styles.statLabel}>Crowd forecasts</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{insights.totalGames}</span>
          <span className={styles.statLabel}>Games played</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{insights.totalAnalysts}</span>
          <span className={styles.statLabel}>Analysts</span>
        </div>
      </div>

      {!insights.crowdActive && (
        <p className={styles.crowdHint}>
          Crowd analytics will appear once players complete games — AI model stats are live now.
        </p>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>AI model calibration</h2>
        <p className={styles.sectionSub}>Average distance from ground truth (lower is better).</p>
        {insights.aiModelStats.map((model, index) => (
          <div key={model.modelId} className={styles.modelRow}>
            <span className={styles.modelRank}>{index + 1}</span>
            <div className={styles.modelBody}>
              <span className={styles.modelName}>
                {model.modelName}
                {model.sponsor ? ` · ${model.sponsor}` : ''}
              </span>
              <div className={styles.modelBarTrack}>
                <div
                  className={styles.modelBarFill}
                  style={{ width: `${Math.min(100, model.avgError)}%` }}
                />
              </div>
            </div>
            <span className={`${styles.modelError} mono`}>{model.avgError.toFixed(1)} pts</span>
          </div>
        ))}
      </section>

      <PhotoStrip
        title={controversialTitle}
        subtitle={controversialSub}
        photos={insights.mostControversial}
      />

      <PhotoStrip title={agreedTitle} subtitle={agreedSub} photos={insights.mostAgreed} />

      <PhotoStrip
        title="Hardest fakes"
        subtitle="AI-generated images that fooled the models most (lowest fake odds)."
        photos={insights.hardestFakes}
      />

      <PhotoStrip
        title="Easiest fakes"
        subtitle="Synthetic images all three models flagged quickly."
        photos={insights.easiestFakes}
      />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>By category</h2>
        <p className={styles.sectionSub}>Pool size and model error by market.</p>
        {insights.categoryStats.map((cat) => (
          <div key={cat.categoryId} className={styles.categoryRow}>
            <span className={styles.categoryIcon}>{cat.icon}</span>
            <div className={styles.categoryBody}>
              <span className={styles.categoryName}>{cat.categoryName}</span>
              <span className={styles.categoryMeta}>
                {cat.imageCount} images · AI err {cat.avgAiError.toFixed(1)} pts
                {cat.forecastCount > 0 ? ` · ${cat.forecastCount} crowd forecasts` : ''}
              </span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
