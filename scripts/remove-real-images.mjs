#!/usr/bin/env node
/**
 * Delete all real round_content rows (truth_value = 5) and related ai_answers / crowd_stats.
 *
 * Usage:
 *   node --env-file=.env.local scripts/remove-real-images.mjs
 *   node --env-file=.env.local scripts/remove-real-images.mjs --dry-run
 */

import { TRUTH_REAL } from '../data/category-pools/config.mjs';
import { createAdminClient } from './lib/supabaseAdmin.mjs';

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

async function main() {
  const dryRun = Boolean(parseArgs(process.argv)['dry-run']);
  const client = createAdminClient();

  const { data: realRows, error: fetchError } = await client
    .from('round_content')
    .select('id, category_id')
    .eq('truth_value', TRUTH_REAL);

  if (fetchError) throw new Error(`round_content fetch failed: ${fetchError.message}`);

  const ids = (realRows ?? []).map((r) => r.id);
  if (ids.length === 0) {
    console.log('No real images found — nothing to delete.');
    return;
  }

  const byCategory = {};
  for (const row of realRows ?? []) {
    byCategory[row.category_id] = (byCategory[row.category_id] ?? 0) + 1;
  }

  console.log(`Found ${ids.length} real rows:`);
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }

  if (dryRun) {
    console.log('[dry-run] Would delete these rows');
    return;
  }

  await client.from('ai_answers').delete().in('round_content_id', ids);
  await client.from('crowd_stats').delete().in('round_content_id', ids);
  const { error: deleteError } = await client.from('round_content').delete().eq('truth_value', TRUTH_REAL);
  if (deleteError) throw new Error(`round_content delete failed: ${deleteError.message}`);

  console.log(`✔ Deleted ${ids.length} real images`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
