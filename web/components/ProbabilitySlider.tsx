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
  const fillPct = ((value - 1) / 98) * 100;

  return (
    <div className={styles.container}>
      {showOddsBox && (
        <div className={styles.oddsBox}>
          <span className={styles.oddsLabel}>YOUR ODDS</span>
          <span className={`${styles.oddsValue} mono`}>{value}%</span>
        </div>
      )}

      <div className={styles.sliderWrap}>
        <div className={styles.trackBg}>
          <div className={styles.trackFill} style={{ width: `${fillPct}%` }} />
        </div>
        <input
          type="range"
          className={styles.slider}
          min={1}
          max={99}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
        />
      </div>

      <div className={styles.scale}>
        <span className={`${styles.scaleLabel} mono`}>0%</span>
        <span className={styles.scaleMid}>Real ← → Fake</span>
        <span className={`${styles.scaleLabel} mono`}>100%</span>
      </div>
    </div>
  );
}

/** @deprecated use ProbabilitySlider */
export const GameSlider = ProbabilitySlider;
