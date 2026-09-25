"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ArrowRight,KeyRound,ShieldCheck} from "lucide-react";
import "../ilk-giris/onboarding.css";
const db=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
export default function SifreYenile(){
 const [ready,setReady]=useState(false),[password,setPassword]=useState(""),[again,setAgain]=useState(""),[msg,setMsg]=useState("Şifre yenileme bağlantın doğrulanıyor…"),[busy,setBusy]=useState(false);
 useEffect(()=>{db.auth.getSession().then(({data})=>{setReady(!!data.session);setMsg(data.session?"":"Bağlantı geçersiz veya süresi dolmuş olabilir.")});const {data:s}=db.auth.onAuthStateChange((event,session)=>{if(event==="PASSWORD_RECOVERY"||session){setReady(true);setMsg("")}});return()=>s.subscription.unsubscribe()},[]);
 async function save(e){e.preventDefault();if(password.length<8)return setMsg("Şifre en az 8 karakter olmalı.");if(password!==again)return setMsg("Şifreler eşleşmiyor.");setBusy(true);const {error}=await db.auth.updateUser({password});setBusy(false);if(error)return setMsg(error.message);setMsg("Şifren değiştirildi. Giriş sayfasına yönlendiriliyorsun…");setTimeout(async()=>{await db.auth.signOut();location.href="/"},1200)}
 return <main className="onboard"><section><div className="seal"><ShieldCheck/></div><small>YÜKSEK ŞUURA • HESAP GÜVENLİĞİ</small><h1>Yeni şifreni belirle.</h1><p>E-postana gelen güvenli bağlantı üzerinden hesabın için yeni bir şifre oluştur.</p>{ready?<form onSubmit={save}><label>Yeni Şifre</label><input type="password" autoComplete="new-password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/><label>Yeni Şifre Tekrar</label><input type="password" autoComplete="new-password" minLength={8} value={again} onChange={e=>setAgain(e.target.value)} required/><button disabled={busy}><KeyRound size={17}/>{busy?"Kaydediliyor…":"Şifreyi Yenile"} <ArrowRight size={17}/></button></form>:<a href="/">Ana sayfaya dön</a>}{msg&&<div className="notice">{msg}</div>}</section></main>
}