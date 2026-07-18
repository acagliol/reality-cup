#!/usr/bin/env node
/**
 * Seed cat-food round_content from FoodFake-30K (IEEE DataPort DOI 10.21227/3179-6188).
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-foodfake.mjs --dataset-path "D:/FoodFake-30K"
 *   node --env-file=.env.local scripts/seed-foodfake.mjs --dataset-path "D:/FoodFake-30K" --per-side 30
 *   node --env-file=.env.local scripts/seed-foodfake.mjs --dataset-path "D:/FoodFake-30K" --upload
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY for uploads + DB writes.
 */

import { createReadStream, existsSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { createAdminClient } from './lib/supabaseAdmin.mjs';
import { mockAiAnswer } from './lib/sponsorModels.mjs';

const FOODFAKE_CATEGORIES = [
  'baklava', 'biryani', 'burger', 'cake_pastry', 'croissant', 'dim_sum',
  'falafel', 'hummus', 'pizza', 'plov', 'ramen', 'salad', 'steak', 'sushi', 'tacos',
];

const TRUTH_REAL = 5;
const TRUTH_FAKE = 95;
const CATEGORY_ID = 'cat-food';
const BUCKET = 'round-images';
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

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

function listImages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()))
    .sort();
}

function pickImages(dir, count) {
  const files = listImages(dir);
  if (files.length === 0) return [];
  if (files.length <= count) return files;
  const step = Math.floor(files.length / count);
  const picked = [];
  for (let i = 0; i < files.length && picked.length < count; i += Math.max(1, step)) {
    picked.push(files[i]);
  }
  return picked.slice(0, count);
}

function resolveDatasetRoot(pathArg) {
  const candidates = [
    pathArg,
    join(pathArg, 'FoodFake-30K'),
    join(pathArg, 'FoodFake-30K', 'FoodFake-30K'),
  ].filter(Boolean);

  for (const root of candidates) {
    if (existsSync(join(root, 'REAL')) && existsSync(join(root, 'FAKE'))) {
      return root;
    }
  }
  return null;
}

function buildSelection(datasetRoot, perSide) {
  const perCategoryReal = Math.max(1, Math.ceil(perSide / FOODFAKE_CATEGORIES.length));
  const realEntries = [];
  const fakeEntries = [];

  for (const foodCat of FOODFAKE_CATEGORIES) {
    const realDir = join(datasetRoot, 'REAL', foodCat);
    const fluxDir = join(datasetRoot, 'FAKE', 'FLUX', foodCat);
    const turboDir = join(datasetRoot, 'FAKE', 'Z_TURBO', foodCat);

    const realFiles = pickImages(realDir, perCategoryReal);
    for (const file of realFiles) {
      realEntries.push({
        foodCategory: foodCat,
        source: 'real',
        localPath: join(realDir, file),
        fileName: file,
      });
    }

    const fluxFiles = pickImages(fluxDir, 1);
    const turboFiles = pickImages(turboDir, 1);
    for (const file of fluxFiles) {
      fakeEntries.push({
        foodCategory: foodCat,
        source: 'flux',
        localPath: join(fluxDir, file),
        fileName: file,
      });
    }
    for (const file of turboFiles) {
      fakeEntries.push({
        foodCategory: foodCat,
        source: 'z_turbo',
        localPath: join(turboDir, file),
        fileName: file,
      });
    }
  }

  const real = realEntries.slice(0, perSide);
  let fake = fakeEntries.slice(0, perSide);

  if (fake.length < perSide) {
    const fluxPool = [];
    for (const foodCat of FOODFAKE_CATEGORIES) {
      const fluxDir = join(datasetRoot, 'FAKE', 'FLUX', foodCat);
      for (const file of pickImages(fluxDir, 2)) {
        fluxPool.push({
          foodCategory: foodCat,
          source: 'flux',
          localPath: join(fluxDir, file),
          fileName: file,
        });
      }
    }
    fake = [...fake, ...fluxPool].slice(0, perSide);
  }

  return { real, fake };
}

async function uploadImage(client, localPath, storagePath) {
  const ext = extname(localPath).toLowerCase();
  const contentType =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  const { error } = await client.storage.from(BUCKET).upload(storagePath, createReadStream(localPath), {
    contentType,
    upsert: true,
  });

  if (error) throw new Error(`Storage upload failed for ${storagePath}: ${error.message}`);
}

function publicUrl(client, storagePath) {
  const { data } = client.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function ensureBucket(client) {
  const { data: buckets } = await client.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await client.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Create bucket failed: ${error.message}`);
  }
}

async function main() {
  const flags = parseArgs(process.argv);
  const datasetPath = flags['dataset-path'] ?? process.env.FOODFAKE_DATASET_PATH;
  const perSide = Number(flags['per-side'] ?? 30);
  const doUpload = Boolean(flags.upload ?? true);
  const dryRun = Boolean(flags['dry-run']);

  if (!datasetPath) {
    console.error(`FoodFake-30K path required.

Download from IEEE DataPort: https://doi.org/10.21227/3179-6188
Extract the zip, then run:

  node --env-file=.env.local scripts/seed-foodfake.mjs --dataset-path "C:/path/to/FoodFake-30K"
`);
    process.exit(1);
  }

  const datasetRoot = resolveDatasetRoot(datasetPath);
  if (!datasetRoot) {
    console.error(`Could not find REAL/ and FAKE/ under: ${datasetPath}`);
    process.exit(1);
  }

  console.log(`Using dataset root: ${datasetRoot}`);
  const { real, fake } = buildSelection(datasetRoot, perSide);

  if (real.length < perSide || fake.length < perSide) {
    console.error(`Not enough images (need ${perSide} real + ${perSide} fake, got ${real.length} + ${fake.length})`);
    process.exit(1);
  }

  console.log(`Selected ${real.length} real + ${fake.length} fake (50-50 split)`);

  const client = dryRun ? null : createAdminClient();
  if (client && doUpload) await ensureBucket(client);

  const rows = [];
  let sortOrder = 1;

  for (const entry of real) {
    const id = `${CATEGORY_ID}-ff-real-${entry.foodCategory}-${basename(entry.fileName, extname(entry.fileName))}`;
    const storagePath = `${CATEGORY_ID}/${id}${extname(entry.fileName).toLowerCase()}`;
    let imageUrl = entry.localPath;

    if (client && doUpload) {
      await uploadImage(client, entry.localPath, storagePath);
      imageUrl = publicUrl(client, storagePath);
    }

    rows.push({
      id,
      category_id: CATEGORY_ID,
      image_url: imageUrl,
      truth_value: TRUTH_REAL,
      sort_order: sortOrder++,
      active: true,
      foodfake_category: entry.foodCategory,
      image_source: 'foodfake-real',
    });
  }

  for (const entry of fake) {
    const id = `${CATEGORY_ID}-ff-fake-${entry.source}-${entry.foodCategory}-${basename(entry.fileName, extname(entry.fileName))}`;
    const storagePath = `${CATEGORY_ID}/${id}${extname(entry.fileName).toLowerCase()}`;
    let imageUrl = entry.localPath;

    if (client && doUpload) {
      await uploadImage(client, entry.localPath, storagePath);
      imageUrl = publicUrl(client, storagePath);
    }

    rows.push({
      id,
      category_id: CATEGORY_ID,
      image_url: imageUrl,
      truth_value: TRUTH_FAKE,
      sort_order: sortOrder++,
      active: true,
      foodfake_category: entry.foodCategory,
      image_source: `foodfake-${entry.source}`,
    });
  }

  if (dryRun) {
    console.log(`[dry-run] Would upsert ${rows.length} round_content rows`);
    console.log(`Real: ${rows.filter((r) => r.truth_value === TRUTH_REAL).length}, Fake: ${rows.filter((r) => r.truth_value === TRUTH_FAKE).length}`);
    return;
  }

  const oldIds = (
    await client.from('round_content').select('id').eq('category_id', CATEGORY_ID)
  ).data?.map((r) => r.id) ?? [];

  if (oldIds.length) {
    await client.from('ai_answers').delete().in('round_content_id', oldIds);
    await client.from('crowd_stats').delete().in('round_content_id', oldIds);
    await client.from('round_content').delete().eq('category_id', CATEGORY_ID);
  }

  const { error: insertError } = await client.from('round_content').insert(rows);
  if (insertError) throw new Error(`round_content insert failed: ${insertError.message}`);

  for (const row of rows) {
    for (const modelId of ['codex-gpt-4o', 'cursor-claude-sonnet', 'cursor-gemini-flash']) {
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

  console.log(`✔ Seeded ${rows.length} FoodFake food images (${perSide} real + ${perSide} fake)`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
