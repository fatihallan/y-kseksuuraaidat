"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import PollBoard from "./PollBoard";

const db=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
export default function Anketler(){
 const [member,setMember]=useState(null);
 useEffect(()=>{
  let active=true;
  async function check(){
   const {data:{user}}=await db.auth.getUser();
   const {data}=user?await db.from("profiles").select("is_active").eq("id",user.id).maybeSingle():{};
   if(active)setMember(Boolean(data?.is_active));
  }
  void check();
  return()=>{active=false};
 },[]);
 return <main className="pollPage"><a href="/">← Ana sayfa</a><h1>Şuura Anketleri</h1>{member===null?<p role="status">Üyelik kontrol ediliyor…</p>:member?<PollBoard db={db}/>:<p>Anketleri görmek için aktif üye hesabınla giriş yap.</p>}</main>;
}
