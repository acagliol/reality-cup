'use client';

import { useEffect, useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { getTrophyCabinet } from '@/lib/services/gameService';
import { getCategoryTheme } from '@/lib/theme';
import type { TrophyEntry } from '@/types/game';
import styles from './TrophyCabinetScreen.module.css';

export function TrophyCabinetScreen() {
  const { playerName, gameHistory, goBack } = useApp();
  const [trophies, setTrophies] = useState<TrophyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getTrophyCabinet(playerName ?? 'Anonymous', gameHistory);
        setTrophies(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [playerName, gameHistory]);

  return (
    <div className={styles.container}>
      <ScreenHeader
        title="Trophy cabinet"
        subtitle="Your best placement in each market"
        onBack={goBack}
      />

      {loading ? (
        <div className={styles.loading}>
          <div className="spinner" />
        </div>
      ) : trophies.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No trophies yet</p>
          <p className={styles.emptyText}>Complete a forecast session to fill your cabinet.</p>
        </div>
      ) : (
        <div className={styles.scroll}>
          {trophies.map((trophy) => {
            const cat = getCategoryTheme(trophy.categoryId);

            return (
              <div
                key={trophy.categoryId}
                className={styles.card}
                style={{ borderLeftColor: cat.primary, backgroundColor: cat.heroBg }}
              >
                <div className={styles.iconWrap} style={{ backgroundColor: cat.primaryMuted }}>
                  <span className={styles.icon}>{trophy.icon}</span>
                </div>
                <div className={styles.body}>
                  <span className={styles.marketName}>{trophy.categoryName}</span>
                  <span className={`${styles.placement} mono`} style={{ color: cat.primary }}>
                    #{trophy.rank ?? '—'} · {trophy.bestScore} pts
                  </span>
                  <span className={styles.meta}>
                    {trophy.gamesPlayed} session{trophy.gamesPlayed === 1 ? '' : 's'} completed
                  </span>
                </div>
                {trophy.rank !== null && trophy.rank <= 3 && (
                  <span className={styles.trophy}>🏆</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
