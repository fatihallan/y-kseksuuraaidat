alter table public.elections add column if not exists results_published_at timestamptz;

create or replace function public.get_election_results(p_election_id bigint)
returns table(candidate_id bigint,candidate_name text,votes bigint)
language sql security definer set search_path = ''
as $$
 select c.id,c.name,count(b.id)
 from public.elections e
 join public.election_candidates c on c.election_id=e.id
 left join public.election_ballots b on b.candidate_id=c.id and b.election_id=e.id
 where e.id=p_election_id
   and (select auth.uid()) is not null
   and (
    e.results_published_at is not null or exists (
     select 1 from public.profiles p
     where p.id=(select auth.uid()) and p.role='admin' and p.is_active
    )
   )
 group by c.id,c.name,c.sort_order
 order by c.sort_order,c.id;
$$;

create or replace function public.publish_election_results(p_election_id bigint)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare published_at timestamptz;
begin
 if not exists (
  select 1 from public.profiles p
  where p.id=(select auth.uid()) and p.role='admin' and p.is_active
 ) then
  raise exception 'Bu işlem için yönetici yetkisi gerekli.' using errcode='42501';
 end if;
 update public.elections
 set results_published_at=coalesce(results_published_at,now())
 where id=p_election_id and status in ('open','closed')
 returning results_published_at into published_at;
 if not found then
  raise exception 'Yayınlanabilir seçim bulunamadı.';
 end if;
 return published_at;
end;
$$;

revoke execute on function public.get_election_results(bigint) from public, anon;
grant execute on function public.get_election_results(bigint) to authenticated;
revoke execute on function public.publish_election_results(bigint) from public, anon;
grant execute on function public.publish_election_results(bigint) to authenticated;
