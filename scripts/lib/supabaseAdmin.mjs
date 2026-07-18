import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Need EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (Settings → API → service_role)',
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function upsertAiModels(client, models) {
  const rows = models.map((m) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    version: m.version,
    active: true,
  }));

  const { error } = await client.from('ai_models').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`ai_models upsert failed: ${error.message}`);
  return rows.length;
}

export async function upsertRoundContent(client, rounds) {
  const { error } = await client.from('round_content').upsert(rounds, { onConflict: 'id' });
  if (error) throw new Error(`round_content upsert failed: ${error.message}`);
  return rounds.length;
}

export async function fetchRoundContent(client, { categoryId, roundContentId, limit }) {
  let query = client
    .from('round_content')
    .select('id, category_id, image_url, truth_value, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (categoryId) query = query.eq('category_id', categoryId);
  if (roundContentId) query = query.eq('id', roundContentId);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`round_content fetch failed: ${error.message}`);
  return data ?? [];
}

export async function fetchExistingAnswers(client, roundContentIds, modelIds) {
  if (roundContentIds.length === 0) return new Set();

  const { data, error } = await client
    .from('ai_answers')
    .select('round_content_id, ai_model_id')
    .in('round_content_id', roundContentIds)
    .in('ai_model_id', modelIds);

  if (error) throw new Error(`ai_answers fetch failed: ${error.message}`);

  return new Set((data ?? []).map((row) => `${row.round_content_id}:${row.ai_model_id}`));
}

export async function upsertAiAnswer(client, roundContentId, aiModelId, answerValue) {
  const { error } = await client.from('ai_answers').upsert(
    {
      round_content_id: roundContentId,
      ai_model_id: aiModelId,
      answer_value: answerValue,
    },
    { onConflict: 'round_content_id,ai_model_id' },
  );

  if (error) throw new Error(`ai_answers upsert failed: ${error.message}`);
}
