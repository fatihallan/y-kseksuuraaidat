-- YÜKSEK ŞUURA - PUBLIC AİDAT OKUMA V2
-- /aidat sayfasını girişsiz ziyaretçilere açar. Yönetim yazma yetkileri değişmez.

drop policy if exists "public read aidat periods" on public.aidat_donemleri;
create policy "public read aidat periods"
on public.aidat_donemleri for select to anon, authenticated
using (true);

drop policy if exists "public read aidat payments" on public.aidat_odemeleri;
create policy "public read aidat payments"
on public.aidat_odemeleri for select to anon, authenticated
using (true);

drop policy if exists "public read aidat expenses" on public.aidat_giderleri;
create policy "public read aidat expenses"
on public.aidat_giderleri for select to anon, authenticated
using (true);

-- Üye adlarını ödeme tablosuyla eşleştirebilmek için güvenli public görünüm.
-- E-posta vb. özel alanlar bu view'da yoktur.
create or replace view public.aidat_public_uyeler
with (security_invoker = true)
as
select id, full_name, username, avatar_url, is_active
from public.profiles
where is_active = true;

grant select on public.aidat_public_uyeler to anon, authenticated;

-- profiles RLS anon okumaya kapalıysa view security_invoker nedeniyle yine engellenir.
-- Bu nedenle yalnızca public aidat ekranının ihtiyacı olan alanları SECURITY DEFINER RPC ile veririz.
create or replace function public.get_public_aidat_data()
returns jsonb
language sql
security definer
set search_path = public
as $$
select jsonb_build_object(
 'donemler', coalesce((select jsonb_agg(to_jsonb(d) order by d.yil desc,d.ay desc) from public.aidat_donemleri d),'[]'::jsonb),
 'odemeler', coalesce((select jsonb_agg(jsonb_build_object('donem_id',o.donem_id,'user_id',o.user_id,'durum',o.durum,'odenen_tutar',o.odenen_tutar,'odeme_tarihi',o.odeme_tarihi)) from public.aidat_odemeleri o),'[]'::jsonb),
 'uyeler', coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'full_name',p.full_name,'username',p.username,'avatar_url',p.avatar_url)) from public.profiles p where p.is_active=true),'[]'::jsonb),
 'giderler', coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'baslik',g.baslik,'aciklama',g.aciklama,'tutar',g.tutar,'gider_tarihi',g.gider_tarihi,'pdf_path',g.pdf_path) order by g.gider_tarihi desc) from public.aidat_giderleri g),'[]'::jsonb),
 'ozet', jsonb_build_object(
   'toplam_tahsilat',coalesce((select sum(o.odenen_tutar) from public.aidat_odemeleri o where o.durum='odendi'),0),
   'toplam_gider',coalesce((select sum(g.tutar) from public.aidat_giderleri g),0),
   'kasa_bakiyesi',coalesce((select sum(o.odenen_tutar) from public.aidat_odemeleri o where o.durum='odendi'),0)-coalesce((select sum(g.tutar) from public.aidat_giderleri g),0)
 )
);
$$;
revoke all on function public.get_public_aidat_data() from public;
grant execute on function public.get_public_aidat_data() to anon, authenticated;

-- PDF belgelerini de public şeffaflık ekranında indirilebilir yapar.
drop policy if exists "public read aidat pdf" on storage.objects;
create policy "public read aidat pdf"
on storage.objects for select to anon, authenticated
using (bucket_id='aidat-belgeleri');