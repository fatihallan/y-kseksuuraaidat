-- Dijital Şûra V1 / Avatar Storage
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "public read avatars" on storage.objects;
drop policy if exists "members upload own avatar" on storage.objects;
drop policy if exists "members update own avatar" on storage.objects;
drop policy if exists "members delete own avatar" on storage.objects;

create policy "public read avatars" on storage.objects for select using (bucket_id='avatars');
create policy "members upload own avatar" on storage.objects for insert to authenticated
with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "members update own avatar" on storage.objects for update to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "members delete own avatar" on storage.objects for delete to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);