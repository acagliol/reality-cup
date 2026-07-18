import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { labelForValue } from '../lib/scoring';
import { theme } from '../lib/theme';

interface GameSliderProps {
  value: number;
  onChange: (value: number) => void;
  onRelease?: (value: number) => void;
  disabled?: boolean;
}

export function GameSlider({ value, onChange, onRelease, disabled }: GameSliderProps) {
  const c = theme.colors;

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={[styles.edgeLabel, { color: c.real }]}>Real</Text>
        <Text style={[styles.edgeLabel, { color: c.fake }]}>Fake</Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        onSlidingComplete={onRelease}
        disabled={disabled}
        minimumTrackTintColor={c.accent}
        maximumTrackTintColor={c.border}
        thumbTintColor={c.accentSoft}
      />

      <View style={styles.valueBox}>
        <Text style={styles.value}>{Math.round(value)}</Text>
        <Text style={styles.valueLabel}>{labelForValue(value)}</Text>
      </View>
    </View>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  edgeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  valueBox: {
    alignItems: 'center',
    backgroundColor: c.accentMuted,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: c.accent,
  },
  value: {
    color: c.text,
    fontSize: 28,
    fontWeight: '800',
  },
  valueLabel: {
    color: c.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
});
