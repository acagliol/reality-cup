import type { Category } from '../../types/game';
import { isSupabaseConfigured, supabase } from '../supabase';

interface CategoryRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
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

export async function fetchCategories(): Promise<Category[]> {
  const client = assertSupabase();

  const { data, error } = await client
    .from('categories')
    .select('id, name, description, icon, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  if (!data?.length) throw new Error('No active categories found in Supabase');

  return (data as CategoryRow[]).map(mapRow);
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
