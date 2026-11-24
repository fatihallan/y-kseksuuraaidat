create or replace function public.list_suura_polls()
returns jsonb language sql security definer set search_path='' as $$
 with member as (
  select id,role from public.profiles where id=(select auth.uid()) and is_active
 ), visible as (
  select p.id,p.question,p.options,p.created_at,p.closed_at,mine.choice,
   case when p.closed_at is not null or mine.choice is not null or m.role='admin'
   then array(select (select count(*) from public.suura_poll_votes v where v.poll_id=p.id and v.choice=n) from generate_subscripts(p.options,1) n order by n)
   else null end as counts
  from public.suura_polls p left join member m on true
  left join public.suura_poll_votes mine on mine.poll_id=p.id and mine.user_id=m.id
 )
 select coalesce(jsonb_agg(to_jsonb(visible) order by closed_at is not null,created_at desc,id desc),'[]'::jsonb) from visible;
$$;

grant execute on function public.list_suura_polls() to anon;
