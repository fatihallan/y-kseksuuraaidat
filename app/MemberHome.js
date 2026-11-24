"use client";
import {useEffect,useState} from "react";
import {ArrowUpRight,Bell,CalendarDays,Mic,Vote,Wallet} from "lucide-react";
import "./member-home.css";

const formatDate=value=>new Date(value).toLocaleString("tr-TR",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Istanbul"});
export default function MemberHome({db,userId,name}){
 const [summary,setSummary]=useState(null),[voice,setVoice]=useState(null),[announcement,setAnnouncement]=useState(null);
 useEffect(()=>{
  let active=true,channel;
  setSummary(null);setVoice(null);setAnnouncement(null);
  async function read(){
   const [event,dues]=await Promise.all([
    db.from("events").select("id,title,event_at,location").gte("event_at",new Date().toISOString()).order("event_at").limit(1).maybeSingle(),
    db.from("aidat_donemleri").select("id,ad").eq("aktif",true).order("yil",{ascending:false}).order("ay",{ascending:false}).limit(1).maybeSingle()
   ]);
   const payment=dues.data?await db.rpc("get_my_suura_dues",{p_period_id:dues.data.id}):{};
   if(active)setSummary({event,dues,payment});
  }
  async function observe(){
   try{
    await db.realtime.setAuth();
    if(!active)return;
    channel=db.channel("suura-voice-general-v1",{config:{private:true,presence:{enabled:true}}});
    channel.on("presence",{event:"sync"},()=>{
     if(active)setVoice(Object.values(channel.presenceState()).flat().map(person=>String(person.name||"Üye")));
    }).subscribe(status=>{if(active&&["CHANNEL_ERROR","TIMED_OUT","CLOSED"].includes(status))setVoice(null)});
   }catch{if(active)setVoice(null);}
  }
  async function readAnnouncement(){
   const latest=await db.from("announcements").select("title,content").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle();
   if(active)setAnnouncement(latest);
  }
  void read();void observe();void readAnnouncement();
  const timer=setInterval(readAnnouncement,15000);
  return()=>{active=false;clearInterval(timer);if(channel)void db.removeChannel(channel)};
 },[db,userId]);
 const event=summary?.event.data,note=announcement?.data,dues=summary?.dues.data;
 const paymentLabel={odendi:"Ödendi",odenmedi:"Ödenmedi",muaf:"Muaf"}[summary?.payment.data];
 return <section className="memberHome">
  <h1>Merhaba{name?`, ${name}`:""}.</h1>
  <div className="memberHomeGrid">
   <Card icon={CalendarDays} title="Sıradaki etkinlik" href={event?`/etkinlikler#etkinlik-${event.id}`:"/etkinlikler"}><strong>{event?.title||(!summary?"Yükleniyor…":summary.event.error?"Takvim yüklenemedi":"Planlanmış etkinlik yok")}</strong>{event&&<p>{formatDate(event.event_at)}{event.location&&` · ${event.location}`}</p>}</Card>
   <Card icon={Wallet} title="Aidat durumun" href="/aidat"><strong>{paymentLabel||(!summary?"Yükleniyor…":summary.dues.error||summary.payment.error?"Aidat yüklenemedi":dues?"Hesabına bağlı kayıt yok":"Aktif aidat dönemi yok")}</strong>{dues&&<p>{dues.ad}</p>}</Card>
   <Card icon={Bell} title="Son duyuru" href="/etkinlikler#duyurular"><strong>{note?.title||(!announcement?"Yükleniyor…":announcement.error?"Duyuru yüklenemedi":"Henüz duyuru yok")}</strong>{note&&<p>{note.content}</p>}</Card>
   <Card icon={Mic} title="Genel Sesli Oda" href="/sohbet/sesli"><strong>{voice===null?"Oda durumuna bağlanılıyor":voice.length?`${voice.length} katılımcı`:"Oda boş"}</strong>{voice?.length>0&&<p>{voice.join(", ")}</p>}</Card>
   <Card icon={Vote} title="Şuura Anketleri" href="/anketler"><strong>Anketleri ve sonuçları gör</strong></Card>
  </div>
 </section>;
}
function Card({icon:Icon,title,href,children}){
 return <a className="memberHomeCard" href={href}><span><Icon size={18}/> {title}<ArrowUpRight size={16}/></span>{children}</a>;
}
