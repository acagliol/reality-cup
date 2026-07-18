'use client';

import type { TabId } from '@/types/game';
import styles from './TabBar.module.css';

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
    <div className={styles.container}>
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => onChange(tab.id)}
            aria-current={active ? 'page' : undefined}
          >
            <span className={`${styles.label} ${active ? styles.labelActive : ''}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
