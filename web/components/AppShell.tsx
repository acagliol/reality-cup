'use client';

import { AppProvider, useApp } from '@/context/AppContext';
import { AppNavigator } from '@/components/AppNavigator';
import { NameModal } from '@/components/NameModal';
import styles from './AppShell.module.css';

function AppShellInner() {
  const { playerName, saveName } = useApp();

  return (
    <>
      <AppNavigator />
      <NameModal
        visible={!playerName}
        onSave={(name) => {
          saveName(name).catch(console.error);
        }}
      />
    </>
  );
}

export function AppShell() {
  return (
    <AppProvider>
      <div className={styles.shell}>
        <AppShellInner />
      </div>
    </AppProvider>
  );
}
