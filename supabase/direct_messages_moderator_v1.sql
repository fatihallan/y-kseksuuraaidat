-- Dijital Şûra: özel mesaj + moderatör altyapısı
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('member','moderator','admin'));

create or replace function public.is_suura_staff()
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator') and is_active=true)
$$;

create table if not exists public.direct_messages (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 content text not null check (char_length(btrim(content)) between 1 and 2000),
 created_at timestamptz not null default now(),
 check (sender_id <> recipient_id)
);
create index if not exists direct_messages_pair_idx on public.direct_messages(sender_id,recipient_id,created_at desc);
alter table public.direct_messages enable row level security;
drop policy if exists "dm participants read" on public.direct_messages;
create policy "dm participants read" on public.direct_messages for select to authenticated using (auth.uid()=sender_id or auth.uid()=recipient_id);
drop policy if exists "dm sender insert" on public.direct_messages;
create policy "dm sender insert" on public.direct_messages for insert to authenticated with check (auth.uid()=sender_id);
drop policy if exists "dm sender delete" on public.direct_messages;
create policy "dm sender delete" on public.direct_messages for delete to authenticated using (auth.uid()=sender_id);
alter publication supabase_realtime add table public.direct_messages;

create or replace function public.admin_set_member_role(target_id uuid,new_role text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_suura_admin() then raise exception 'Yetkisiz işlem'; end if;
 if new_role not in ('member','moderator','admin') then raise exception 'Geçersiz rol'; end if;
 if target_id=auth.uid() then raise exception 'Kendi rolünüzü değiştiremezsiniz'; end if;
 update public.profiles set role=new_role,updated_at=now() where id=target_id;
end $$;
grant execute on function public.admin_set_member_role(uuid,text) to authenticated;