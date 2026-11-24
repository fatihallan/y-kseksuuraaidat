create policy "Active members read voice room"
on realtime.messages for select to authenticated
using (
  (select realtime.topic()) = 'suura-voice-general-v1'
  and extension in ('broadcast', 'presence')
  and exists (select 1 from public.profiles where id = (select auth.uid()) and is_active)
);

create policy "Active members use voice room"
on realtime.messages for insert to authenticated
with check (
  (select realtime.topic()) = 'suura-voice-general-v1'
  and extension in ('broadcast', 'presence')
  and exists (select 1 from public.profiles where id = (select auth.uid()) and is_active)
);
