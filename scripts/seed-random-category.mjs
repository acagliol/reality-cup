#!/usr/bin/env node
/**
 * Upsert the virtual Random Mix category (no round_content rows — aggregated at runtime).
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-random-category.mjs
 */

import { RANDOM_CATEGORY } from '../data/category-pools/config.mjs';
import { createAdminClient } from './lib/supabaseAdmin.mjs';

async function main() {
  const client = createAdminClient();

  const { error } = await client.from('categories').upsert(
    {
      id: RANDOM_CATEGORY.id,
      name: RANDOM_CATEGORY.name,
      description: RANDOM_CATEGORY.description,
      icon: RANDOM_CATEGORY.icon,
      sort_order: RANDOM_CATEGORY.sortOrder,
      active: true,
    },
    { onConflict: 'id' },
  );

  if (error) throw new Error(`categories upsert failed: ${error.message}`);
  console.log(`✔ Upserted category ${RANDOM_CATEGORY.id} (${RANDOM_CATEGORY.name})`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
