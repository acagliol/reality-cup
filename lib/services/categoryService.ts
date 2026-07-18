import type { Category } from '../../types/game';

import { ROUNDS_PER_GAME } from '../../types/game';

import { isRandomCategory, POOL_CATEGORY_IDS } from '../constants/categories';

import { isSupabaseConfigured, supabase } from '../supabase';



interface CategoryRow {

  id: string;

  name: string;

  description: string;

  icon: string;

  sort_order: number;

}



interface ContentRow {

  category_id: string;

  truth_value: number;

}



function mapRow(row: CategoryRow): Category {

  return {

    id: row.id,

    name: row.name,

    description: row.description,

    icon: row.icon,

    sortOrder: row.sort_order,

  };

}



function assertSupabase() {

  if (!isSupabaseConfigured || !supabase) {

    throw new Error(

      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local',

    );

  }

  return supabase;

}



function countSides(rows: ContentRow[]) {

  const realCountByCategory = new Map<string, number>();

  const fakeCountByCategory = new Map<string, number>();



  for (const row of rows) {

    const target = row.truth_value >= 50 ? fakeCountByCategory : realCountByCategory;

    target.set(row.category_id, (target.get(row.category_id) ?? 0) + 1);

  }



  return { realCountByCategory, fakeCountByCategory };

}



function isCategoryPlayable(

  categoryId: string,

  realCountByCategory: Map<string, number>,

  fakeCountByCategory: Map<string, number>,

  poolRealTotal: number,

  poolFakeTotal: number,

): boolean {

  if (isRandomCategory(categoryId)) {

    return (

      poolRealTotal >= Math.ceil(ROUNDS_PER_GAME / 2) &&

      poolFakeTotal >= Math.floor(ROUNDS_PER_GAME / 2)

    );

  }



  const realCount = realCountByCategory.get(categoryId) ?? 0;

  const fakeCount = fakeCountByCategory.get(categoryId) ?? 0;



  if (realCount === 0) {

    return fakeCount >= ROUNDS_PER_GAME;

  }



  return (

    realCount >= Math.ceil(ROUNDS_PER_GAME / 2) &&

    fakeCount >= Math.floor(ROUNDS_PER_GAME / 2)

  );

}



export async function fetchCategories(): Promise<Category[]> {

  const client = assertSupabase();



  const [{ data, error }, { data: contentRows, error: contentError }] = await Promise.all([

    client

      .from('categories')

      .select('id, name, description, icon, sort_order')

      .eq('active', true)

      .order('sort_order', { ascending: true }),

    client

      .from('round_content')

      .select('category_id, truth_value')

      .eq('active', true),

  ]);



  if (error) throw new Error(`Failed to load categories: ${error.message}`);

  if (contentError) throw new Error(`Failed to load category content: ${contentError.message}`);

  if (!data?.length) throw new Error('No active categories found in Supabase');



  const { realCountByCategory, fakeCountByCategory } = countSides(

    (contentRows ?? []) as ContentRow[],

  );



  const poolRealTotal = [...POOL_CATEGORY_IDS].reduce(

    (sum, id) => sum + (realCountByCategory.get(id) ?? 0),

    0,

  );

  const poolFakeTotal = [...POOL_CATEGORY_IDS].reduce(

    (sum, id) => sum + (fakeCountByCategory.get(id) ?? 0),

    0,

  );



  const playable = (data as CategoryRow[]).filter((row) =>

    isCategoryPlayable(

      row.id,

      realCountByCategory,

      fakeCountByCategory,

      poolRealTotal,

      poolFakeTotal,

    ),

  );



  if (!playable.length) {

    throw new Error('No playable markets found. Seed real and fake images first.');

  }



  return playable.map(mapRow);

}



export async function fetchCategoryById(categoryId: string): Promise<Category | null> {

  const client = assertSupabase();



  const { data, error } = await client

    .from('categories')

    .select('id, name, description, icon, sort_order')

    .eq('id', categoryId)

    .eq('active', true)

    .maybeSingle();



  if (error) throw new Error(`Failed to load category: ${error.message}`);

  if (!data) return null;



  return mapRow(data as CategoryRow);

}

