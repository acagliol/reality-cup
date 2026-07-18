/**
 * Sponsor vision models for Builders Cup 2026 (Cursor + Codex).
 * Keep in sync with lib/ai/sponsorModels.ts
 */
export const SPONSOR_AI_MODELS = [
  {
    id: 'codex-gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    version: '2024-08',
    sponsor: 'Codex',
    openrouterModel: 'openai/gpt-4o',
  },
  {
    id: 'cursor-claude-sonnet',
    name: 'Claude Sonnet',
    provider: 'Anthropic',
    version: '4.0',
    sponsor: 'Cursor',
    openrouterModel: 'anthropic/claude-3.5-sonnet',
  },
  {
    id: 'cursor-gemini-flash',
    name: 'Gemini Flash',
    provider: 'Google',
    version: '2.0',
    sponsor: 'Cursor',
    openrouterModel: 'google/gemini-2.0-flash-001',
  },
];

export const MOCK_CATEGORIES = [
  { id: 'cat-nature', sortOrder: 1 },
  { id: 'cat-people', sortOrder: 2 },
  { id: 'cat-animals', sortOrder: 3 },
  { id: 'cat-architecture', sortOrder: 4 },
  { id: 'cat-food', sortOrder: 5 },
];

const IMAGE_POOL = [
  'https://picsum.photos/seed/real1/800/600',
  'https://picsum.photos/seed/real2/800/600',
  'https://picsum.photos/seed/real3/800/600',
  'https://picsum.photos/seed/fake1/800/600',
  'https://picsum.photos/seed/fake2/800/600',
  'https://picsum.photos/seed/fake3/800/600',
  'https://picsum.photos/seed/mix1/800/600',
  'https://picsum.photos/seed/mix2/800/600',
  'https://picsum.photos/seed/mix3/800/600',
  'https://picsum.photos/seed/mix4/800/600',
  'https://picsum.photos/seed/mix5/800/600',
  'https://picsum.photos/seed/mix6/800/600',
];

export function seededValue(seed, min, max) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return Math.round(min + normalized * (max - min));
}

export function buildMockRoundContent() {
  const rounds = [];
  for (const category of MOCK_CATEGORIES) {
    for (let i = 0; i < 12; i++) {
      const id = `${category.id}-round-${i + 1}`;
      rounds.push({
        id,
        category_id: category.id,
        image_url: IMAGE_POOL[(i + category.sortOrder) % IMAGE_POOL.length],
        truth_value: seededValue(id, 5, 95),
        sort_order: i + 1,
        active: true,
      });
    }
  }
  return rounds;
}

export function mockAiAnswer(roundContentId, modelId) {
  return seededValue(`${roundContentId}-${modelId}`, 8, 92);
}

export function getModelById(modelId) {
  return SPONSOR_AI_MODELS.find((m) => m.id === modelId);
}
