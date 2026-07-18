import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TabId } from '../types/game';
import { theme } from '../lib/theme';

interface TabBarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'games', label: 'Markets' },
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: 4,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadow.sm,
  },
  label: {
    color: theme.colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  labelActive: {
    color: theme.colors.text,
  },
});
