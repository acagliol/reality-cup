import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../context/AppContext';
import { MOCK_CATEGORIES } from '../lib/mock/data';
import { getCategoryTheme, theme } from '../lib/theme';

export function GamesScreen() {
  const { playerName, navigate } = useApp();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Forecast Markets"
        subtitle={`${playerName ?? 'Analyst'} — calibrate your eye against AI.`}
      />

      <FlatList
        data={MOCK_CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cat = getCategoryTheme(item.id);
          return (
            <Pressable
              style={[styles.card, { borderLeftColor: cat.primary, backgroundColor: cat.heroBg }]}
              onPress={() => navigate({ name: 'category-detail', categoryId: item.id })}
            >
              <View style={[styles.iconWrap, { backgroundColor: cat.primaryMuted }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={[styles.cardTag, { color: cat.primary }]}>10 forecasts · 10s window</Text>
              </View>
              <Text style={[styles.chevron, { color: cat.primary }]}>›</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    gap: theme.spacing.md,
    ...theme.shadow.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
  },
});
