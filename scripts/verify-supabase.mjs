// Verifies the Supabase creds in .env without printing them.
// Run: node --env-file=.env scripts/verify-supabase.mjs
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function fail(msg) {
  console.log('❌ ' + msg);
  process.exit(1);
}

if (!url) fail('EXPO_PUBLIC_SUPABASE_URL is missing');
if (!key) fail('EXPO_PUBLIC_SUPABASE_ANON_KEY is missing');
if (/\/rest\/v1\/?$/.test(url)) fail('URL must NOT include /rest/v1 — use the bare project URL');
if (key.startsWith('sb_secret_') || key.startsWith('service_role'))
  fail('That is a SECRET key — use the anon/publishable key in a client app');

console.log('✔ URL format looks correct:', url);
console.log('✔ Key is a publishable/anon key (safe for the client)');

const headers = { apikey: key, Authorization: `Bearer ${key}` };

// Does the notes table exist and is the key accepted?
// NOTE: hit the table directly — the /rest/v1/ root spec endpoint rejects
// publishable keys ("secret API key required"), which is expected, not an error.
const notes = await fetch(`${url}/rest/v1/notes?select=*&limit=1`, { headers });
if (notes.status === 200) {
  const rows = await notes.json();
  console.log(`✔ 'notes' table exists and is readable (${rows.length} row[s] sampled)`);
} else if (notes.status === 404 || notes.status === 400) {
  fail("'notes' table not found — run supabase/schema.sql in the SQL Editor");
} else if (notes.status === 401 || notes.status === 403) {
  fail(`'notes' exists but RLS blocked the read (HTTP ${notes.status}) — check the policy in schema.sql`);
} else {
  fail(`Unexpected status reading 'notes': ${notes.status}`);
}

// Can we write (insert)?
const ins = await fetch(`${url}/rest/v1/notes`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: JSON.stringify({ content: 'verify-script ping' }),
});
if (ins.status === 201) {
  console.log('✔ Insert succeeded — read AND write both work end-to-end');
} else {
  console.log(`⚠ Insert returned HTTP ${ins.status} (read works; write may be blocked by RLS)`);
}

console.log('\n🎉 Supabase is set up correctly.');
