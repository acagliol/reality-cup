# ramphackathon

Expo (React Native, iOS) + Supabase starter.

## Stack
- **Expo SDK 57** / React Native 0.86 / TypeScript — runs in **Expo Go** on iOS.
- **Supabase** (`@supabase/supabase-js`) for DB + auth, with session persistence
  via `@react-native-async-storage/async-storage`.

## One-time setup

### 1. Create a Supabase project
1. Go to https://app.supabase.com and create a new project (free tier is fine).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and **Run** it. This creates a
   demo `notes` table so the starter screen has something to read/write.

### 2. Add your keys
1. In Supabase: **Settings → API**. Copy the **Project URL** and the **anon
   public** key.
2. `cp .env.example .env` and paste both values in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
   > `.env` is git-ignored. The anon key is safe in a client app — access is
   > gated by Row Level Security policies, not by hiding the key.

### 3. Run it
```bash
npm run start        # then scan the QR code with the Expo Go app on your iPhone
# or
npm run ios          # opens the iOS simulator (requires Xcode)
```
Get **Expo Go** from the iOS App Store. Phone and laptop must be on the same
Wi-Fi. If the QR won't connect, run `npx expo start --tunnel`.

## Layout
```
App.tsx              Demo screen: read/write the notes table
lib/supabase.ts      Configured Supabase client (reads env vars)
supabase/schema.sql  Starter DB schema — run in the Supabase SQL editor
.env.example         Template for your keys
```

## Notes
- Env vars must be prefixed `EXPO_PUBLIC_` to reach the app bundle. Restart the
  dev server after editing `.env`.
- The demo RLS policy allows anonymous read/write — fine for a hackathon,
  **tighten before shipping** anything real.
