'use client';

import { TabBar } from '@/components/TabBar';
import { useApp } from '@/context/AppContext';
import { GamesScreen } from '@/screens/GamesScreen';
import { InsightsScreen } from '@/screens/InsightsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import styles from './MainTabsScreen.module.css';

export function MainTabsScreen() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {activeTab === 'games' && <GamesScreen />}
        {activeTab === 'insights' && <InsightsScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
