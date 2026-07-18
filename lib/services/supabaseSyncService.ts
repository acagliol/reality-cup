import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameSession } from '../../types/game';
import { isSupabaseConfigured, supabase } from '../supabase';
import { getDeviceId } from '../storage/playerStorage';

const PROFILE_ID_KEY = '@realorfake/profile_id';

export async function getStoredProfileId(): Promise<string | null> {
  return AsyncStorage.getItem(PROFILE_ID_KEY);
}

export async function syncProfile(displayName: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const deviceId = await getDeviceId();
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        device_id: deviceId,
        display_name: displayName.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'device_id' },
    )
    .select('id')
    .single();

  if (error || !data?.id) {
    console.warn('Profile sync failed:', error?.message);
    return null;
  }

  await AsyncStorage.setItem(PROFILE_ID_KEY, data.id);
  return data.id;
}

export async function syncCompletedGame(game: GameSession): Promise<void> {
  if (!isSupabaseConfigured || !supabase || game.status !== 'completed') return;

  let profileId = await getStoredProfileId();
  if (!profileId) {
    profileId = await syncProfile(game.playerName);
  }
  if (!profileId) return;

  const { error } = await supabase.from('games').upsert(
    {
      id: game.id,
      profile_id: profileId,
      category_id: game.categoryId,
      status: 'completed',
      total_score: game.totalScore,
      started_at: game.startedAt,
      completed_at: game.completedAt ?? new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    console.warn('Game sync failed:', error.message);
  }
}
