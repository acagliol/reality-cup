import type { AiModel } from '../../types/game';

/**
 * Three vision models aligned with Builders Cup 2026 sponsors
 * (Cursor, Codex — see https://luma.com/nrletiv9).
 *
 * API routing lives in scripts/score-ai-answers.mjs (server-side only).
 */
export const SPONSOR_AI_MODELS: AiModel[] = [
  {
    id: 'codex-gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    version: '2024-08',
    sponsor: 'Codex',
  },
  {
    id: 'cursor-claude-sonnet',
    name: 'Claude Sonnet',
    provider: 'Anthropic',
    version: '4.0',
    sponsor: 'Cursor',
  },
  {
    id: 'cursor-gemini-flash',
    name: 'Gemini Flash',
    provider: 'Google',
    version: '2.0',
    sponsor: 'Cursor',
  },
];

export function getSponsorModelById(id: string): AiModel | undefined {
  return SPONSOR_AI_MODELS.find((m) => m.id === id);
}

export function formatModelSubtitle(model: AiModel): string {
  const parts = [model.provider, `v${model.version}`];
  if (model.sponsor) parts.unshift(model.sponsor);
  return parts.join(' · ');
}
