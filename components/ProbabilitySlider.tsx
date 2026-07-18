import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

interface ProbabilitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  showOddsBox?: boolean;
}

const REAL_COLOR = theme.colors.success;
const FAKE_COLOR = theme.colors.text;

export function ProbabilitySlider({
  value,
  onChange,
  disabled,
  showOddsBox = true,
}: ProbabilitySliderProps) {
  return (
    <View style={styles.container}>
      {showOddsBox && (
        <View style={styles.oddsBox}>
          <Text style={styles.oddsLabel}>YOUR ODDS</Text>
          <Text style={styles.oddsValue}>{value}%</Text>
        </View>
      )}

      <View style={styles.endpointLabels}>
        <View style={styles.endpointLeft}>
          <View style={[styles.endpointDot, { backgroundColor: REAL_COLOR }]} />
          <Text style={[styles.endpointText, { color: REAL_COLOR }]}>Real</Text>
        </View>
        <View style={styles.endpointRight}>
          <Text style={[styles.endpointText, { color: FAKE_COLOR }]}>Fake</Text>
          <View style={[styles.endpointDot, { backgroundColor: FAKE_COLOR }]} />
        </View>
      </View>

      <View style={styles.sliderWrap}>
        <View style={styles.trackBg}>
          <View style={styles.trackReal} />
          <View style={styles.trackFake} />
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
        <Text style={[styles.scaleHint, { color: REAL_COLOR }]}>← more real</Text>
        <Text style={styles.scaleValue}>{value}% fake</Text>
        <Text style={[styles.scaleHint, { color: FAKE_COLOR }]}>more fake →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
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
  endpointLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endpointLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  endpointRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  endpointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  endpointText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
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
    height: 10,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  trackReal: {
    flex: 1,
    backgroundColor: REAL_COLOR,
  },
  trackFake: {
    flex: 1,
    backgroundColor: FAKE_COLOR,
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
  scaleHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  scaleValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});

/** @deprecated use ProbabilitySlider */
export const GameSlider = ProbabilitySlider;
