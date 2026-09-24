-- Yüksek Şuura • Dijital Şuura sistem hesabı
alter table public.chat_messages
  add column if not exists sender_type text not null default 'user'
  check (sender_type in ('user','system')),
  add column if not exists system_name text;

create or replace function public.send_system_chat_message(
  p_channel_id bigint,
  p_content text
)
returns public.chat_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  result_row public.chat_messages;
begin
  select role into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role <> 'admin' then
    raise exception 'Bu işlem yalnızca yöneticiler tarafından yapılabilir.';
  end if;

  if nullif(trim(p_content), '') is null then
    raise exception 'Duyuru metni boş olamaz.';
  end if;

  insert into public.chat_messages (
    channel_id,
    user_id,
    display_name,
    content,
    sender_type,
    system_name
  )
  values (
    p_channel_id,
    auth.uid(),
    'Dijital Şuura',
    trim(p_content),
    'system',
    'Dijital Şuura'
  )
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.send_system_chat_message(bigint,text) from public;
grant execute on function public.send_system_chat_message(bigint,text) to authenticated;
