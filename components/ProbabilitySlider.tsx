import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { useCategoryTheme } from '../context/CategoryThemeContext';
import { labelForValue } from '../lib/scoring';
import { theme } from '../lib/theme';

interface ProbabilitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ProbabilitySlider({
  value,
  onChange,
  disabled,
}: ProbabilitySliderProps) {
  const cat = useCategoryTheme();
  const fakePct = value;
  const realPct = 100 - value;

  return (
    <View style={styles.container}>
      <View style={styles.probRow}>
        <View style={styles.probCol}>
          <Text style={[styles.probLabel, { color: cat.real }]}>P(Real)</Text>
          <Text style={[styles.probValue, { color: cat.real }]}>{realPct}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.probCol, styles.probColRight]}>
          <Text style={[styles.probLabel, { color: cat.fake }]}>P(Fake)</Text>
          <Text style={[styles.probValue, { color: cat.fake }]}>{fakePct}%</Text>
        </View>
      </View>

      <View style={styles.trackLabels}>
        <Text style={[styles.edge, { color: cat.real }]}>Real</Text>
        <Text style={styles.confidence}>{labelForValue(value)}</Text>
        <Text style={[styles.edge, { color: cat.fake }]}>Fake</Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        minimumTrackTintColor={cat.fake}
        maximumTrackTintColor={cat.real}
        thumbTintColor={cat.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  probRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadow.sm,
  },
  probCol: { flex: 1 },
  probColRight: { alignItems: 'flex-end' },
  probLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  probValue: {
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  edge: {
    fontSize: 12,
    fontWeight: '700',
  },
  confidence: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slider: {
    width: '100%',
    height: 44,
  },
});

/** @deprecated use ProbabilitySlider */
export const GameSlider = ProbabilitySlider;
