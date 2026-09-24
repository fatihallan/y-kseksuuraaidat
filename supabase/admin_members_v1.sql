-- Dijital Şûra V1 / güvenli admin üye yönetimi
create or replace function public.admin_set_member_active(target_id uuid,new_active boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_suura_admin() then raise exception 'Yetkisiz işlem'; end if;
 if target_id=auth.uid() and new_active=false then raise exception 'Kendi admin hesabınızı pasife alamazsınız'; end if;
 update public.profiles set is_active=new_active where id=target_id;
end;$$;
create or replace function public.admin_set_member_role(target_id uuid,new_role text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_suura_admin() then raise exception 'Yetkisiz işlem'; end if;
 if new_role not in ('member','admin') then raise exception 'Geçersiz rol'; end if;
 if target_id=auth.uid() and new_role<>'admin' then raise exception 'Kendi admin yetkinizi kaldıramazsınız'; end if;
 update public.profiles set role=new_role where id=target_id;
end;$$;
revoke all on function public.admin_set_member_active(uuid,boolean) from public;
revoke all on function public.admin_set_member_role(uuid,text) from public;
grant execute on function public.admin_set_member_active(uuid,boolean) to authenticated;
grant execute on function public.admin_set_member_role(uuid,text) to authenticated;