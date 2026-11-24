create table public.suura_polls (
 id bigint generated always as identity primary key,
 question text not null check (char_length(btrim(question)) between 3 and 160),
 options text[] not null check (cardinality(options) between 2 and 8),
 created_at timestamptz not null default now(),
 closed_at timestamptz
);
create table public.suura_poll_votes (
 poll_id bigint not null references public.suura_polls(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 choice integer not null check (choice between 1 and 8),
 primary key (poll_id,user_id)
);
alter table public.suura_polls enable row level security;
alter table public.suura_poll_votes enable row level security;
revoke all on public.suura_polls,public.suura_poll_votes from anon,authenticated;

create function public.list_suura_polls()
returns jsonb language sql security definer set search_path='' as $$
 with member as (
  select id,role from public.profiles where id=(select auth.uid()) and is_active
 ), visible as (
  select p.id,p.question,p.options,p.created_at,p.closed_at,mine.choice,
   case when p.closed_at is not null or mine.choice is not null or m.role='admin'
   then array(select (select count(*) from public.suura_poll_votes v where v.poll_id=p.id and v.choice=n) from generate_subscripts(p.options,1) n order by n)
   else null end as counts
  from public.suura_polls p cross join member m
  left join public.suura_poll_votes mine on mine.poll_id=p.id and mine.user_id=m.id
 )
 select coalesce(jsonb_agg(to_jsonb(visible) order by closed_at is not null,created_at desc,id desc),'[]'::jsonb) from visible;
$$;

create function public.manage_suura_poll(p_action text,p_poll_id bigint default null,p_question text default null,p_options text[] default null)
returns void language plpgsql security definer set search_path='' as $$
declare labels text[];
begin
 if not exists(select 1 from public.profiles where id=(select auth.uid()) and is_active and role='admin') then
  raise exception 'Yönetici yetkisi gerekli.' using errcode='42501';
 end if;
 if p_action='create' then
  select array_agg(btrim(option) order by idx) into labels from unnest(p_options) with ordinality as entries(option,idx);
  if p_question is null or char_length(btrim(p_question)) not between 3 and 160 or labels is null or cardinality(labels) not between 2 and 8
   or exists(select 1 from unnest(labels) as label where label is null or char_length(label) not between 1 and 80)
   or (select count(distinct lower(label)) from unnest(labels) as label)<>cardinality(labels) then
   raise exception 'Soruyu ve 2–8 farklı seçeneği kontrol et.';
  end if;
  insert into public.suura_polls(question,options) values(btrim(p_question),labels);
 elsif p_action='close' then
  update public.suura_polls set closed_at=coalesce(closed_at,now()) where id=p_poll_id;
  if not found then raise exception 'Anket bulunamadı.'; end if;
 else raise exception 'Geçersiz işlem.';
 end if;
end;
$$;

create function public.vote_suura_poll(p_poll_id bigint,p_choice integer)
returns void language plpgsql security definer set search_path='' as $$
declare poll public.suura_polls%rowtype;
begin
 if not exists(select 1 from public.profiles where id=(select auth.uid()) and is_active) then
  raise exception 'Aktif üyelik gerekli.' using errcode='42501';
 end if;
 select * into poll from public.suura_polls where id=p_poll_id for share;
 if not found or poll.closed_at is not null then raise exception 'Bu anket oy vermeye kapalı.'; end if;
 if p_choice is null or p_choice not between 1 and cardinality(poll.options) then raise exception 'Bir seçenek seç.'; end if;
 insert into public.suura_poll_votes(poll_id,user_id,choice) values(p_poll_id,(select auth.uid()),p_choice);
exception when unique_violation then
 raise exception 'Bu ankette zaten oy kullandın.';
end;
$$;

revoke execute on function public.list_suura_polls(),public.manage_suura_poll(text,bigint,text,text[]),public.vote_suura_poll(bigint,integer) from public,anon;
grant execute on function public.list_suura_polls(),public.manage_suura_poll(text,bigint,text,text[]),public.vote_suura_poll(bigint,integer) to authenticated;

alter table public.aidat_uyeleri add column profile_id uuid unique references public.profiles(id) on delete set null;
create function public.get_my_suura_dues(p_period_id bigint)
returns text language sql security definer set search_path='' as $$
 select o.durum::text
 from public.aidat_odemeleri o
 where o.donem_id=p_period_id and (select auth.uid()) is not null
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active)
 and (o.user_id=(select auth.uid()) or exists (
  select 1 from public.aidat_uyeleri a
  where a.id=o.aidat_uye_id and a.profile_id=(select auth.uid()) and a.aktif
 ))
 order by o.updated_at desc nulls last,o.id desc limit 1;
$$;
revoke execute on function public.get_my_suura_dues(bigint) from public,anon;
grant execute on function public.get_my_suura_dues(bigint) to authenticated;
