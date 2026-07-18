import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYER_NAME_KEY = '@realorfake/player_name';
const DEVICE_ID_KEY = '@realorfake/device_id';

export async function getPlayerName(): Promise<string | null> {
  return AsyncStorage.getItem(PLAYER_NAME_KEY);
}

export async function savePlayerName(name: string): Promise<void> {
  await AsyncStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
