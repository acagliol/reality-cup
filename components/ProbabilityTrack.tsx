import { StyleSheet, Text, View } from 'react-native';
import { useCategoryTheme } from '../context/CategoryThemeContext';
import { labelForValue } from '../lib/scoring';
import { theme } from '../lib/theme';

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
  const trackColor = color ?? cat.primary;

  return (
    <View style={[styles.container, highlight && styles.highlight]}>
      <View style={styles.header}>
        <View style={styles.labelWrap}>
          <Text style={styles.label}>{label}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Text style={[styles.value, { color: trackColor }]}>{Math.round(value)}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%`, backgroundColor: trackColor }]} />
        <View style={[styles.marker, { left: `${value}%`, borderColor: trackColor }]} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.edge, { color: cat.real }]}>0 Real</Text>
        <Text style={styles.mid}>{labelForValue(value)}</Text>
        <Text style={[styles.edge, { color: cat.fake }]}>100 Fake</Text>
      </View>
    </View>
  );
}

/** @deprecated use ProbabilityTrack */
export const ComparisonSlider = ProbabilityTrack;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  highlight: {
    borderColor: theme.colors.borderStrong,
    ...theme.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  labelWrap: { flex: 1, paddingRight: theme.spacing.sm },
  label: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  track: {
    height: 6,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.full,
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
    opacity: 0.35,
  },
  marker: {
    position: 'absolute',
    top: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    marginLeft: -6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  edge: {
    fontSize: 10,
    fontWeight: '600',
  },
  mid: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
});
