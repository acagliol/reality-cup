import type { AiAnswer, RoundContent } from '@/types/game';
import { ROUNDS_PER_GAME } from '@/types/game';
import { isRandomCategory, POOL_CATEGORY_IDS, RANDOM_CATEGORY_ID } from '@/lib/constants/categories';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface RoundContentRow {
  id: string;
  category_id: string;
  image_url: string;
  truth_value: number;
  sort_order: number;
}

interface AiAnswerRow {
  ai_model_id: string;
  answer_value: number;
}

function assertSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    );
  }
  return supabase;
}

export async function fetchRoundsForCategory(
  categoryId: string,
  count = ROUNDS_PER_GAME,
): Promise<RoundContent[]> {
  if (isRandomCategory(categoryId)) {
    return fetchRandomMixedRounds(count);
  }

  const client = assertSupabase();

  const { data, error } = await client
    .from('round_content')
    .select('id, category_id, image_url, truth_value, sort_order')
    .eq('category_id', categoryId)
    .eq('active', true)
    .gt('truth_value', 50);

  if (error) throw new Error(`Failed to load rounds: ${error.message}`);
  if (!data?.length) {
    throw new Error(`No fake images found for category "${categoryId}".`);
  }

  return pickRoundsFromRows(data as RoundContentRow[], count, categoryId);
}

async function fetchRandomMixedRounds(count: number): Promise<RoundContent[]> {
  const client = assertSupabase();

  const { data, error } = await client
    .from('round_content')
    .select('id, category_id, image_url, truth_value, sort_order')
    .in('category_id', [...POOL_CATEGORY_IDS])
    .eq('active', true)
    .gt('truth_value', 50);

  if (error) throw new Error(`Failed to load random mix: ${error.message}`);
  if (!data?.length) {
    throw new Error('No fake images found for Random Mix. Seed category pools first.');
  }

  return pickRoundsFromRows(data as RoundContentRow[], count, RANDOM_CATEGORY_ID);
}

function pickRoundsFromRows(
  rows: RoundContentRow[],
  count: number,
  categoryId: string,
): RoundContent[] {
  const deduped = dedupeRowsByImageUrl(rows);
  if (deduped.length < count) {
    throw new Error(
      `Category "${categoryId}" has ${deduped.length} unique fake images but needs at least ${count} to play.`,
    );
  }

  const pool = shuffleRoundPool(deduped, count);

  return pool.map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    imageUrl: row.image_url,
    truthValue: row.truth_value,
    sortOrder: row.sort_order,
  }));
}

export async function fetchAiAnswersForRound(roundContentId: string): Promise<AiAnswer[]> {
  const client = assertSupabase();

  const { data, error } = await client
    .from('ai_answers')
    .select('ai_model_id, answer_value')
    .eq('round_content_id', roundContentId);

  if (error) throw new Error(`Failed to load AI answers: ${error.message}`);

  return (data ?? []).map((row) => {
    const r = row as AiAnswerRow;
    return {
      aiModelId: r.ai_model_id,
      answerValue: r.answer_value,
    };
  });
}

export async function fetchCrowdMeanForRound(roundContentId: string): Promise<number> {
  const client = assertSupabase();

  const { data, error } = await client
    .from('crowd_stats')
    .select('mean_answer')
    .eq('round_content_id', roundContentId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load crowd stats: ${error.message}`);
  if (!data) return 50;

  return Number(data.mean_answer);
}

function shuffleRoundPool(rows: RoundContentRow[], count: number): RoundContentRow[] {
  if (rows.length <= count) return shuffle([...rows]);

  const real = rows.filter((r) => r.truth_value <= 50);
  const fake = rows.filter((r) => r.truth_value > 50);

  if (real.length === 0 || fake.length === 0) {
    return shuffle([...rows]).slice(0, count);
  }

  const targetReal = Math.ceil(count / 2);
  const targetFake = count - targetReal;

  const picked: RoundContentRow[] = [];
  const usedUrls = new Set<string>();

  const addFrom = (source: RoundContentRow[], max: number) => {
    let added = 0;
    for (const row of source) {
      if (added >= max) break;
      if (usedUrls.has(row.image_url)) continue;
      picked.push(row);
      usedUrls.add(row.image_url);
      added++;
    }
  };

  addFrom(shuffle(real), targetReal);
  addFrom(shuffle(fake), targetFake);

  if (picked.length < count) {
    const rest = shuffle(rows.filter((r) => !usedUrls.has(r.image_url)));
    for (const row of rest) {
      if (picked.length >= count) break;
      picked.push(row);
      usedUrls.add(row.image_url);
    }
  }

  return shuffle(picked).slice(0, count);
}

function dedupeRowsByImageUrl(rows: RoundContentRow[]): RoundContentRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.image_url)) return false;
    seen.add(row.image_url);
    return true;
  });
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
