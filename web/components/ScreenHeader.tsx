'use client';

import styles from './ScreenHeader.module.css';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  accentColor?: string;
  totalRbp?: number;
}

export function ScreenHeader({ title, subtitle, onBack, accentColor, totalRbp }: ScreenHeaderProps) {
  const accent = accentColor ?? '#1a1919';

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        {onBack ? (
          <button type="button" className={styles.back} onClick={onBack}>
            <span className={styles.backText} style={{ color: accent }}>
              ← Back
            </span>
          </button>
        ) : (
          <div className={styles.backSpacer} />
        )}
        {totalRbp !== undefined && Number.isFinite(totalRbp) && (
          <div className={styles.rbpBox}>
            <span className={styles.rbpLabel}>TOTAL RBP</span>
            <span className={`${styles.rbpValue} mono`}>{totalRbp.toFixed(2)}</span>
          </div>
        )}
      </div>
      <span className={styles.eyebrow}>Reality Cup</span>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
