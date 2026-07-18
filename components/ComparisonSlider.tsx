import { StyleSheet, Text, View } from 'react-native';
import { labelForValue } from '../lib/scoring';
import { theme } from '../lib/theme';

interface ComparisonSliderProps {
  label: string;
  value: number;
  color: string;
  subtitle?: string;
}

export function ComparisonSlider({ label, value, color, subtitle }: ComparisonSliderProps) {
  const c = theme.colors;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{Math.round(value)}</Text>
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
        <View style={[styles.thumb, { left: `${value}%`, borderColor: color }]} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.edge, { color: c.real }]}>Real</Text>
        <Text style={styles.mid}>{labelForValue(value)}</Text>
        <Text style={[styles.edge, { color: c.fake }]}>Fake</Text>
      </View>
    </View>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  container: {
    backgroundColor: c.surfaceAlt,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    color: c.text,
    fontWeight: '700',
    fontSize: 15,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: c.textMuted,
    fontSize: 12,
    marginBottom: theme.spacing.sm,
  },
  track: {
    height: 8,
    backgroundColor: c.surface,
    borderRadius: 4,
    marginVertical: theme.spacing.sm,
    position: 'relative',
    borderWidth: 1,
    borderColor: c.border,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    opacity: 0.45,
  },
  thumb: {
    position: 'absolute',
    top: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: c.white,
    borderWidth: 2,
    marginLeft: -7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  edge: {
    fontSize: 11,
    fontWeight: '600',
  },
  mid: {
    color: c.textMuted,
    fontSize: 11,
  },
});
