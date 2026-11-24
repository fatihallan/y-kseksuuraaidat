"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ArrowLeft,CalendarDays,MapPin,Pin,Users,MessageCircle,ThumbsUp,ThumbsDown} from "lucide-react";
import "./events.css";
const db=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
export default function Etkinlikler(){
 const [session,setSession]=useState(null),[events,setEvents]=useState([]),[parts,setParts]=useState([]),[notes,setNotes]=useState([]),[comments,setComments]=useState([]),[texts,setTexts]=useState({}),[loading,setLoading]=useState(true),[notice,setNotice]=useState("");
 async function load(){const {data:{session:s}}=await db.auth.getSession();setSession(s);if(!s){setLoading(false);return}const [{data:e},{data:p},{data:n},{data:c}]=await Promise.all([db.from("events").select("*").order("event_at"),db.from("event_participants").select("*"),db.from("announcements").select("*").order("pinned",{ascending:false}).order("created_at",{ascending:false}),db.from("event_comments").select("*,profiles(full_name,username,avatar_url)").order("created_at")]);setEvents(e||[]);setParts(p||[]);setNotes(n||[]);setComments(c||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 async function rsvp(id,status){setNotice("");const {error}=await db.from("event_participants").upsert({event_id:id,user_id:session.user.id,status},{onConflict:"event_id,user_id"});if(error){setNotice("Katılım durumu kaydedilemedi.");return}await load()}
 async function comment(id){const content=(texts[id]||"").trim();if(!content)return;const {error}=await db.from("event_comments").insert({event_id:id,user_id:session.user.id,content});if(error){setNotice("Yorum gönderilemedi.");return}if(!error){setNotice("");setTexts(v=>({...v,[id]:""}));load()}}
 if(loading)return <main className="eventGate">Etkinlikler yükleniyor…</main>;
 if(!session)return <main className="eventGate"><CalendarDays/><h1>Etkinlikleri görmek için giriş yap</h1><a href="/">Giriş sayfasına dön</a></main>;
 const now=Date.now();
 const upcoming=events.filter(event=>new Date(event.event_at).getTime()>=now);
 const past=events.filter(event=>new Date(event.event_at).getTime()<now).reverse();
 function eventCard(e,isPast){const going=parts.filter(p=>p.event_id===e.id&&p.status==="going").length,no=parts.filter(p=>p.event_id===e.id&&p.status==="not_going").length,mine=parts.find(p=>p.event_id===e.id&&p.user_id===session.user.id),d=new Date(e.event_at),cs=comments.filter(x=>x.event_id===e.id);return <article className="eventCard eventCardV7" key={e.id} id={`etkinlik-${e.id}`}>{e.image_url&&<img className="eventCover" src={e.image_url} alt={e.title}/>}<div className="eventBody"><div className="date"><b>{d.toLocaleDateString("tr-TR",{day:"2-digit",timeZone:"Europe/Istanbul"})}</b><span>{d.toLocaleDateString("tr-TR",{month:"short",timeZone:"Europe/Istanbul"}).toUpperCase()}</span></div><div className="eventInfo"><i>{e.category}</i><h3>{e.title}</h3>{e.description&&<p>{e.description}</p>}<div className="meta"><span><CalendarDays size={13}/>{d.toLocaleString("tr-TR",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Istanbul"})}</span>{e.location&&<span><MapPin size={13}/>{e.location}</span>}<span><Users size={13}/>{going} katılıyor · {no} katılmıyor</span></div>{!isPast&&<div className="rsvp"><button className={mine?.status==="going"?"joined":""} aria-pressed={mine?.status==="going"} onClick={()=>rsvp(e.id,"going")}><ThumbsUp size={14}/> Geliyorum</button><button className={mine?.status==="not_going"?"notGoing":""} aria-pressed={mine?.status==="not_going"} onClick={()=>rsvp(e.id,"not_going")}><ThumbsDown size={14}/> Gelemiyorum</button></div>}</div></div><details className="eventComments"><summary><MessageCircle size={15}/> Yorumlar <span>{cs.length}</span></summary>{cs.map(x=><div className="eventComment" key={x.id}><b>{x.profiles?.full_name||"Üye"}</b><p>{x.content}</p></div>)}<div className="commentForm"><input maxLength={1000} aria-label="Etkinlik yorumu" placeholder="Yorum yaz…" value={texts[e.id]||""} onChange={x=>setTexts(v=>({...v,[e.id]:x.target.value}))}/><button onClick={()=>comment(e.id)}>Gönder</button></div></details></article>;
 }
 return <main className="eventsPage">
  <header><a href="/"><ArrowLeft size={18}/> Ana sayfa</a><div className="eventNav"><a href="/anketler">Anketler</a><a href="/secim">Seçim Merkezi</a></div></header>
  <div className="eventsIntro"><h1>Etkinlikler</h1><p>Buluşmaları takip et, konumu gör ve gelip gelemeyeceğini bildir.</p></div>
  {notice&&<p className="eventsNotice" role="alert">{notice}</p>}
  <section className="eventSection"><div className="sectionTitle"><h2>Yaklaşan buluşmalar</h2></div>{upcoming.length?<div className="eventGrid">{upcoming.map(e=>eventCard(e,false))}</div>:<p className="eventsEmpty">Şu anda planlanmış bir buluşma yok.</p>}</section>
  <section className="announcements" id="duyurular"><h2>Duyurular</h2>{notes.length?notes.map(note=><article key={note.id}>{note.pinned&&<Pin size={16}/>}<div><strong>{note.title}</strong><p>{note.content}</p></div></article>):<p className="eventsEmpty">Henüz duyuru yok.</p>}</section>
  {past.length>0&&<section className="eventSection"><div className="sectionTitle"><h2>Geçmiş etkinlikler</h2></div><div className="eventGrid">{past.map(e=>eventCard(e,true))}</div></section>}
 </main>
}