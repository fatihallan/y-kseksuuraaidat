"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ArrowLeft,Wallet,Receipt,FileText,Users,ShieldCheck} from "lucide-react";
import "./aidat.css";

const db=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
const money=n=>Number(n||0).toLocaleString("tr-TR",{minimumFractionDigits:0,maximumFractionDigits:2})+" ₺";
export default function Aidat(){
 const [data,setData]=useState({donemler:[],odemeler:[],uyeler:[],giderler:[],ozet:{}}),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{db.rpc("get_public_aidat_data").then(({data,error})=>{if(error)setError(error.message);else setData(data||{});setLoading(false)})},[]);
 async function pdf(g){if(!g.pdf_path)return;const {data:b,error}=await db.storage.from("aidat-belgeleri").download(g.pdf_path);if(error)return setError(error.message);const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=(g.baslik||"gider-belgesi")+".pdf";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
 if(loading)return <main className="aidatGate">Aidat sistemi yükleniyor…</main>;
 const d=data||{},periods=d.donemler||[],payments=d.odemeler||[],members=d.uyeler||[],expenses=d.giderler||[],o=d.ozet||{},current=periods.find(x=>x.aktif!==false)||periods[0];
 return <main className="aidatPage"><header><a href="/"><ArrowLeft size={18}/> Ana Sayfa</a><div><b>YÜKSEK ŞUURA</b><span>AİDAT ŞEFFAFLIK MERKEZİ</span></div></header>
 <section className="aidatHero"><p>YÜKSEK ŞUURA • MALİ ŞEFFAFLIK</p><h1>Aidat Merkezi</h1><span>Dönemsel aidatlar, ödeme durumları, kasa ve gider belgeleri.</span></section>
 {error&&<div className="aidatError">{error}</div>}
 <section className="aidatSummary"><article><Wallet/><div><b>{current?money(current.tutar):"—"}</b><span>GÜNCEL AİDAT</span></div></article><article><ShieldCheck/><div><b>{money(o.kasa_bakiyesi)}</b><span>KASA BAKİYESİ</span></div></article><article><Users/><div><b>{money(o.toplam_tahsilat)}</b><span>TOPLAM TAHSİLAT</span></div></article><article><Receipt/><div><b>{money(o.toplam_gider)}</b><span>TOPLAM GİDER</span></div></article></section>
 <section className="aidatBox"><div className="boxHead"><div><p>AİDAT TAKİBİ</p><h2>Dönemler ve Üyeler</h2></div><span>{periods.length} dönem</span></div>{periods.length===0?<div className="empty">Henüz aidat dönemi oluşturulmadı.</div>:<div className="periods">{periods.map(period=><article className="publicPeriod" key={period.id}><div className="publicPeriodHead"><div><b>{period.ad}</b><span>{money(period.tutar)}{period.son_odeme_tarihi?" · Son ödeme "+period.son_odeme_tarihi:""}</span></div></div><div className="publicPayments">{members.map(m=>{const p=payments.find(x=>x.donem_id===period.id&&x.aidat_uye_id===m.id),status=p?.durum||"odenmedi";return <div className="publicPayment" key={m.id}><div className="memberMini">{m.avatar_url?<img src={m.avatar_url} alt=""/>:<i>{(m.full_name||"Ü").slice(0,1)}</i>}<div><b>{m.full_name}</b><span>Aidat üyesi</span></div></div><strong className={status}>{status==="odendi"?"ÖDENDİ":status==="muaf"?"MUAF":"ÖDENMEDİ"}</strong><em>{status==="odendi"?money(p?.odenen_tutar):"—"}</em></div>})}</div></article>)}</div>}</section>
 <section className="aidatBox"><div className="boxHead"><div><p>KASA HAREKETLERİ</p><h2>Giderler & Belgeler</h2></div><span>{expenses.length} kayıt</span></div>{expenses.length===0?<div className="empty">Henüz gider kaydı bulunmuyor.</div>:<div className="publicExpenses">{expenses.map(g=><article key={g.id}><div><b>{g.baslik}</b><span>{g.gider_tarihi} · {g.aciklama||"Açıklama yok"}</span></div><strong>{money(g.tutar)}</strong>{g.pdf_path?<button onClick={()=>pdf(g)}><FileText size={15}/> PDF İndir</button>:<em>Belge eklenmedi</em>}</article>)}</div>}</section>
 <footer>Aidat ve gider kayıtları Yüksek Şuura şeffaflık sistemi üzerinden yayımlanmaktadır.</footer></main>
}