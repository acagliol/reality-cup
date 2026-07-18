import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LeaderboardList, LeaderboardLoading } from './LeaderboardList';
import { useCategoryTheme } from '../context/CategoryThemeContext';
import type { CategoryLeaderboard } from '../types/game';
import { theme } from '../lib/theme';

interface LeaderboardSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  data: CategoryLeaderboard | null;
  loading?: boolean;
  onClose: () => void;
}

export function LeaderboardSheet({
  visible,
  title,
  subtitle,
  data,
  loading,
  onClose,
}: LeaderboardSheetProps) {
  const cat = useCategoryTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>Leaderboard · Top 10</Text>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={[styles.close, { color: cat.primary }]}>Done</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {loading || !data ? <LeaderboardLoading /> : <LeaderboardList data={data} />}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '85%',
    ...theme.shadow.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: { flex: 1, paddingRight: theme.spacing.md },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  close: {
    fontWeight: '700',
    fontSize: 16,
  },
  list: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
});
