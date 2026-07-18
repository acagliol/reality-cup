#!/usr/bin/env node
/**
 * Seed cat-nyc-core REAL images from Hugging Face opensporks/streetview-nyc.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-streetview-nyc.mjs
 *   node --env-file=.env.local scripts/seed-streetview-nyc.mjs --count 50
 *   node --env-file=.env.local scripts/seed-streetview-nyc.mjs --dry-run
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY.
 */

import { GAME_CATEGORIES, TRUTH_REAL } from '../data/category-pools/config.mjs';
import { createAdminClient } from './lib/supabaseAdmin.mjs';
import { mockAiAnswer } from './lib/sponsorModels.mjs';

const HF_DATASET = 'opensporks/streetview-nyc';
const HF_CONFIG = 'default';
const HF_SPLIT = 'train';
const CATEGORY_ID = 'cat-nyc-core';
const BUCKET = 'round-images';
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


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRows(offset, length, attempt = 0) {
  const params = new URLSearchParams({
    dataset: HF_DATASET,
    config: HF_CONFIG,
    split: HF_SPLIT,
    offset: String(offset),
    length: String(length),
  });

  const res = await fetch(`https://datasets-server.huggingface.co/rows?${params}`);
  if (res.status === 429 && attempt < 6) {
    await sleep(1500 * (attempt + 1));
    return fetchRows(offset, length, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Hugging Face rows API ${res.status} at offset ${offset}`);
  }

  const json = await res.json();
  return (json.rows ?? []).map((entry, index) => {
    const row = entry.row;
    if (!row?.image?.src) {
      throw new Error(`Missing image at offset ${offset + index}`);
    }
    return {
      offset: offset + index,
      latitude: row.latitude,
      longitude: row.longitude,
      heading: row.heading,
      imageUrl: row.image.src,
    };
  });
}

async function fetchSamples(total, count) {
  const batchCount = Math.min(5, count);
  const perBatch = Math.ceil(count / batchCount);
  const step = Math.max(1, Math.floor((total - perBatch) / Math.max(batchCount - 1, 1)));
  const samples = [];

  for (let batch = 0; batch < batchCount && samples.length < count; batch++) {
    const offset = Math.min(batch * step, Math.max(0, total - perBatch));
    const rows = await fetchRows(offset, Math.min(perBatch, total - offset));
    samples.push(...rows);
    process.stdout.write(`  fetched batch ${batch + 1}/${batchCount} (${samples.length} rows)\r`);
    if (batch < batchCount - 1) await sleep(400);
  }

  return samples.slice(0, count);
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Image download failed (${res.status}): ${url.slice(0, 120)}…`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function ensureBucket(client) {
  const { data: buckets } = await client.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await client.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Create bucket failed: ${error.message}`);
  }
}

function publicUrl(client, storagePath) {
  const { data } = client.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function uploadBuffer(client, buffer, storagePath) {
  const { error } = await client.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(`Storage upload failed for ${storagePath}: ${error.message}`);
}

async function deleteExistingReals(client) {
  const { data: existing, error } = await client
    .from('round_content')
    .select('id, image_url')
    .eq('category_id', CATEGORY_ID)
    .eq('truth_value', TRUTH_REAL);

  if (error) throw new Error(`round_content fetch failed: ${error.message}`);
  const oldIds = (existing ?? []).map((row) => row.id);
  if (!oldIds.length) return;

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
}

async function main() {
  const flags = parseArgs(process.argv);
  const count = Number(flags.count ?? 50);
  const dryRun = Boolean(flags['dry-run']);

  if (!Number.isFinite(count) || count < 1) {
    throw new Error('--count must be a positive number');
  }

  const metaRes = await fetch(
    `https://datasets-server.huggingface.co/info?dataset=${encodeURIComponent(HF_DATASET)}`,
  );
  if (!metaRes.ok) throw new Error(`Hugging Face info API ${metaRes.status}`);
  const meta = await metaRes.json();
  const total =
    meta.dataset_info?.[HF_CONFIG]?.splits?.[HF_SPLIT]?.num_examples ??
    meta.dataset_info?.default?.splits?.train?.num_examples;

  if (!total) throw new Error('Could not determine streetview-nyc row count');

  console.log(`Sampling ${count} images from ${HF_DATASET} (${total.toLocaleString()} rows)`);

  const samples = await fetchSamples(total, count);
  console.log(`\nFetched ${samples.length} street-view samples`);

  if (dryRun) {
    console.log('[dry-run] First sample:', {
      offset: samples[0].offset,
      latitude: samples[0].latitude,
      longitude: samples[0].longitude,
      heading: samples[0].heading,
    });
    console.log(`[dry-run] Would upload ${samples.length} real images to Supabase`);
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

  await deleteExistingReals(client);

  const { data: sortRows } = await client
    .from('round_content')
    .select('sort_order')
    .eq('category_id', CATEGORY_ID)
    .order('sort_order', { ascending: false })
    .limit(1);

  let sortOrder = (sortRows?.[0]?.sort_order ?? 0) + 1;
  const rows = [];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const id = `${CATEGORY_ID}-sv-real-${String(i + 1).padStart(3, '0')}`;
    const storagePath = `${CATEGORY_ID}/${id}.jpg`;

    const buffer = await downloadImage(sample.imageUrl);
    await uploadBuffer(client, buffer, storagePath);
    const imageUrl = publicUrl(client, storagePath);

    rows.push({
      id,
      category_id: CATEGORY_ID,
      image_url: imageUrl,
      truth_value: TRUTH_REAL,
      sort_order: sortOrder++,
      active: true,
      image_source: 'streetview-nyc',
    });

    process.stdout.write(`  uploaded ${i + 1}/${samples.length}\r`);
  }
  console.log(`\nUploaded ${rows.length} images to ${BUCKET}`);

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

  console.log(`✔ Seeded ${rows.length} NYC real street-view images into ${CATEGORY_ID}`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
