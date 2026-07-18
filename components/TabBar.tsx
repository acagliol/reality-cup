import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TabId } from '../types/game';
import { theme } from '../lib/theme';

interface TabBarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'games', label: 'Markets', icon: '📊' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            style={styles.tab}
            onPress={() => onChange(tab.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
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
    paddingBottom: theme.spacing.md,
    ...theme.shadow.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    gap: 2,
  },
  icon: {
    fontSize: 20,
    opacity: 0.45,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    color: theme.colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
  labelActive: {
    color: theme.colors.text,
    fontWeight: '800',
  },
});
