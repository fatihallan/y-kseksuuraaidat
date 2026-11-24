"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {ArrowLeft,Vote,FileText,KeyRound,CheckCircle2} from "lucide-react";
import "./election.css";
const db=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
const isFinished=(election,now)=>election.status==="closed"||(election.status==="open"&&now>=new Date(election.ends_at).getTime());
export default function Secim(){
 const [now,setNow]=useState(()=>Date.now());
 const [results,setResults]=useState({});
 const [session,setSession]=useState(null),[elections,setElections]=useState([]),[candidates,setCandidates]=useState([]),[codes,setCodes]=useState([]),[choice,setChoice]=useState({}),[code,setCode]=useState({}),[msg,setMsg]=useState({}),[loading,setLoading]=useState(true);
 async function load(){const {data:{session:s}}=await db.auth.getSession();setSession(s);if(!s){setLoading(false);return}const [{data:e},{data:c},{data:k}]=await Promise.all([db.from("elections").select("*").order("starts_at",{ascending:false}),db.from("election_candidates").select("*").order("sort_order"),db.from("election_codes").select("election_id,user_id,code_hint,used_at").eq("user_id",s.user.id)]);setElections(e||[]);setCandidates(c||[]);setCodes(k||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 useEffect(()=>{
  if(!session)return;
  let active=true;
  async function refreshElections(){
   const {data}=await db.from("elections").select("*").order("starts_at",{ascending:false});
   if(active&&data)setElections(data);
  }
  const timer=setInterval(refreshElections,15000);
  return()=>{active=false;clearInterval(timer)};
 },[session]);
 useEffect(()=>{
  if(!elections.some(election=>election.status==="open"))return;
  const timer=setInterval(()=>setNow(Date.now()),5000);
  return()=>clearInterval(timer);
 },[elections]);
 const finishedIds=elections.filter(election=>election.results_published_at).map(election=>election.id).join(",");
 useEffect(()=>{
  let ignore=false;
  const closed=finishedIds?finishedIds.split(",").map(Number):[];
  setResults({});
  for(const election of closed){
   db.rpc("get_election_results",{p_election_id:election}).then(({data,error})=>{
    if(!ignore)setResults(previous=>({...previous,[election]:{rows:data||[],error:Boolean(error)}}));
   });
  }
  return()=>{ignore=true};
 },[finishedIds]);
 async function rules(e){if(!e.rules_pdf_path)return;const {data,error}=await db.storage.from("election-docs").createSignedUrl(e.rules_pdf_path,120);if(error)return setMsg(v=>({...v,[e.id]:error.message}));window.open(data.signedUrl,"_blank","noopener,noreferrer")}
 async function vote(e){if(!choice[e.id]||!code[e.id])return setMsg(v=>({...v,[e.id]:"Adayı seç ve seçim kodunu gir."}));if(!confirm("Oyun kesinleşecek ve değiştirilemeyecek. Devam edilsin mi?"))return;const {data,error}=await db.rpc("cast_election_vote",{p_election_id:e.id,p_candidate_id:Number(choice[e.id]),p_code:code[e.id]});setMsg(v=>({...v,[e.id]:error?error.message:"Oyun gizli olarak kaydedildi. Makbuz: "+data}));if(!error)load()}
 if(loading)return <main className="electionGate">Seçim sistemi yükleniyor…</main>;
 if(!session)return <main className="electionGate"><Vote/><h1>Üye girişi gerekli</h1><a href="/">Giriş sayfasına dön</a></main>;
 return <main className="electionPage"><header><a href="/"><ArrowLeft size={18}/> Dijital Şuura</a><b>SEÇİM MERKEZİ</b></header><section className="electionHero"><p>YÜKSEK ŞUURA • GİZLİ OY</p><h1>Seçim Merkezi</h1><span>Oy kullanmak için aktif üye hesabı ve yönetim tarafından hesabına atanmış seçim kodu gerekir.</span></section><section className="electionList">{elections.map(e=>{const mine=codes.find(x=>x.election_id===e.id),cs=candidates.filter(x=>x.election_id===e.id),open=e.status==="open"&&now>=new Date(e.starts_at)&&!isFinished(e,now);return <article className="electionCard" key={e.id}><div className="electionTop"><div><i>{open?"Oy verme açık":isFinished(e,now)?"Oy verme tamamlandı":e.status==="draft"?"Hazırlık":now<new Date(e.starts_at)?"Başlamadı":"Sonuç bekleniyor"}</i><h2>{e.title}</h2><p>{e.description||"Yüksek Şuura başkanlık seçimi"}</p></div>{e.rules_pdf_path&&<button onClick={()=>rules(e)}><FileText size={16}/> Seçim Kuralları PDF</button>}</div><div className="electionMeta"><span>{new Date(e.starts_at).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"})} — {new Date(e.ends_at).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"})}</span><span><KeyRound size={14}/>{mine?"Kod atandı ••••"+(mine.code_hint||""):"Kod atanmamış"}</span></div>{e.results_published_at&&<ElectionResults result={results[e.id]}/>}{!isFinished(e,now)&&<div className="candidateGrid">{cs.map(c=><label className={String(choice[e.id])===String(c.id)?"selected":""} key={c.id}><input type="radio" name={"e"+e.id} value={c.id} disabled={!open||mine?.used_at} onChange={()=>setChoice(v=>({...v,[e.id]:c.id}))}/><div><b>{c.name}</b>{c.statement&&<span>{c.statement}</span>}</div></label>)}</div>}{isFinished(e,now)&&!e.results_published_at&&<p className="electionAwaiting">Sonuçların yayınlanması bekleniyor.</p>}{open&&<div className="voteBox">{mine?.used_at?<div className="voted"><CheckCircle2/> Bu seçimde oyun kullanıldı.</div>:<><input type="password" placeholder="Sana verilen seçim kodu" value={code[e.id]||""} onChange={x=>setCode(v=>({...v,[e.id]:x.target.value}))}/><button onClick={()=>vote(e)} disabled={!mine}>Oyumu Kullan</button></>}{msg[e.id]&&<small>{msg[e.id]}</small>}</div>}</article>})}{!elections.length&&<div className="empty">Henüz seçim oluşturulmadı.</div>}</section></main>
}
function ElectionResults({result}){
 if(!result)return <p role="status">Sonuçlar yükleniyor…</p>;
 if(result.error)return <p role="alert">Sonuçlar yüklenemedi. Sayfayı yenileyip tekrar dene.</p>;
 const rows=[...result.rows].sort((first,second)=>Number(second.votes)-Number(first.votes));
 const total=rows.reduce((sum,row)=>sum+Number(row.votes),0);
 const leaders=total?rows.filter(row=>Number(row.votes)===Number(rows[0].votes)):[];
 return <section className="electionResults">
  <h3>Seçim Sonuçları</h3>
  <p>{!total?"Bu seçimde oy kullanılmadı.":leaders.length===1?`Kazanan: ${leaders[0].candidate_name}`:`Eşit oy alan adaylar: ${leaders.map(row=>row.candidate_name).join(", ")}`}</p>
  <p>Toplam oy: {total}</p>
  <ul>{rows.map(row=><li key={row.candidate_id}><span>{row.candidate_name}</span><strong>{row.votes} oy</strong></li>)}</ul>
 </section>;
}
