// Applies supabase/schema.sql + supabase/seed.sql to your remote database.
//
// Option A (recommended): Enable Supabase MCP in Cursor (.cursor/mcp.json) and ask
// the agent to run execute_sql — OAuth login, no password in env.
//
// Option B: Add your direct Postgres connection string to .env.local:
//   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// Find it in Supabase Dashboard → Project Settings → Database → Connection string (URI).
//
// Run: node --env-file=.env.local scripts/setup-supabase-db.mjs

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.log('Missing SUPABASE_DB_URL in environment.');
  console.log('Add it to .env.local, or enable Supabase MCP in Cursor and ask the agent to apply schema.sql.');
  process.exit(1);
}

function runSqlFile(relativePath) {
  const file = join(root, relativePath);
  console.log(`Running ${relativePath}…`);
  const result = spawnSync(
    'npx',
    ['supabase', 'db', 'query', '--db-url', dbUrl, '-f', file],
    { stdio: 'inherit', shell: true, cwd: root },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runSqlFile('supabase/schema.sql');
runSqlFile('supabase/seed.sql');
runSqlFile('supabase/seed-ai-models.sql');
console.log('Done — schema, categories, and AI models applied.');
