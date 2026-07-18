'use client';

import { useCategoryTheme } from '@/context/CategoryThemeContext';
import { labelForValue } from '@/lib/scoring';
import styles from './ProbabilityTrack.module.css';

interface ProbabilityTrackProps {
  label: string;
  value: number;
  color?: string;
  subtitle?: string;
  highlight?: boolean;
}

export function ProbabilityTrack({
  label,
  value,
  color,
  subtitle,
  highlight,
}: ProbabilityTrackProps) {
  const cat = useCategoryTheme();
  const trackColor = color ?? '#e4ff1a';

  return (
    <div className={`${styles.container} ${highlight ? styles.highlight : ''}`}>
      <div className={styles.header}>
        <div className={styles.labelWrap}>
          <span className={styles.label}>{label}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        <span className={`${styles.value} mono`} style={{ color: trackColor }}>
          {Math.round(value)}%
        </span>
      </div>

      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${value}%`, backgroundColor: trackColor }}
        />
        <div
          className={styles.marker}
          style={{ left: `${value}%`, borderColor: trackColor }}
        />
      </div>

      <div className={styles.footer}>
        <span className={styles.edge} style={{ color: cat.real }}>
          0 Real
        </span>
        <span className={styles.mid}>{labelForValue(value)}</span>
        <span className={styles.edge} style={{ color: cat.fake }}>
          100 Fake
        </span>
      </div>
    </div>
  );
}

/** @deprecated use ProbabilityTrack */
export const ComparisonSlider = ProbabilityTrack;
