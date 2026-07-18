#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GAME_CATEGORIES, TRUTH_FAKE, TRUTH_REAL } from '../data/category-pools/config.mjs';

const manifest = JSON.parse(readFileSync('data/category-pools/manifest.json', 'utf8'));
const outDir = join('supabase', 'seed-parts', 'split');
mkdirSync(outDir, { recursive: true });

function esc(value) {
  return String(value).replace(/'/g, "''");
}

for (const cat of GAME_CATEGORIES) {
  const pool = manifest.categories[cat.id];
  const del = [
    `delete from public.ai_answers where round_content_id in (select id from public.round_content where category_id = '${cat.id}');`,
    `delete from public.crowd_stats where round_content_id in (select id from public.round_content where category_id = '${cat.id}');`,
    `delete from public.round_content where category_id = '${cat.id}';`,
  ].join('\n');
  writeFileSync(join(outDir, `${cat.id}-delete.sql`), `${del}\n`);

  const realVals = pool.real.map(
    (entry, index) =>
      `  ('${cat.id}-real-${String(index + 1).padStart(3, '0')}', '${cat.id}', '${esc(entry.url)}', ${TRUTH_REAL}, ${index + 1}, true)`,
  );
  writeFileSync(
    join(outDir, `${cat.id}-real.sql`),
    `insert into public.round_content (id, category_id, image_url, truth_value, sort_order, active) values\n${realVals.join(',\n')};\n`,
  );

  const fakeVals = pool.fake.map(
    (entry, index) =>
      `  ('${cat.id}-fake-${String(index + 1).padStart(3, '0')}', '${cat.id}', '${esc(entry.url)}', ${TRUTH_FAKE}, ${50 + index + 1}, true)`,
  );
  writeFileSync(
    join(outDir, `${cat.id}-fake.sql`),
    `insert into public.round_content (id, category_id, image_url, truth_value, sort_order, active) values\n${fakeVals.join(',\n')};\n`,
  );
}

console.log(`Wrote split SQL to ${outDir}`);
