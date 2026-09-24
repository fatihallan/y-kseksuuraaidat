"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ArrowRight,CalendarDays,Image as ImageIcon,LogIn,MessageCircle,ShieldCheck,Users,WalletCards,X} from "lucide-react";

const supabase=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
const nav=[["Ana Sayfa","/"],["Sohbet","/sohbet"],["Etkinlikler","/etkinlikler"],["Galeri","/galeri"],["Üyeler","/uyeler"]];

export default function Home(){
 const [login,setLogin]=useState(false),[session,setSession]=useState(null),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:s}=supabase.auth.onAuthStateChange((_e,v)=>setSession(v));return()=>s.subscription.unsubscribe()},[]);
 async function signIn(e){e.preventDefault();setBusy(true);setMsg("");const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error)setMsg("Giriş yapılamadı: "+error.message);else{setLogin(false);setPassword("")}}
 async function signOut(){await supabase.auth.signOut()}
 return <main>
  <header className="top"><a className="brand" href="/"><span className="mark">YŞ</span><span>YÜKSEK ŞÛRA<small>DİJİTAL TOPLULUK</small></span></a>
   <nav>{nav.map(([n,h])=><a key={n} href={h}>{n}</a>)}</nav>
   {session?<button className="ghost" onClick={signOut}>Çıkış</button>:<button className="login" onClick={()=>setLogin(true)}><LogIn size={17}/> Üye Girişi</button>}
  </header>

  <section className="hero">
   <div className="glow one"/><div className="glow two"/>
   <div className="heroCopy"><div className="eyebrow"><span/> YÜKSEK ŞÛRA DİJİTAL PLATFORMU</div>
    <h1>DİJİTAL<br/><em>ŞÛRA</em></h1>
    <p>Dostluğun, birlikteliğin ve yıllardır biriken anıların dijital merkezi. Etkinliklerden aidat takibine, sohbetten arşive kadar Şûra burada.</p>
    <div className="actions"><a className="primary" href={session?"/sohbet":"#hakkimizda"}>{session?"Şûra'ya Gir":"Platformu Keşfet"} <ArrowRight size={18}/></a><a className="secondary" href="/sohbet"><MessageCircle size={18}/> Sohbete Git</a></div>
    <div className="motto"><b>DOSTLUK</b><i/>BİRLİK<i/>AKTİVİTE<i/>GELENEK</div>
   </div>
   <div className="sigil"><div className="ring"><span>YŞ</span><small>MMXXI</small></div><div className="online">● ŞÛRA ÇEVRİMİÇİ</div></div>
  </section>

  <section id="hakkimizda" className="section"><div className="sectionHead"><span>TEK MERKEZ</span><h2>Şûra'nın dijital evi.</h2><p>Sohbeti, etkinlikleri, üyeleri ve ortak anılarımızı tek çatı altında topluyoruz.</p></div>
   <div className="grid">
    <Card icon={<MessageCircle/>} title="Şûra Sohbeti" text="Kanallarda konuş, gündemi ve planları tek yerde tut." href="/sohbet"/>
    <Card icon={<CalendarDays/>} title="Etkinlikler" text="Halı saha, buluşma ve organizasyonları takip et." href="/etkinlikler"/>
    <Card icon={<Users/>} title="Şûra Üyeleri" text="Aktif üyeleri ve dijital Şûra kimliklerini görüntüle." href="/uyeler"/>
    <Card icon={<ImageIcon/>} title="Anı Arşivi" text="Fotoğraf ve videoları Şûra'nın ortak arşivinde topla." href="/galeri"/>
   </div>
  </section>

  <section id="etkinlikler" className="band"><div><span>ŞÛRA AKTİF</span><h2>Planlar artık tek merkezde.</h2><p>Etkinlikleri gör, katılımını bildir ve Şûra buluşmalarını kaçırma.</p><a className="primary" href="/etkinlikler">Etkinlikleri Aç <ArrowRight size={16}/></a></div><CalendarDays size={72}/></section>
  <section id="galeri" className="section compact"><div className="sectionHead"><span>ŞÛRA SOHBETİ</span><h2>Muhabbet burada devam ediyor.</h2><p>Kanallara gir, fotoğraf veya dosya paylaş ve Şûra gündemini tek yerde tut.</p><div className="actions"><a className="primary" href="/sohbet"><MessageCircle size={17}/> Sohbeti Aç</a><a className="secondary" href="/galeri"><ImageIcon size={17}/> Galeriye Git</a></div></div></section>
  <footer><div className="brand"><span className="mark">YŞ</span><span>YÜKSEK ŞÛRA<small>DİJİTAL ŞÛRA • 2026</small></span></div><p>Birlikte geçen zamanın dijital hafızası.</p></footer>

  {login&&<div className="modal" onMouseDown={e=>e.target===e.currentTarget&&setLogin(false)}><div className="loginBox"><button className="close" onClick={()=>setLogin(false)}><X/></button><div className="loginIcon"><ShieldCheck/></div><span className="mini">ÜYE ALANI</span><h2>Şûra'ya giriş yap</h2><p>Yetkili hesabınla Dijital Şûra'ya eriş.</p><form onSubmit={signIn}><label>E-posta</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/><label>Şifre</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>{msg&&<div className="error">{msg}</div>}<button className="primary full" disabled={busy}>{busy?"Giriş yapılıyor...":"Giriş Yap"} <ArrowRight size={18}/></button></form></div></div>}
 </main>
}
function Card({icon,title,text,href}){return <a className="feature" href={href}><div className="featureIcon">{icon}</div><h3>{title}</h3><p>{text}</p><span>Keşfet <ArrowRight size={15}/></span></a>}