"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ArrowRight,CalendarDays,Image as ImageIcon,LogIn,MessageCircle,ShieldCheck,Trophy,UserCircle,Users,X} from "lucide-react";

const supabase=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
const nav=[["Ana Sayfa","/"],["Sohbet","/sohbet"],["Etkinlikler","/etkinlikler"],["Galeri","/galeri"],["Aidat","/aidat"],["Üyeler","/uyeler"]];

export default function Home(){
 const [login,setLogin]=useState(false),[session,setSession]=useState(null),[profile,setProfile]=useState(null),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 useEffect(()=>{async function sync(v){if(v?.user?.user_metadata?.onboarding_required){location.replace("/ilk-giris");return}setSession(v);if(v){const {data:p}=await supabase.from("profiles").select("role,is_active").eq("id",v.user.id).single();setProfile(p)}else setProfile(null)}supabase.auth.getSession().then(({data})=>sync(data.session));const {data:s}=supabase.auth.onAuthStateChange((_e,v)=>sync(v));return()=>s.subscription.unsubscribe()},[]);
 async function signIn(e){e.preventDefault();setBusy(true);setMsg("");const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error)setMsg("Giriş yapılamadı: "+error.message);else{setLogin(false);setPassword("")}}
 async function forgotPassword(){if(!email){setMsg("Önce e-posta adresini yaz.");return}setBusy(true);setMsg("");const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/sifre-yenile"});setBusy(false);setMsg(error?"Sıfırlama bağlantısı gönderilemedi: "+error.message:"Şifre yenileme bağlantısını e-postana gönderdik.")}
 async function signOut(){await supabase.auth.signOut()}
 return <main>
  <header className="top"><a className="brand" href="/"><span className="mark">YŞ</span><span>YÜKSEK ŞUURA<small>DİJİTAL TOPLULUK</small></span></a>
   <nav>{nav.map(([n,h])=><a key={n} href={h}>{n}</a>)}</nav>
   {session?<div className="actions"><a className="ghost" href="/profil"><UserCircle size={17}/> Profilim</a>{profile?.role==="admin"&&profile?.is_active&&<a className="login" href="/yonetim"><ShieldCheck size={17}/> Yönetim Merkezi</a>}<button className="ghost" onClick={signOut}>Çıkış</button></div>:<button className="login" onClick={()=>setLogin(true)}><LogIn size={17}/> Üye Girişi</button>}
  </header>

  <section className="hero simpleHero">
   <div className="heroCopy">
    <div className="eyebrow">YÜKSEK ŞUURA • DİJİTAL TOPLULUK</div>
    <h1><span>DİJİTAL</span><br/><em>ŞUURA</em></h1>
    <p>Dostluk, birlik, aktivite ve gelenek. Yüksek Şuura'nın sohbeti, etkinlikleri ve ortak hafızası artık tek yerde.</p>
    <div className="actions"><a className="primary" href={session?"/sohbet":"#hakkimizda"}>{session?"Şuura'ya Gir":"Platformu Keşfet"} <ArrowRight size={18}/></a><a className="secondary" href="/sohbet"><MessageCircle size={18}/> Sohbete Git</a></div>
   </div>
  </section>

  <section id="hakkimizda" className="section"><div className="sectionHead"><span>TEK MERKEZ</span><h2>Şuura'nın dijital evi.</h2><p>Sohbeti, etkinlikleri, üyeleri ve ortak anılarımızı tek çatı altında topluyoruz.</p></div>
   <div className="grid">
    <Card icon={<MessageCircle/>} title="Şuura Sohbeti" text="Kanallarda konuş, gündemi ve planları tek yerde tut." href="/sohbet"/>
    <Card icon={<Trophy/>} title="Yüksek Şuura Spor Kulübü" text="Takım ruhunu, spor faaliyetlerini ve Şuura’nın saha kültürünü keşfet." href="/spor-kulubu"/><Card icon={<CalendarDays/>} title="Etkinlikler" text="Halı saha, buluşma ve organizasyonları takip et." href="/etkinlikler"/>
    <Card icon={<Users/>} title="Şuura Üyeleri" text="Aktif üyeleri ve dijital Şuura kimliklerini görüntüle." href="/uyeler"/>
    <Card icon={<ImageIcon/>} title="Anı Arşivi" text="Fotoğraf ve videoları Şuura'nın ortak arşivinde topla." href="/galeri"/>
   </div>
  </section>

  <section id="etkinlikler" className="band"><div><span>ŞUURA AKTİF</span><h2>Planlar artık tek merkezde.</h2><p>Etkinlikleri gör, katılımını bildir ve Şuura buluşmalarını kaçırma.</p><a className="primary" href="/etkinlikler">Etkinlikleri Aç <ArrowRight size={16}/></a></div><CalendarDays size={72}/></section>
  <section id="galeri" className="section compact"><div className="sectionHead"><span>ŞUURA SOHBETİ</span><h2>Muhabbet burada devam ediyor.</h2><p>Kanallara gir, fotoğraf veya dosya paylaş ve Şuura gündemini tek yerde tut.</p><div className="actions"><a className="primary" href="/sohbet"><MessageCircle size={17}/> Sohbeti Aç</a><a className="secondary" href="/galeri"><ImageIcon size={17}/> Galeriye Git</a></div></div></section>
  <footer><div className="brand"><span className="mark">YŞ</span><span>YÜKSEK ŞUURA<small>DİJİTAL ŞUURA • 2026</small></span></div><p>Birlikte geçen zamanın dijital hafızası.</p></footer>

  {login&&<div className="modal" onMouseDown={e=>e.target===e.currentTarget&&setLogin(false)}><div className="loginBox"><button className="close" onClick={()=>setLogin(false)}><X/></button><div className="loginIcon"><ShieldCheck/></div><span className="mini">ÜYE ALANI</span><h2>Şuura'ya giriş yap</h2><p>Yetkili hesabınla Dijital Şuura'ya eriş.</p><form onSubmit={signIn}><label>E-posta</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/><label>Şifre</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className="forgotLink" onClick={forgotPassword} disabled={busy}>Şifremi unuttum</button>{msg&&<div className="error">{msg}</div>}<button className="primary full" disabled={busy}>{busy?"Giriş yapılıyor...":"Giriş Yap"} <ArrowRight size={18}/></button></form></div></div>}
 </main>
}
function Card({icon,title,text,href}){return <a className="feature" href={href}><div className="featureIcon">{icon}</div><h3>{title}</h3><p>{text}</p><span>Keşfet <ArrowRight size={15}/></span></a>}