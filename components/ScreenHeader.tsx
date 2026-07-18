import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  accentColor?: string;
}

export function ScreenHeader({ title, subtitle, onBack, accentColor }: ScreenHeaderProps) {
  const accent = accentColor ?? theme.colors.text;

  return (
    <View style={styles.container}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={[styles.backText, { color: accent }]}>← Back</Text>
        </Pressable>
      )}
      <Text style={styles.eyebrow}>Probability Cup</Text>
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
  back: {
    marginBottom: theme.spacing.sm,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
});
