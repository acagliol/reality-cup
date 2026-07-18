import { StyleSheet, Text, View } from 'react-native';
import { useCategoryTheme } from '../context/CategoryThemeContext';
import { formatCountdown } from '../lib/scoring';
import { theme } from '../lib/theme';
import { ROUND_TIME_MS } from '../types/game';

interface CountdownTimerProps {
  remainingMs: number;
}

export function CountdownTimer({ remainingMs }: CountdownTimerProps) {
  const cat = useCategoryTheme();
  const urgent = remainingMs <= 3000;
  const progress = remainingMs / ROUND_TIME_MS;
  const seconds = formatCountdown(remainingMs);

  return (
    <View style={styles.wrap}>
      <View style={[styles.ringOuter, { borderColor: cat.primaryMuted }]}>
        <View
          style={[
            styles.ringProgress,
            {
              width: `${progress * 100}%`,
              backgroundColor: urgent ? theme.colors.danger : cat.primary,
            },
          ]}
        />
        <View style={styles.ringInner}>
          <Text style={[styles.seconds, urgent && styles.secondsUrgent]}>{seconds}</Text>
          <Text style={styles.unit}>sec left</Text>
        </View>
      </View>
      <Text style={styles.caption}>Forecast window closes at 0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.shadow.sm,
  },
  ringProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '100%',
    opacity: 0.15,
  },
  ringInner: {
    alignItems: 'center',
  },
  seconds: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  secondsUrgent: {
    color: theme.colors.danger,
  },
  unit: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  caption: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
});
