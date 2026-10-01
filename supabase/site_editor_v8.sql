-- V8 Site Editor
create table if not exists public.site_settings(
 id boolean primary key default true check(id=true),
 settings jsonb not null default '{}'::jsonb,
 updated_by uuid references public.profiles(id),
 updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "everyone reads site settings" on public.site_settings;
drop policy if exists "admins manage site settings" on public.site_settings;
create policy "everyone reads site settings" on public.site_settings for select using(true);
create policy "admins manage site settings" on public.site_settings for all to authenticated using(public.is_suura_admin()) with check(public.is_suura_admin());
insert into public.site_settings(id,settings) values(true,'{"siteName":"YÜKSEK ŞUURA","tagline":"DİJİTAL TOPLULUK","logoUrl":"","primary":"#8dff32","background":"#070a08","panel":"#0d120f","text":"#f5f8f5","muted":"#8d9990","fontBody":"Inter","fontHeading":"Montserrat","baseSize":15,"headingScale":1,"lineHeight":1.5,"radius":8,"contentWidth":1200,"heroEyebrow":"YÜKSEK ŞUURA • DİJİTAL TOPLULUK","heroTitle":"DİJİTAL","heroAccent":"ŞUURA","heroText":"Dostluk, birlik, aktivite ve gelenek. Yüksek Şuura’nın sohbeti, etkinlikleri ve ortak hafızası artık tek yerde.","footerText":"Birlikte geçen zamanın dijital hafızası.","navHome":"Ana Sayfa","navChat":"Sohbet","navEvents":"Etkinlikler","navGallery":"Galeri","navDues":"Aidat","navMembers":"Üyeler"}'::jsonb) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('site-assets','site-assets',true,5242880,array['image/jpeg','image/png','image/webp','image/svg+xml']) on conflict(id) do update set public=true,file_size_limit=5242880;
drop policy if exists "public read site assets" on storage.objects; drop policy if exists "admins upload site assets" on storage.objects; drop policy if exists "admins update site assets" on storage.objects; drop policy if exists "admins delete site assets" on storage.objects;
create policy "public read site assets" on storage.objects for select using(bucket_id='site-assets');
create policy "admins upload site assets" on storage.objects for insert to authenticated with check(bucket_id='site-assets' and public.is_suura_admin());
create policy "admins update site assets" on storage.objects for update to authenticated using(bucket_id='site-assets' and public.is_suura_admin()) with check(bucket_id='site-assets' and public.is_suura_admin());
create policy "admins delete site assets" on storage.objects for delete to authenticated using(bucket_id='site-assets' and public.is_suura_admin());
