import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  accentColor?: string;
  totalRbp?: number;
}

export function ScreenHeader({ title, subtitle, onBack, accentColor, totalRbp }: ScreenHeaderProps) {
  const accent = accentColor ?? theme.colors.text;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.back}>
            <Text style={[styles.backText, { color: accent }]}>← Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        {totalRbp !== undefined && Number.isFinite(totalRbp) && (
          <View style={styles.rbpBox}>
            <Text style={styles.rbpLabel}>TOTAL RBP</Text>
            <Text style={styles.rbpValue}>{totalRbp.toFixed(2)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.eyebrow}>Reality Cup</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 56,
    paddingBottom: theme.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  back: {},
  backSpacer: {
    width: 1,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rbpBox: {
    alignItems: 'flex-end',
  },
  rbpLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  rbpValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
});
