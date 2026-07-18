-- FoodFake-30K metadata columns + public image storage bucket.
-- Full image ingest: npm run food:seed -- --dataset-path "C:/path/to/FoodFake-30K"

alter table public.round_content
  add column if not exists foodfake_category text,
  add column if not exists image_source text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'round-images',
  'round-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set public = true;

drop policy if exists "public read round images" on storage.objects;
create policy "public read round images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'round-images');

drop policy if exists "service write round images" on storage.objects;
create policy "service write round images" on storage.objects
  for all to service_role using (bucket_id = 'round-images') with check (bucket_id = 'round-images');
