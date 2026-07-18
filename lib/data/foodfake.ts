/** FoodFake-30K categories — https://github.com/DhruvalPtl/FoodFake-30K */
export const FOODFAKE_CATEGORIES = [
  'baklava',
  'biryani',
  'burger',
  'cake_pastry',
  'croissant',
  'dim_sum',
  'falafel',
  'hummus',
  'pizza',
  'plov',
  'ramen',
  'salad',
  'steak',
  'sushi',
  'tacos',
] as const;

export type FoodfakeCategory = (typeof FOODFAKE_CATEGORIES)[number];

/** P(fake) scale: real photographs ≈ 0, AI-generated ≈ 100 */
export const TRUTH_REAL = 0;
export const TRUTH_FAKE = 100;

export const FOODFAKE_DATASET_DOI = 'https://doi.org/10.21227/3179-6188';
