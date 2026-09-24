-- Yüksek Şuura • DM gerçek okundu bilgisi
alter table public.direct_messages
  add column if not exists read_at timestamptz;

create index if not exists direct_messages_unread_idx
  on public.direct_messages (recipient_id, read_at, created_at desc);

drop policy if exists "recipient update direct messages" on public.direct_messages;
create policy "recipient update direct messages"
on public.direct_messages
for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

update public.direct_messages
set read_at = created_at
where read_at is null;
