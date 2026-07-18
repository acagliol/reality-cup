'use client';

import styles from './CountdownTimer.module.css';

interface CountdownTimerProps {
  remainingMs: number;
  variant?: 'clock' | 'inline';
}

const TICK_COUNT = 10;
const CLOCK_SIZE = 76;
const CLOCK_CENTER = CLOCK_SIZE / 2;
const TICK_RADIUS = 30;

export function CountdownTimer({ remainingMs, variant = 'clock' }: CountdownTimerProps) {
  const urgent = remainingMs <= 3000;
  const displaySeconds = Math.ceil(remainingMs / 1000);
  const litTicks = Math.max(0, Math.min(TICK_COUNT, displaySeconds));
  const accent = urgent ? '#dc2626' : '#e4ff1a';

  if (variant === 'inline') {
    return (
      <div className={styles.inline}>
        <span className={`${styles.inlineTime} mono`}>{displaySeconds}s</span>
      </div>
    );
  }

  return (
    <div className={styles.clockWrap}>
      <div className={`${styles.clockFace} ${urgent ? styles.clockFaceUrgent : ''}`}>
        {Array.from({ length: TICK_COUNT }).map((_, index) => {
          const angle = (index / TICK_COUNT) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = CLOCK_CENTER + TICK_RADIUS * Math.cos(rad);
          const y = CLOCK_CENTER + TICK_RADIUS * Math.sin(rad);
          const active = index < litTicks;

          return (
            <span
              key={index}
              className={styles.tick}
              style={{
                left: x - 2,
                top: y - 5,
                transform: `rotate(${angle + 90}deg)`,
                backgroundColor: active ? accent : '#e4e4e7',
              }}
            />
          );
        })}

        <div className={styles.centerDisc}>
          <span className={`${styles.clockTime} mono ${urgent ? styles.urgent : ''}`}>
            {displaySeconds}
          </span>
          <span className={`${styles.clockUnit} ${urgent ? styles.urgentMuted : ''}`}>sec</span>
        </div>
      </div>
    </div>
  );
}
