/** Playable content categories (excludes the aggregate random mix). */
export const POOL_CATEGORY_IDS = [
  'cat-world-cup',
  'cat-lebron-decision',
  'cat-brain-rot',
  'cat-nyc-core',
  'cat-food',
] as const;

export const RANDOM_CATEGORY_ID = 'cat-random';

export function isRandomCategory(categoryId: string): boolean {
  return categoryId === RANDOM_CATEGORY_ID;
}
