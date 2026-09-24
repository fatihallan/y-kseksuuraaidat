"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ArrowLeft,ShieldCheck,Users,UserCheck,UserX,MessageCircle} from "lucide-react";
import "./admin.css";
const db=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
export default function Yonetim(){
 const [me,setMe]=useState(null),[members,setMembers]=useState([]),[stats,setStats]=useState({messages:0}),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){
  const {data:{session}}=await db.auth.getSession();
  if(!session){setLoading(false);return}
  const {data:p}=await db.from("profiles").select("*").eq("id",session.user.id).single();
  setMe(p);
  if(p?.role!=="admin"||!p?.is_active){setLoading(false);return}
  const [{data:m,error:e},{count}]=await Promise.all([
   db.from("profiles").select("id,full_name,username,avatar_url,role,is_active,created_at").order("created_at"),
   db.from("chat_messages").select("*",{count:"exact",head:true})
  ]);
  if(e)setError(e.message); else setMembers(m||[]);
  setStats({messages:count||0});setLoading(false)
 }
 useEffect(()=>{load()},[]);
 async function setActive(id,value){const {error}=await db.rpc("admin_set_member_active",{target_id:id,new_active:value});if(error)setError(error.message);else setMembers(v=>v.map(x=>x.id===id?{...x,is_active:value}:x))}
 async function setRole(id,role){const {error}=await db.rpc("admin_set_member_role",{target_id:id,new_role:role});if(error)setError(error.message);else setMembers(v=>v.map(x=>x.id===id?{...x,role}:x))}
 if(loading)return <main className="adminGate">Yönetim paneli yükleniyor…</main>;
 if(!me)return <main className="adminGate"><ShieldCheck/><h1>Yönetici girişi gerekli</h1><a href="/">Ana sayfaya dön</a></main>;
 if(me.role!=="admin"||!me.is_active)return <main className="adminGate"><ShieldCheck/><h1>Bu alan yöneticilere özel</h1><a href="/">Ana sayfaya dön</a></main>;
 const active=members.filter(x=>x.is_active).length;
 return <main className="adminPage"><header><a href="/"><ArrowLeft size={18}/> Dijital Şûra</a><div><b>YÖNETİM MERKEZİ</b><span>{me.full_name}</span></div></header>
 <section className="adminHero"><p>YÜKSEK ŞÛRA • YÖNETİCİ</p><h1>Kontrol Merkezi</h1><span>Üyeler, yetkiler ve topluluk durumunu tek ekrandan yönet.</span></section>
 <section className="stats"><article><Users/><div><b>{members.length}</b><span>Toplam Üye</span></div></article><article><UserCheck/><div><b>{active}</b><span>Aktif Üye</span></div></article><article><UserX/><div><b>{members.length-active}</b><span>Pasif Üye</span></div></article><article><MessageCircle/><div><b>{stats.messages}</b><span>Mesaj</span></div></article></section>
 {error&&<div className="error">{error}</div>}
 <section className="panel"><div className="panelHead"><div><h2>Üye Yönetimi</h2><p>Roller ve üyelik durumu</p></div><span>{members.length} kayıt</span></div>
 <div className="memberList">{members.map(m=><article className="member" key={m.id}><div className="identity"><div className="pic">{m.avatar_url?<img src={m.avatar_url} alt=""/>:(m.full_name||"Ü").slice(0,1)}</div><div><b>{m.full_name}</b><span>@{m.username||"uye"}</span></div></div><div className="badges"><i className={m.role}>{m.role==="admin"?"ADMIN":"ÜYE"}</i><i className={m.is_active?"on":"off"}>{m.is_active?"AKTİF":"PASİF"}</i></div><div className="actions"><select value={m.role} disabled={m.id===me.id} onChange={e=>setRole(m.id,e.target.value)}><option value="member">Üye</option><option value="admin">Admin</option></select><button disabled={m.id===me.id} onClick={()=>setActive(m.id,!m.is_active)}>{m.is_active?"Pasife Al":"Aktifleştir"}</button></div></article>)}</div></section></main>
}