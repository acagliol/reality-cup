import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TabId } from '../types/game';
import { theme } from '../lib/theme';

interface TabBarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'games', label: 'Games' },
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
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderRadius: theme.radius.md,
    padding: 4,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: c.border,
    ...theme.shadow.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  tabActive: {
    backgroundColor: c.accent,
  },
  label: {
    color: c.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
  labelActive: {
    color: c.white,
  },
});
