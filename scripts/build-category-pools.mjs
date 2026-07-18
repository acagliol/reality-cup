#!/usr/bin/env node
/**
 * Build 50 real + 50 fake image URLs per game category.
 *
 * Real  → Wikimedia Commons (stable thumb URLs, free license)
 * Fake  → Pollinations.ai (seeded AI prompts, themed per category)
 *
 * Usage:
 *   node scripts/build-category-pools.mjs
 *   node scripts/build-category-pools.mjs --per-side 50
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURATED_REAL } from '../data/category-pools/curated-real.mjs';
import { GAME_CATEGORIES, PER_SIDE as DEFAULT_PER_SIDE } from '../data/category-pools/config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'data', 'category-pools');
const OUT_FILE = join(OUT_DIR, 'manifest.json');

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

async function wikiSearch(query, { offset = 0, limit = 50, attempt = 0 } = {}) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    gsroffset: String(offset),
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '800',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': 'ramphackathon/1.0 (hackathon demo; contact: local)' },
  });
  if (res.status === 429 && attempt < 6) {
    await sleep(1500 * (attempt + 1));
    return wikiSearch(query, { offset, limit, attempt: attempt + 1 });
  }
  if (!res.ok) throw new Error(`Wikimedia API ${res.status} for "${query}"`);

  const json = await res.json();
  const pages = Object.values(json.query?.pages ?? {});

  return pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl) return null;
      const mime = info.mime ?? '';
      if (!/^image\/(jpeg|png|webp)$/i.test(mime)) return null;
      if (/\.svg/i.test(info.thumburl)) return null;
      return info.thumburl;
    })
    .filter(Boolean);
}

async function fetchRealUrls(category, perSide) {
  const seen = new Set();
  const results = [];

  const addEntry = (entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    results.push(entry);
    return results.length >= perSide;
  };

  for (const entry of CURATED_REAL[category.id] ?? []) {
    if (addEntry(entry)) return results;
  }

  for (const query of category.realQueries) {
    for (let offset = 0; seen.size < perSide && offset < 500; offset += 50) {
      const urls = await wikiSearch(query, { offset, limit: 50 });
      for (const url of urls) {
        if (category.id === 'cat-brain-rot' && !isMemeLikeUrl(url)) continue;
        if (addEntry({ url, source: 'wikimedia', query })) return results;
      }
      await sleep(600);
    }
    if (results.length >= perSide) return results;
    await sleep(1200);
  }

  if (results.length < perSide) {
    throw new Error(
      `Only found ${results.length}/${perSide} real images for ${category.id} (queries: ${category.realQueries.join(', ')})`,
    );
  }

  return results;
}

function buildFakeUrls(category, perSide) {
  const variants = [
    'wide angle',
    'close-up',
    'cinematic lighting',
    'natural daylight',
    'dramatic shadows',
    'shallow depth of field',
    'documentary style',
    'high detail 8k',
    'grainy film look',
    'vivid colors',
  ];

  return Array.from({ length: perSide }, (_, index) => {
    const variant = variants[index % variants.length];
    const prompt = `${category.fakePromptBase}, ${variant}, seed ${index + 1}`;
    const encoded = encodeURIComponent(prompt);
    const seed = 1000 + index + category.sortOrder * 100;
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=600&seed=${seed}&nologo=true`;
    return { url, source: 'pollinations', prompt, seed };
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MEME_URL_HINTS = [
  'meme',
  'doge',
  'grumpy',
  'pepe',
  'wojak',
  'lolcat',
  'nyan',
  'keyboard_cat',
  'keyboard-cat',
  'success_kid',
  'success-kid',
  'distracted',
  'pikachu',
  'spongebob',
  'brain',
  'reaction',
  'macro',
  'viral',
  'shiba',
  'tardar',
  'rickroll',
  'this_is_fine',
];

function isMemeLikeUrl(url) {
  const lower = decodeURIComponent(url).toLowerCase();
  return MEME_URL_HINTS.some((hint) => lower.includes(hint));
}

async function main() {
  const flags = parseArgs(process.argv);
  const perSide = Number(flags['per-side'] ?? DEFAULT_PER_SIDE);
  const categoryFilter = flags.category
    ? flags.category.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  const toBuild = categoryFilter
    ? GAME_CATEGORIES.filter((c) => categoryFilter.includes(c.id))
    : GAME_CATEGORIES;

  if (categoryFilter && toBuild.length === 0) {
    throw new Error(`Unknown category id(s): ${categoryFilter.join(', ')}`);
  }

  console.log(
    `Building ${perSide} real + ${perSide} fake per category (${toBuild.length} categories)…`,
  );

  let existingCategories = {};
  if (existsSync(OUT_FILE)) {
    try {
      existingCategories = JSON.parse(readFileSync(OUT_FILE, 'utf8')).categories ?? {};
    } catch {
      existingCategories = {};
    }
  }

  const categories = { ...existingCategories };

  for (const category of toBuild) {
    process.stdout.write(`  ${category.name}… `);
    const real = await fetchRealUrls(category, perSide);
    const fake = buildFakeUrls(category, perSide);
    categories[category.id] = { real, fake };
    const pexels = real.filter((r) => r.source === 'pexels').length;
    const wiki = real.filter((r) => r.source === 'wikimedia').length;
    console.log(`✔ ${real.length} real (${pexels} pexels, ${wiki} wikimedia), ${fake.length} fake`);
    await sleep(2500);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    perSide,
    categories,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
