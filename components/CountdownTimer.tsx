import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

interface CountdownTimerProps {
  remainingMs: number;
  variant?: 'clock' | 'inline';
}

const TICK_COUNT = 10;
const CLOCK_SIZE = 76;
const CLOCK_CENTER = CLOCK_SIZE / 2;
const TICK_RADIUS = 30;

export function CountdownTimer({ remainingMs, variant = 'clock' }: CountdownTimerProps) {
  const urgent = remainingMs <= 3000;
  const displaySeconds = Math.ceil(remainingMs / 1000);
  const litTicks = Math.max(0, Math.min(TICK_COUNT, displaySeconds));
  const accent = urgent ? theme.colors.danger : theme.colors.accent;

  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        <Text style={styles.inlineTime}>{displaySeconds}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.clockWrap}>
      <View style={[styles.clockFace, urgent && styles.clockFaceUrgent]}>
        {Array.from({ length: TICK_COUNT }).map((_, index) => {
          const angle = (index / TICK_COUNT) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = CLOCK_CENTER + TICK_RADIUS * Math.cos(rad);
          const y = CLOCK_CENTER + TICK_RADIUS * Math.sin(rad);
          const active = index < litTicks;

          return (
            <View
              key={index}
              style={[
                styles.tick,
                {
                  left: x - 2,
                  top: y - 5,
                  transform: [{ rotate: `${angle + 90}deg` }],
                  backgroundColor: active ? accent : theme.colors.border,
                },
              ]}
            />
          );
        })}

        <View style={styles.centerDisc}>
          <Text style={[styles.clockTime, urgent && styles.urgent]}>{displaySeconds}</Text>
          <Text style={[styles.clockUnit, urgent && styles.urgentMuted]}>sec</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clockWrap: {
    alignItems: 'center',
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_CENTER,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockFaceUrgent: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerMuted,
  },
  tick: {
    position: 'absolute',
    width: 3,
    height: 8,
    borderRadius: 2,
  },
  centerDisc: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clockTime: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
    lineHeight: 24,
  },
  clockUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: -1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineTime: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
    fontFamily: theme.font.mono,
  },
  urgent: {
    color: theme.colors.danger,
  },
  urgentMuted: {
    color: theme.colors.danger,
    opacity: 0.75,
  },
});
