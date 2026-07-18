import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const c = theme.colors;

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
    color: c.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: c.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: c.textMuted,
    fontSize: 15,
    marginTop: 6,
    lineHeight: 22,
  },
});
