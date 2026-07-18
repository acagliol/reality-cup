#!/usr/bin/env node
/**
 * Score images with sponsor AI models and persist to Supabase ai_answers.
 *
 * Usage:
 *   node --env-file=.env.local scripts/score-ai-answers.mjs seed-models
 *   node --env-file=.env.local scripts/score-ai-answers.mjs seed-content [--category cat-nature]
 *   node --env-file=.env.local scripts/score-ai-answers.mjs score --mock [--category cat-nature] [--force]
 *   node --env-file=.env.local scripts/score-ai-answers.mjs score --live [--category cat-nature] [--model codex-gpt-4o]
 *
 * Env:
 *   EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — required for DB writes
 *   OPENROUTER_API_KEY — required for --live scoring
 */

import { scoreImageWithOpenRouter } from './lib/aiScoring.mjs';
import {
  SPONSOR_AI_MODELS,
  buildMockRoundContent,
  getModelById,
  mockAiAnswer,
} from './lib/sponsorModels.mjs';
import {
  createAdminClient,
  fetchExistingAnswers,
  fetchRoundContent,
  upsertAiAnswer,
  upsertAiModels,
  upsertRoundContent,
} from './lib/supabaseAdmin.mjs';

function parseArgs(argv) {
  const args = { command: argv[2], flags: {} };
  for (let i = 3; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args.flags[key] = next;
        i++;
      } else {
        args.flags[key] = true;
      }
    }
  }
  return args;
}

function printHelp() {
  console.log(`Real or Fake — AI scoring pipeline

Commands:
  seed-models                 Upsert 3 sponsor models into ai_models
  seed-content                Upsert placeholder round_content (Picsum URLs)
  score --mock                Deterministic scores (no API, no images needed)
  score --live                Call OpenRouter vision models on image URLs

Flags:
  --category <id>             e.g. cat-nature (default: all categories)
  --round-content-id <id>     Score a single image row
  --model <id>                One model id (default: all 3 sponsors)
  --limit <n>                 Max images to process
  --force                     Re-score even if ai_answers already exist
  --dry-run                   Print actions without writing to DB
`);
}

async function main() {
  const args = parseArgs(process.argv);
  const command = args.command;

  if (!command || command === 'help' || args.flags.help) {
    printHelp();
    return;
  }

  const dryRun = Boolean(args.flags['dry-run']);
  const client = dryRun ? null : createAdminClient();

  if (command === 'seed-models') {
    if (dryRun) {
      console.log('[dry-run] Would upsert models:', SPONSOR_AI_MODELS.map((m) => m.id).join(', '));
      return;
    }
    const count = await upsertAiModels(client, SPONSOR_AI_MODELS);
    console.log(`✔ Upserted ${count} sponsor models`);
    return;
  }

  if (command === 'seed-content') {
    let rounds = buildMockRoundContent();
    if (args.flags.category) {
      rounds = rounds.filter((r) => r.category_id === args.flags.category);
    }
    if (dryRun) {
      console.log(`[dry-run] Would upsert ${rounds.length} round_content rows`);
      return;
    }
    const count = await upsertRoundContent(client, rounds);
    console.log(`✔ Upserted ${count} round_content rows`);
    return;
  }

  if (command === 'score') {
    const useMock = Boolean(args.flags.mock);
    const useLive = Boolean(args.flags.live);
    if (!useMock && !useLive) {
      console.error('Use --mock (no API) or --live (OpenRouter vision).');
      process.exit(1);
    }

    if (useLive && !process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is required for --live scoring.');
      process.exit(1);
    }

    const modelFilter = args.flags.model ? [args.flags.model] : SPONSOR_AI_MODELS.map((m) => m.id);
    const models = modelFilter.map((id) => {
      const model = getModelById(id);
      if (!model) throw new Error(`Unknown model id: ${id}`);
      return model;
    });

    let rounds = await fetchRoundContent(client ?? createAdminClient(), {
      categoryId: args.flags.category,
      roundContentId: args.flags['round-content-id'],
      limit: args.flags.limit ? Number(args.flags.limit) : undefined,
    });

    if (rounds.length === 0) {
      console.log('No round_content rows found. Run: seed-content');
      return;
    }

    const force = Boolean(args.flags.force);
    const existing = force
      ? new Set()
      : await fetchExistingAnswers(
          client ?? createAdminClient(),
          rounds.map((r) => r.id),
          models.map((m) => m.id),
        );

    let scored = 0;
    let skipped = 0;

    for (const round of rounds) {
      for (const model of models) {
        const key = `${round.id}:${model.id}`;
        if (existing.has(key)) {
          skipped++;
          continue;
        }

        let answerValue;
        if (useMock) {
          answerValue = mockAiAnswer(round.id, model.id);
        } else {
          console.log(`Scoring ${round.id} with ${model.name} (${model.openrouterModel})…`);
          answerValue = await scoreImageWithOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
            openrouterModel: model.openrouterModel,
            imageUrl: round.image_url,
          });
        }

        if (dryRun) {
          console.log(`[dry-run] ${round.id} / ${model.id} → ${answerValue}`);
        } else {
          await upsertAiAnswer(client, round.id, model.id, answerValue);
          console.log(`✔ ${round.id} / ${model.id} → ${answerValue}`);
        }
        scored++;
      }
    }

    console.log(`Done. Scored ${scored}, skipped ${skipped} existing.`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
