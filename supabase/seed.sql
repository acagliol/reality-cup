-- Seed reference categories required for game FK inserts.
-- Run after schema.sql in the Supabase SQL Editor.

insert into public.categories (id, name, description, icon, sort_order) values
  ('cat-nature', 'Nature & Landscapes', 'Can you tell if these scenic photos are real camera shots or AI-generated fantasy?', '🌄', 1),
  ('cat-people', 'People & Portraits', 'Study faces and expressions. AI portraits often hide subtle tells in skin and eyes.', '👤', 2),
  ('cat-animals', 'Animals & Wildlife', 'Fur, feathers, and motion blur — wildlife images push generative models to their limits.', '🦁', 3),
  ('cat-architecture', 'Architecture', 'Buildings with impossible geometry or perfect symmetry might not exist in the real world.', '🏛️', 4),
  ('cat-food', 'Food Photography', 'Hyper-real food shots are a classic AI benchmark. Watch for texture and lighting.', '🍕', 5)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
