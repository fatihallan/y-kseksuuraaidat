-- Dijital Şûra V1 / Sohbet medya + moderasyon
alter table public.chat_messages add column if not exists attachment_url text;
alter table public.chat_messages add column if not exists attachment_type text;
alter table public.chat_messages alter column content drop not null;
alter table public.chat_messages drop constraint if exists chat_messages_content_check;
alter table public.chat_messages add constraint chat_messages_content_or_attachment check (
 (content is not null and char_length(btrim(content)) between 1 and 2000) or attachment_url is not null
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('chat-media','chat-media',true,15728640,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','application/pdf'])
on conflict(id) do update set public=true,file_size_limit=15728640,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif','video/mp4','application/pdf'];
drop policy if exists "public read chat media" on storage.objects;
drop policy if exists "members upload chat media" on storage.objects;
drop policy if exists "members delete own chat media" on storage.objects;
create policy "public read chat media" on storage.objects for select using(bucket_id='chat-media');
create policy "members upload chat media" on storage.objects for insert to authenticated with check(bucket_id='chat-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "members delete own chat media" on storage.objects for delete to authenticated using(bucket_id='chat-media' and (storage.foldername(name))[1]=auth.uid()::text);
create or replace function public.is_suura_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active=true) $$;
drop policy if exists "admins delete any message" on public.chat_messages;
create policy "admins delete any message" on public.chat_messages for delete to authenticated using(public.is_suura_admin());