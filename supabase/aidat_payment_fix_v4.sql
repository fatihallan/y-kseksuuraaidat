-- YÜKSEK ŞUURA - AİDAT ÖDEME DÜZELTMESİ V4
-- Manuel aidat üyeleri için admin ödeme yazma/upsert ve kasa özetini düzeltir.

-- Eski unique constraint/index çakışmalarını güvenli biçimde temizle.
alter table public.aidat_odemeleri drop constraint if exists aidat_odemeleri_donem_id_user_id_key;
drop index if exists public.aidat_odemeleri_donem_id_user_id_key;
drop index if exists public.aidat_odemeleri_donem_uye_unique;

-- Manuel üyede aynı dönem için tek ödeme kaydı.
alter table public.aidat_odemeleri
add constraint aidat_odemeleri_donem_uye_key unique (donem_id, aidat_uye_id);

-- Admin manuel ödeme kayıtlarını yönetebilsin.
drop policy if exists "admin manage aidat payments" on public.aidat_odemeleri;
create policy "admin manage aidat payments"
on public.aidat_odemeleri for all to authenticated
using (public.is_suura_admin())
with check (public.is_suura_admin());

-- Admin ekranındaki kasa özeti manuel sistemden hesaplansın.
create or replace view public.aidat_kasa_ozeti
with (security_invoker = true)
as
select
 coalesce((select sum(odenen_tutar) from public.aidat_odemeleri where durum='odendi'),0)::numeric as toplam_tahsilat,
 coalesce((select sum(tutar) from public.aidat_giderleri),0)::numeric as toplam_gider,
 (coalesce((select sum(odenen_tutar) from public.aidat_odemeleri where durum='odendi'),0)
  - coalesce((select sum(tutar) from public.aidat_giderleri),0))::numeric as kasa_bakiyesi;

grant select on public.aidat_kasa_ozeti to authenticated;

-- Public ekran RPC'si aynı canlı rakamları kullanır.
create or replace function public.get_public_aidat_data()
returns jsonb language sql security definer set search_path=public
as $$
select jsonb_build_object(
 'donemler',coalesce((select jsonb_agg(to_jsonb(d) order by d.yil desc,d.ay desc) from public.aidat_donemleri d),'[]'::jsonb),
 'odemeler',coalesce((select jsonb_agg(jsonb_build_object('donem_id',o.donem_id,'aidat_uye_id',o.aidat_uye_id,'durum',o.durum,'odenen_tutar',o.odenen_tutar,'odeme_tarihi',o.odeme_tarihi)) from public.aidat_odemeleri o where o.aidat_uye_id is not null),'[]'::jsonb),
 'uyeler',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'full_name',a.ad_soyad,'username',null,'avatar_url',null) order by a.ad_soyad) from public.aidat_uyeleri a where a.aktif=true),'[]'::jsonb),
 'giderler',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'baslik',g.baslik,'aciklama',g.aciklama,'tutar',g.tutar,'gider_tarihi',g.gider_tarihi,'pdf_path',g.pdf_path) order by g.gider_tarihi desc) from public.aidat_giderleri g),'[]'::jsonb),
 'ozet',jsonb_build_object(
  'toplam_tahsilat',coalesce((select sum(o.odenen_tutar) from public.aidat_odemeleri o where o.durum='odendi'),0),
  'toplam_gider',coalesce((select sum(g.tutar) from public.aidat_giderleri g),0),
  'kasa_bakiyesi',coalesce((select sum(o.odenen_tutar) from public.aidat_odemeleri o where o.durum='odendi'),0)-coalesce((select sum(g.tutar) from public.aidat_giderleri g),0)
 )
);
$$;
revoke all on function public.get_public_aidat_data() from public;
grant execute on function public.get_public_aidat_data() to anon,authenticated;