import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

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
    <View style={styles.container}>
      {showOddsBox && (
        <View style={styles.oddsBox}>
          <Text style={styles.oddsLabel}>YOUR ODDS</Text>
          <Text style={styles.oddsValue}>{value}%</Text>
        </View>
      )}

      <View style={styles.sliderWrap}>
        <View style={styles.trackBg}>
          <View style={[styles.trackFill, { width: `${fillPct}%` }]} />
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={99}
          step={1}
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor={theme.colors.surface}
        />
      </View>

      <View style={styles.scale}>
        <Text style={styles.scaleLabel}>0%</Text>
        <Text style={styles.scaleMid}>Real ← → Fake</Text>
        <Text style={styles.scaleLabel}>100%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  oddsBox: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.oddsBox,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minWidth: 108,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  oddsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.accentText,
    letterSpacing: 1,
  },
  oddsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.accentText,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
    marginTop: 2,
  },
  sliderWrap: {
    position: 'relative',
    height: 44,
    justifyContent: 'center',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.sliderTrack,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: theme.colors.sliderFill,
    borderRadius: theme.radius.full,
  },
  slider: {
    width: '100%',
    height: 44,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scaleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  scaleMid: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

/** @deprecated use ProbabilitySlider */
export const GameSlider = ProbabilitySlider;
