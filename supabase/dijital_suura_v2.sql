-- Dijital Şuura v2

alter table public.chat_messages
  add column if not exists announcement_type text not null default 'normal',
  add column if not exists is_pinned boolean not null default false,
  add column if not exists pinned_at timestamptz,
  add column if not exists pinned_by uuid references auth.users(id) on delete set null;

do $$
begin
  alter table public.chat_messages
    add constraint chat_messages_announcement_type_check
    check (announcement_type in ('normal','duyuru','uyari','etkinlik','bilgi'));
exception when duplicate_object then null;
end $$;

create table if not exists public.system_profile (
  id boolean primary key default true check (id),
  display_name text not null default 'Dijital Şuura',
  avatar_url text,
  updated_at timestamptz not null default now()
);

insert into public.system_profile (id,display_name)
values (true,'Dijital Şuura')
on conflict (id) do nothing;

alter table public.system_profile enable row level security;

drop policy if exists "public read system profile" on public.system_profile;
create policy "public read system profile"
on public.system_profile for select
to authenticated using (true);

drop policy if exists "admin update system profile" on public.system_profile;
create policy "admin update system profile"
on public.system_profile for update
to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

create or replace function public.send_system_chat_message(
  p_channel_id bigint,
  p_content text,
  p_announcement_type text default 'normal'
)
returns public.chat_messages
language plpgsql security definer set search_path=public
as $$
declare caller_role text; result_row public.chat_messages;
begin
  select role into caller_role from public.profiles where id=auth.uid();
  if caller_role <> 'admin' then raise exception 'Bu işlem yalnızca yöneticiler tarafından yapılabilir.'; end if;
  if nullif(trim(p_content),'') is null then raise exception 'Duyuru metni boş olamaz.'; end if;
  if p_announcement_type not in ('normal','duyuru','uyari','etkinlik','bilgi') then raise exception 'Geçersiz duyuru türü.'; end if;
  insert into public.chat_messages(channel_id,user_id,display_name,content,sender_type,system_name,announcement_type)
  values(p_channel_id,auth.uid(),'Dijital Şuura',trim(p_content),'system','Dijital Şuura',p_announcement_type)
  returning * into result_row;
  return result_row;
end;
$$;

revoke all on function public.send_system_chat_message(bigint,text,text) from public;
grant execute on function public.send_system_chat_message(bigint,text,text) to authenticated;

create or replace function public.toggle_chat_pin(p_message_id bigint, p_pinned boolean)
returns public.chat_messages
language plpgsql security definer set search_path=public
as $$
declare caller_role text; result_row public.chat_messages;
begin
  select role into caller_role from public.profiles where id=auth.uid();
  if caller_role not in ('admin','moderator') then raise exception 'Bu işlem yalnızca yönetim tarafından yapılabilir.'; end if;
  update public.chat_messages
  set is_pinned=p_pinned,
      pinned_at=case when p_pinned then now() else null end,
      pinned_by=case when p_pinned then auth.uid() else null end
  where id=p_message_id
  returning * into result_row;
  return result_row;
end;
$$;

revoke all on function public.toggle_chat_pin(bigint,boolean) from public;
grant execute on function public.toggle_chat_pin(bigint,boolean) to authenticated;
