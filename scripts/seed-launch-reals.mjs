#!/usr/bin/env node
/**
 * Upload real World Cup player images from fifa_player_images.zip to Supabase.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-launch-reals.mjs --zip-path "C:/Users/anayp/Downloads/fifa_player_images.zip"
 *   node --env-file=.env.local scripts/seed-launch-reals.mjs --zip-path "..." --count 50 --dry-run
 */

import { execSync } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { GAME_CATEGORIES, TRUTH_REAL } from '../data/category-pools/config.mjs';
import { createAdminClient } from './lib/supabaseAdmin.mjs';
import { mockAiAnswer } from './lib/sponsorModels.mjs';

const BUCKET = 'round-images';
const CATEGORY_ID = 'cat-world-cup';
const MODEL_IDS = ['codex-gpt-4o', 'cursor-claude-sonnet', 'cursor-gemini-flash'];
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
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function extractZip(zipPath) {
  const dest = mkdtempSync(join(tmpdir(), 'launch-reals-'));
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force"`,
    { stdio: 'inherit' },
  );
  return dest;
}

function resolveImageDir(extractRoot) {
  const nested = join(extractRoot, 'world_cup');
  if (existsSync(nested) && listImages(nested).length > 0) return nested;
  if (listImages(extractRoot).length > 0) return extractRoot;
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

async function deleteExistingReals(client) {
  const { data: existing, error } = await client
    .from('round_content')
    .select('id, image_url')
    .eq('category_id', CATEGORY_ID)
    .eq('truth_value', TRUTH_REAL);

  if (error) throw new Error(`round_content fetch failed: ${error.message}`);
  const oldIds = (existing ?? []).map((row) => row.id);
  if (!oldIds.length) return 0;

  await client.from('ai_answers').delete().in('round_content_id', oldIds);
  await client.from('crowd_stats').delete().in('round_content_id', oldIds);
  await client.from('round_content').delete().in('id', oldIds);

  const storagePaths = (existing ?? [])
    .map((row) => {
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const idx = row.image_url.indexOf(marker);
      return idx >= 0 ? row.image_url.slice(idx + marker.length) : null;
    })
    .filter(Boolean);

  if (storagePaths.length) {
    await client.storage.from(BUCKET).remove(storagePaths);
  }

  return oldIds.length;
}

async function main() {
  const flags = parseArgs(process.argv);
  const zipPath = flags['zip-path'] ?? process.env.FIFA_REALS_ZIP;
  const count = Number(flags.count ?? 50);
  const dryRun = Boolean(flags['dry-run']);

  if (!zipPath || !existsSync(zipPath)) {
    console.error(`Zip path required and must exist.

  node --env-file=.env.local scripts/seed-launch-reals.mjs --zip-path "C:/Users/anayp/Downloads/fifa_player_images.zip"
`);
    process.exit(1);
  }

  console.log(`Extracting ${zipPath}…`);
  const extractRoot = extractZip(zipPath);

  try {
    const imageDir = resolveImageDir(extractRoot);
    if (!imageDir) throw new Error('No images found in zip');

    const files = listImages(imageDir);
    const selected = files.slice(0, count);
    if (selected.length < count) {
      throw new Error(`Need ${count} images, found ${selected.length}`);
    }

    console.log(`${CATEGORY_ID}: ${selected.length} real images`);

    if (dryRun) {
      console.log('[dry-run] Would upload real World Cup images');
      return;
    }

    const client = createAdminClient();
    await ensureBucket(client);

    const category = GAME_CATEGORIES.find((c) => c.id === CATEGORY_ID);
    if (!category) throw new Error(`Missing category config for ${CATEGORY_ID}`);

    const { error: catError } = await client.from('categories').upsert(
      {
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        sort_order: category.sortOrder,
        active: true,
      },
      { onConflict: 'id' },
    );
    if (catError) throw new Error(`categories upsert failed: ${catError.message}`);

    const removed = await deleteExistingReals(client);
    console.log(`  removed ${removed} old real rows`);

    let sortOrder = 1;
    const rows = [];

    for (let i = 0; i < selected.length; i++) {
      const fileName = selected[i];
      const localPath = join(imageDir, fileName);
      const stem = basename(fileName, extname(fileName));
      const id = `${CATEGORY_ID}-real-${String(i + 1).padStart(3, '0')}`;
      const storagePath = `${CATEGORY_ID}/${id}-${stem}${extname(fileName).toLowerCase()}`;

      await uploadImage(client, localPath, storagePath);
      const imageUrl = publicUrl(client, storagePath);

      rows.push({
        id,
        category_id: CATEGORY_ID,
        image_url: imageUrl,
        truth_value: TRUTH_REAL,
        sort_order: sortOrder++,
        active: true,
        image_source: 'fifa-players',
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

    console.log(`✔ Seeded ${rows.length} real World Cup images`);
  } finally {
    rmSync(extractRoot, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
