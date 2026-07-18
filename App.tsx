import { StatusBar } from 'expo-status-bar';
import { NameModal } from './components/NameModal';
import { AppProvider, useApp } from './context/AppContext';
import { AppNavigator } from './navigation/AppNavigator';

function AppShell() {
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
      <StatusBar style="dark" />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
