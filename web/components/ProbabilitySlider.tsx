'use client';

import styles from './ProbabilitySlider.module.css';

interface ProbabilitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  showOddsBox?: boolean;
}

export function ProbabilitySlider({
  value,
  onChange,
  disabled,
  showOddsBox = true,
}: ProbabilitySliderProps) {
  return (
    <div className={styles.container}>
      {showOddsBox && (
        <div className={styles.oddsBox}>
          <span className={styles.oddsLabel}>YOUR ODDS</span>
          <span className={`${styles.oddsValue} mono`}>{value}%</span>
        </div>
      )}

      <div className={styles.endpointLabels}>
        <div className={styles.endpointLeft}>
          <span className={`${styles.endpointDot} ${styles.realDot}`} />
          <span className={styles.realLabel}>Real</span>
        </div>
        <div className={styles.endpointRight}>
          <span className={styles.fakeLabel}>Fake</span>
          <span className={`${styles.endpointDot} ${styles.fakeDot}`} />
        </div>
      </div>

      <div className={styles.sliderWrap}>
        <div
          className={styles.trackBg}
          style={{
            background: `linear-gradient(to right, #16a34a 0%, #16a34a ${value}%, #1a1919 ${value}%, #1a1919 100%)`,
          }}
        />
        <input
          type="range"
          className={styles.slider}
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
        />
      </div>

      <div className={styles.scale}>
        <span className={styles.realHint}>← more real</span>
        <span className={`${styles.scaleValue} mono`}>{value}% fake</span>
        <span className={styles.fakeHint}>more fake →</span>
      </div>
    </div>
  );
}

/** @deprecated use ProbabilitySlider */
export const GameSlider = ProbabilitySlider;
