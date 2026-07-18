-- Sponsor AI models for Builders Cup 2026 (Cursor + Codex).
-- Run after schema.sql.

insert into public.ai_models (id, name, provider, version, active) values
  ('codex-gpt-4o', 'GPT-4o', 'OpenAI', '2024-08', true),
  ('cursor-claude-sonnet', 'Claude Sonnet', 'Anthropic', '4.0', true),
  ('cursor-gemini-flash', 'Gemini Flash', 'Google', '2.0', true)
on conflict (id) do update set
  name = excluded.name,
  provider = excluded.provider,
  version = excluded.version,
  active = excluded.active;

-- Allow service role / admin scripts to write reference tables (anon remains read-only).
drop policy if exists "admin ai_models write" on public.ai_models;
create policy "admin ai_models write" on public.ai_models
  for all to service_role using (true) with check (true);

drop policy if exists "admin round_content write" on public.round_content;
create policy "admin round_content write" on public.round_content
  for all to service_role using (true) with check (true);

drop policy if exists "admin ai_answers write" on public.ai_answers;
create policy "admin ai_answers write" on public.ai_answers
  for all to service_role using (true) with check (true);
