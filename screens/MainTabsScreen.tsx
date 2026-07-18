import { StyleSheet, View } from 'react-native';
import { TabBar } from '../components/TabBar';
import { useApp } from '../context/AppContext';
import { GamesScreen } from './GamesScreen';
import { InsightsScreen } from './InsightsScreen';
import { ProfileScreen } from './ProfileScreen';
import { theme } from '../lib/theme';

export function MainTabsScreen() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'games' && <GamesScreen />}
        {activeTab === 'insights' && <InsightsScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
  },
});
