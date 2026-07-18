-- Seed reference categories required for game FK inserts.
-- Run after schema.sql in the Supabase SQL Editor.

insert into public.categories (id, name, description, icon, sort_order) values
  ('cat-world-cup', 'World Cup', 'Global football fever — real match photos vs AI-generated tournament scenes.', '⚽', 1),
  ('cat-lebron-decision', 'LeBron / The Decision', 'NBA icon energy and ESPN press-conference vibes — spot the synthetic hoop dreams.', '🏀', 2),
  ('cat-brain-rot', 'Brain Rot', 'Chronically online aesthetics — meme-tier visuals vs uncanny AI slop.', '🧠', 3),
  ('cat-nyc-core', 'NYC Core', 'Subway tiles, fire escapes, bodega cats — authentic NYC or AI city-core cosplay?', '🗽', 4),
  ('cat-food', 'Food', 'Plated perfection and greasy glory — can you taste the difference in the pixels?', '🍕', 5)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
