"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ArrowLeft,Crown,ShieldCheck,Users} from "lucide-react";
import "./members.css";
const db=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
export default function Uyeler(){
 const [session,setSession]=useState(null),[members,setMembers]=useState([]),[loading,setLoading]=useState(true);
 async function load(){const {data:{session:s}}=await db.auth.getSession();setSession(s);if(!s){setLoading(false);return}const {data}=await db.from("profiles").select("id,full_name,username,avatar_url,role,is_active,created_at").eq("is_active",true).order("full_name");setMembers(data||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 const admins=useMemo(()=>members.filter(x=>x.role==="admin"),[members]);
 if(loading)return <main className="membersGate">Şûra üyeleri yükleniyor…</main>;
 if(!session)return <main className="membersGate"><Users/><h1>Üyeler alanı Şûra'ya özel</h1><a href="/">Giriş sayfasına dön</a></main>;
 return <main className="membersPage"><header><a href="/"><ArrowLeft size={18}/> Dijital Şûra</a><b>ŞÛRA ÜYELERİ</b></header><section className="membersHero"><p>YÜKSEK ŞÛRA • DEMİRBAŞ</p><h1>Birlikte, yıllardır.</h1><span>Şûra'nın aktif üyeleri ve dijital kimlikleri.</span><div className="stats"><div><strong>{members.length}</strong><small>AKTİF ÜYE</small></div><div><strong>{admins.length}</strong><small>YÖNETİCİ</small></div></div></section><section className="membersGrid">{members.map((m,i)=><article key={m.id} className={m.role==="admin"?"admin":""}><div className="number">{String(i+1).padStart(2,"0")}</div><div className="avatar">{m.avatar_url?<img src={m.avatar_url} alt=""/>:<span>{(m.full_name||"Ş").charAt(0).toUpperCase()}</span>}{m.role==="admin"&&<i><Crown size={12}/></i>}</div><div className="identity"><h2>{m.full_name||"Şûra Üyesi"}</h2><p>@{m.username||"uye"}</p>{m.role==="admin"?<em><ShieldCheck size={12}/> YÖNETİCİ</em>:<em className="memberBadge">ŞÛRA ÜYESİ</em>}</div><div className="status"><span></span> AKTİF</div></article>)}</section></main>}