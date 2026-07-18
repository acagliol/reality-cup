import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { TabBar } from '../components/TabBar';
import { useApp } from '../context/AppContext';
import { theme } from '../lib/theme';

export function ProfileScreen() {
  const { playerName, activeTab, setActiveTab, gameHistory, navigate } = useApp();

  const completedGames = gameHistory.filter((g) => g.status === 'completed');
  const inProgressGames = gameHistory.filter((g) => g.status === 'in_progress');

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Profile"
        subtitle={`Playing as ${playerName ?? 'Anonymous'}`}
      />

      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{completedGames.length}</Text>
          <Text style={styles.statLabel}>Games Played</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>
            {completedGames.length
              ? Math.max(...completedGames.map((g) => g.totalScore))
              : 0}
          </Text>
          <Text style={styles.statLabel}>Best Score</Text>
        </View>
      </View>

      {inProgressGames.length > 0 && (
        <>
          <Text style={styles.section}>In Progress</Text>
          {inProgressGames.map((game) => (
            <Pressable
              key={game.id}
              style={styles.card}
              onPress={() => navigate({ name: 'game-history', gameId: game.id })}
            >
              <Text style={styles.cardTitle}>{game.categoryName}</Text>
              <Text style={styles.cardMeta}>
                {game.rounds.filter((r) => r.playerAnswer).length}/{game.rounds.length} rounds
              </Text>
            </Pressable>
          ))}
        </>
      )}

      <Text style={styles.section}>Game History</Text>

      <FlatList
        data={completedGames}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No completed games yet. Play your first round!</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigate({ name: 'game-history', gameId: item.id })}
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>{item.categoryName}</Text>
              <Text style={styles.score}>{item.totalScore} pts</Text>
            </View>
            <Text style={styles.cardMeta}>
              {new Date(item.completedAt ?? item.startedAt).toLocaleDateString()} ·{' '}
              {item.rounds.length} rounds
            </Text>
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
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    ...theme.shadow.sm,
  },
  statNum: {
    color: c.accent,
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    color: c.text,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    ...theme.shadow.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: c.text,
    fontWeight: '700',
    fontSize: 15,
  },
  score: {
    color: c.warning,
    fontWeight: '800',
  },
  cardMeta: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    color: c.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
