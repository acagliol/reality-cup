#!/usr/bin/env node
/**
 * Upload curated fake images from all_images.zip to Supabase Storage and
 * replace Pollinations fake round_content rows (keeps real rows intact).
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-launch-fakes.mjs --zip-path "C:/Users/anayp/Downloads/all_images.zip"
 *   node --env-file=.env.local scripts/seed-launch-fakes.mjs --zip-path "..." --dry-run
 */

import { execSync } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { TRUTH_FAKE } from '../data/category-pools/config.mjs';
import { createAdminClient } from './lib/supabaseAdmin.mjs';
import { mockAiAnswer } from './lib/sponsorModels.mjs';

const BUCKET = 'round-images';
const MODEL_IDS = ['codex-gpt-4o', 'cursor-claude-sonnet', 'cursor-gemini-flash'];
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const FAKE_FOLDERS = [
  { zipFolder: 'world_cup', categoryId: 'cat-world-cup' },
  { zipFolder: 'nyc_core', categoryId: 'cat-nyc-core' },
  { zipFolder: 'brain_rot', categoryId: 'cat-brain-rot' },
];

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
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function extractZip(zipPath) {
  const dest = mkdtempSync(join(tmpdir(), 'launch-fakes-'));
  const escapedZip = zipPath.replace(/'/g, "''");
  const escapedDest = dest.replace(/'/g, "''");
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedDest}' -Force"`,
    { stdio: 'inherit' },
  );
  return dest;
}

function resolveFakeDir(extractRoot, zipFolder) {
  const candidates = [
    join(extractRoot, 'FAKE', zipFolder),
    join(extractRoot, 'Fake', zipFolder),
    join(extractRoot, zipFolder),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return null;
}

async function ensureBucket(client) {
  const { data: buckets } = await client.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await client.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Create bucket failed: ${error.message}`);
  }
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

async function deleteFakeRows(client, categoryId) {
  const { data: fakeRows, error: fetchError } = await client
    .from('round_content')
    .select('id')
    .eq('category_id', categoryId)
    .eq('truth_value', TRUTH_FAKE);

  if (fetchError) throw new Error(`round_content fetch failed: ${fetchError.message}`);

  const fakeIds = (fakeRows ?? []).map((r) => r.id);
  if (fakeIds.length === 0) return 0;

  await client.from('ai_answers').delete().in('round_content_id', fakeIds);
  await client.from('crowd_stats').delete().in('round_content_id', fakeIds);

  const { error: deleteError } = await client
    .from('round_content')
    .delete()
    .eq('category_id', categoryId)
    .eq('truth_value', TRUTH_FAKE);

  if (deleteError) throw new Error(`round_content delete failed: ${deleteError.message}`);
  return fakeIds.length;
}

async function maxRealSortOrder(client, categoryId) {
  const { data, error } = await client
    .from('round_content')
    .select('sort_order')
    .eq('category_id', categoryId)
    .eq('truth_value', 5)
    .order('sort_order', { ascending: false })
    .limit(1);

  if (error) throw new Error(`sort_order fetch failed: ${error.message}`);
  return data?.[0]?.sort_order ?? 0;
}

async function seedCategoryFakes(client, { categoryId, zipFolder, extractRoot, perSide, dryRun }) {
  const fakeDir = resolveFakeDir(extractRoot, zipFolder);
  if (!fakeDir) throw new Error(`Missing FAKE/${zipFolder} in zip`);

  const files = listImages(fakeDir);
  if (files.length === 0) throw new Error(`No images in FAKE/${zipFolder}`);

  const selected = files.slice(0, perSide ?? files.length);
  console.log(`  ${categoryId}: ${selected.length} fake images from ${zipFolder}`);

  if (dryRun) return selected.length;

  const removed = await deleteFakeRows(client, categoryId);
  console.log(`  removed ${removed} old fake rows`);

  let sortOrder = (await maxRealSortOrder(client, categoryId)) + 1;
  const rows = [];

  for (let i = 0; i < selected.length; i++) {
    const fileName = selected[i];
    const localPath = join(fakeDir, fileName);
    const stem = basename(fileName, extname(fileName));
    const id = `${categoryId}-fake-${String(i + 1).padStart(3, '0')}`;
    const storagePath = `${categoryId}/${id}-${stem}${extname(fileName).toLowerCase()}`;

    await uploadImage(client, localPath, storagePath);
    const imageUrl = publicUrl(client, storagePath);

    rows.push({
      id,
      category_id: categoryId,
      image_url: imageUrl,
      truth_value: TRUTH_FAKE,
      sort_order: sortOrder++,
      active: true,
    });

    process.stdout.write(`  uploaded ${i + 1}/${selected.length}\r`);
  }
  console.log('');

  const { error: insertError } = await client.from('round_content').insert(rows);
  if (insertError) throw new Error(`round_content insert failed: ${insertError.message}`);

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

  return rows.length;
}

async function main() {
  const flags = parseArgs(process.argv);
  const zipPath = flags['zip-path'] ?? process.env.LAUNCH_FAKES_ZIP;
  const dryRun = Boolean(flags['dry-run']);
  const perSide = flags['per-side'] ? Number(flags['per-side']) : 50;

  if (!zipPath || !existsSync(zipPath)) {
    console.error(`Zip path required and must exist.

  node --env-file=.env.local scripts/seed-launch-fakes.mjs --zip-path "C:/Users/anayp/Downloads/all_images.zip"
`);
    process.exit(1);
  }

  console.log(`Extracting ${zipPath}…`);
  const extractRoot = extractZip(zipPath);

  try {
    const client = dryRun ? null : createAdminClient();
    if (client) await ensureBucket(client);

    let total = 0;
    for (const entry of FAKE_FOLDERS) {
      console.log(`Processing ${entry.categoryId}…`);
      total += await seedCategoryFakes(client, {
        ...entry,
        extractRoot,
        perSide,
        dryRun,
      });
    }

    console.log(dryRun ? `[dry-run] Would seed ${total} fake images` : `✔ Seeded ${total} fake images to Supabase Storage`);
  } finally {
    rmSync(extractRoot, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
