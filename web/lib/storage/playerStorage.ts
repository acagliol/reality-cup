const PLAYER_NAME_KEY = '@realorfake/player_name';
const DEVICE_ID_KEY = '@realorfake/device_id';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export async function getPlayerName(): Promise<string | null> {
  return getStorage()?.getItem(PLAYER_NAME_KEY) ?? null;
}

export async function savePlayerName(name: string): Promise<void> {
  getStorage()?.setItem(PLAYER_NAME_KEY, name.trim());
}

export async function getDeviceId(): Promise<string> {
  const storage = getStorage();
  if (!storage) return `device_ssr_${Date.now()}`;

  const existing = storage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  storage.setItem(DEVICE_ID_KEY, id);
  return id;
}
