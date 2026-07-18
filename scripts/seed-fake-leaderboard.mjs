#!/usr/bin/env node
/**
 * Seed fake profiles + completed games for leaderboard population.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-fake-leaderboard.mjs
 *   node --env-file=.env.local scripts/seed-fake-leaderboard.mjs --count 30
 *   node --env-file=.env.local scripts/seed-fake-leaderboard.mjs --clear
 */

import { randomUUID } from 'node:crypto';
import { createAdminClient } from './lib/supabaseAdmin.mjs';

const ADJECTIVES = [
  'Pixel', 'Neon', 'Turbo', 'Cosmic', 'Shadow', 'Golden', 'Swift', 'Lucky',
  'Mystic', 'Cyber', 'Wild', 'Silent', 'Blazing', 'Frozen', 'Electric', 'Royal',
  'Stealth', 'Quantum', 'Rogue', 'Hyper', 'Nova', 'Iron', 'Crimson', 'Azure',
];

const NOUNS = [
  'Hawk', 'Wolf', 'Panda', 'Fox', 'Tiger', 'Otter', 'Raven', 'Phoenix',
  'Viper', 'Shark', 'Eagle', 'Dragon', 'Comet', 'Specter', 'Nomad', 'Pilot',
  'Scout', 'Knight', 'Sage', 'Ranger', 'Glitch', 'Pixel', 'Cipher', 'Oracle',
];

const SUFFIXES = ['', '42', '99', '007', 'X', 'Pro', 'Jr', ''];

function parseArgs(argv) {
  const args = { count: 25, clear: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--count' && argv[i + 1]) {
      args.count = Math.max(1, Number.parseInt(argv[i + 1], 10) || 25);
      i += 1;
    } else if (argv[i] === '--clear') {
      args.clear = true;
    }
  }
  return args;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateDisplayName(usedNames) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const suffix = pick(SUFFIXES);
    const name = `${pick(ADJECTIVES)}${pick(NOUNS)}${suffix}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  const fallback = `Player${randomUUID().slice(0, 6)}`;
  usedNames.add(fallback);
  return fallback;
}

function randomScore() {
  const roll = Math.random();
  if (roll < 0.15) return Math.floor(Math.random() * 151) + 850; // elite
  if (roll < 0.45) return Math.floor(Math.random() * 201) + 650; // strong
  if (roll < 0.75) return Math.floor(Math.random() * 201) + 450; // mid
  return Math.floor(Math.random() * 251) + 150; // casual
}

function randomPastDate(maxDaysAgo = 14) {
  const msAgo = Math.floor(Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000);
  return new Date(Date.now() - msAgo);
}

async function fetchActiveCategories(client) {
  const { data, error } = await client
    .from('categories')
    .select('id, name')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`categories fetch failed: ${error.message}`);
  if (!data?.length) throw new Error('No active categories found — run supabase/seed.sql first');
  return data;
}

async function clearSeedData(client) {
  const { data: seedProfiles, error: profileError } = await client
    .from('profiles')
    .select('id')
    .like('device_id', 'seed_%');

  if (profileError) throw new Error(`seed profile lookup failed: ${profileError.message}`);
  if (!seedProfiles?.length) {
    console.log('No seed profiles to clear.');
    return;
  }

  const profileIds = seedProfiles.map((p) => p.id);
  const { error: gamesError } = await client.from('games').delete().in('profile_id', profileIds);
  if (gamesError) throw new Error(`seed games delete failed: ${gamesError.message}`);

  const { error: deleteProfilesError } = await client.from('profiles').delete().in('id', profileIds);
  if (deleteProfilesError) {
    throw new Error(`seed profiles delete failed: ${deleteProfilesError.message}`);
  }

  console.log(`Cleared ${profileIds.length} seed profiles and their games.`);
}

async function main() {
  const { count, clear } = parseArgs(process.argv);
  const client = createAdminClient();

  if (clear) {
    await clearSeedData(client);
    if (count === 0) return;
  }

  const categories = await fetchActiveCategories(client);
  const usedNames = new Set();
  const profiles = [];
  const games = [];

  for (let i = 0; i < count; i += 1) {
    const profileId = randomUUID();
    const displayName = generateDisplayName(usedNames);
    profiles.push({
      id: profileId,
      device_id: `seed_${randomUUID()}`,
      display_name: displayName,
    });

    const gamesForUser = Math.floor(Math.random() * categories.length) + 1;
    const shuffled = [...categories].sort(() => Math.random() - 0.5).slice(0, gamesForUser);

    for (const category of shuffled) {
      const startedAt = randomPastDate();
      const completedAt = new Date(startedAt.getTime() + (8 + Math.floor(Math.random() * 7)) * 60 * 1000);
      games.push({
        id: `seed_game_${randomUUID()}`,
        profile_id: profileId,
        category_id: category.id,
        status: 'completed',
        total_score: randomScore(),
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
      });
    }
  }

  const { error: profileInsertError } = await client.from('profiles').insert(profiles);
  if (profileInsertError) throw new Error(`profiles insert failed: ${profileInsertError.message}`);

  const { error: gamesInsertError } = await client.from('games').insert(games);
  if (gamesInsertError) throw new Error(`games insert failed: ${gamesInsertError.message}`);

  console.log(`Seeded ${profiles.length} fake users with ${games.length} completed games.`);
  console.log(`Categories covered: ${categories.map((c) => c.name).join(', ')}`);
  console.log('Sample players:', profiles.slice(0, 5).map((p) => p.display_name).join(', '));
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
