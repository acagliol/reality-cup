import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { TabBar } from '../components/TabBar';
import { useApp } from '../context/AppContext';
import { MOCK_CATEGORIES } from '../lib/mock/data';
import { theme } from '../lib/theme';

export function GamesScreen() {
  const { playerName, activeTab, setActiveTab, navigate } = useApp();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Real or Fake?"
        subtitle={`Hey ${playerName ?? 'player'} — pick a category and test your eye.`}
      />

      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      <FlatList
        data={MOCK_CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigate({ name: 'category-detail', categoryId: item.id })}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: c.border,
    gap: theme.spacing.md,
    ...theme.shadow.sm,
  },
  icon: {
    fontSize: 32,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: c.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    color: c.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    color: c.textMuted,
    fontSize: 28,
    fontWeight: '300',
  },
});
