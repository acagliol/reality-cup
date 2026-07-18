#!/usr/bin/env node
/**
 * Upsert category names/icons/descriptions from config (no round_content changes).
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-category-descriptions.mjs
 */

import { GAME_CATEGORIES, RANDOM_CATEGORY } from '../data/category-pools/config.mjs';
import { createAdminClient } from './lib/supabaseAdmin.mjs';

async function main() {
  const client = createAdminClient();
  const rows = [RANDOM_CATEGORY, ...GAME_CATEGORIES].map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    icon: c.icon,
    sort_order: c.sortOrder,
    active: true,
  }));

  const { error } = await client.from('categories').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`categories upsert failed: ${error.message}`);

  console.log(`✔ Updated descriptions for ${rows.length} categories`);
  for (const row of rows) {
    console.log(`  ${row.id}: ${row.description.slice(0, 60)}…`);
  }
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
