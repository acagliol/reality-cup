#!/usr/bin/env node
/**
 * Seed Supabase categories + round_content from data/category-pools/manifest.json
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-category-pools.mjs
 *   node --env-file=.env.local scripts/seed-category-pools.mjs --dry-run
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. Run build-category-pools.mjs first.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GAME_CATEGORIES,
  LEGACY_CATEGORY_IDS,
  TRUTH_FAKE,
  TRUTH_REAL,
} from '../data/category-pools/config.mjs';
import { createAdminClient } from './lib/supabaseAdmin.mjs';
import { mockAiAnswer } from './lib/sponsorModels.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, '..', 'data', 'category-pools', 'manifest.json');
const MODEL_IDS = ['codex-gpt-4o', 'cursor-claude-sonnet', 'cursor-gemini-flash'];

function parseArgs(argv) {
  const flags = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing ${MANIFEST_PATH} — run: node scripts/build-category-pools.mjs`);
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

function buildRows(manifest, categories) {
  const rows = [];

  for (const category of categories) {
    const pool = manifest.categories[category.id];
    if (!pool) throw new Error(`Manifest missing category ${category.id}`);

    let sortOrder = 1;

    pool.real.forEach((entry, index) => {
      rows.push({
        id: `${category.id}-real-${String(index + 1).padStart(3, '0')}`,
        category_id: category.id,
        image_url: entry.url,
        truth_value: TRUTH_REAL,
        sort_order: sortOrder++,
        active: true,
      });
    });

    pool.fake.forEach((entry, index) => {
      rows.push({
        id: `${category.id}-fake-${String(index + 1).padStart(3, '0')}`,
        category_id: category.id,
        image_url: entry.url,
        truth_value: TRUTH_FAKE,
        sort_order: sortOrder++,
        active: true,
      });
    });
  }

  return rows;
}

async function main() {
  const flags = parseArgs(process.argv);
  const dryRun = Boolean(flags['dry-run']);
  const categoryFilter = flags.category
    ? flags.category.split(',').map((s) => s.trim()).filter(Boolean)
    : null;
  const categories = categoryFilter
    ? GAME_CATEGORIES.filter((c) => categoryFilter.includes(c.id))
    : GAME_CATEGORIES;

  if (categoryFilter && categories.length === 0) {
    throw new Error(`Unknown category id(s): ${categoryFilter.join(', ')}`);
  }

  const manifest = loadManifest();
  const rows = buildRows(manifest, categories);

  const realCount = rows.filter((r) => r.truth_value === TRUTH_REAL).length;
  const fakeCount = rows.filter((r) => r.truth_value === TRUTH_FAKE).length;
  console.log(`Loaded manifest (${manifest.generatedAt}): ${rows.length} rows (${realCount} real, ${fakeCount} fake)`);

  if (dryRun) {
    console.log('[dry-run] Would upsert categories and replace round_content');
    return;
  }

  const client = createAdminClient();

  await client
    .from('categories')
    .update({ active: false })
    .in('id', LEGACY_CATEGORY_IDS);

  const categoryRows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: c.icon,
    sort_order: c.sortOrder,
    active: true,
  }));

  const { error: catError } = await client.from('categories').upsert(categoryRows, { onConflict: 'id' });
  if (catError) throw new Error(`categories upsert failed: ${catError.message}`);

  for (const category of categories) {
    const oldIds =
      (await client.from('round_content').select('id').eq('category_id', category.id)).data?.map(
        (r) => r.id,
      ) ?? [];

    if (oldIds.length) {
      await client.from('ai_answers').delete().in('round_content_id', oldIds);
      await client.from('crowd_stats').delete().in('round_content_id', oldIds);
      await client.from('round_content').delete().eq('category_id', category.id);
    }
  }

  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await client.from('round_content').insert(batch);
    if (error) throw new Error(`round_content insert failed: ${error.message}`);
    process.stdout.write(`  inserted ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`);
  }
  console.log(`\n✔ Inserted ${rows.length} round_content rows`);

  console.log('Seeding placeholder AI answers (run npm run ai:score-live to replace)…');
  for (const row of rows) {
    for (const modelId of MODEL_IDS) {
      await client.from('ai_answers').upsert(
        {
          round_content_id: row.id,
          ai_model_id: modelId,
          answer_value: mockAiAnswer(row.id, modelId),
        },
        { onConflict: 'round_content_id,ai_model_id' },
      );
    }
  }

  console.log('✔ Category pools seeded — ready for ai:score-live');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
