import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TabId } from '../types/game';
import { theme } from '../lib/theme';

interface TabBarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'games', label: 'Markets' },
  { id: 'insights', label: 'Insights' },
  { id: 'profile', label: 'Profile' },
];

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  label: {
    color: theme.colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  labelActive: {
    color: theme.colors.accentText,
    fontWeight: '800',
  },
});
