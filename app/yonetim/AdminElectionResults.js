"use client";
import {useEffect,useState} from "react";

export default function AdminElectionResults({election,db}){
 const [publishedAt,setPublishedAt]=useState(election.results_published_at||null);
 const [publishing,setPublishing]=useState(false);
 const [publishError,setPublishError]=useState("");
 const [attempt,setAttempt]=useState(0);
 const [result,setResult]=useState(null);
 useEffect(()=>{
  let active=true;
  setResult(null);
  db.rpc("get_election_results",{p_election_id:election.id}).then(({data,error})=>{
   if(active)setResult({rows:data||[],error:Boolean(error)});
  });
  return()=>{active=false};
 },[db,election.id,attempt]);

 async function publish(){
  if(publishing||publishedAt||!confirm("Adayların oy sayıları ve sonuçlar Seçim Merkezi’nde üyelere gösterilecek. Yayınlansın mı?"))return;
  setPublishing(true);setPublishError("");
  const {data,error}=await db.rpc("publish_election_results",{p_election_id:election.id});
  setPublishing(false);
  if(error){setPublishError("Sonuçlar yayınlanamadı. Tekrar dene.");return;}
  setPublishedAt(data);setAttempt(value=>value+1);
 }

 const rows=[...(result?.rows||[])].sort((a,b)=>Number(b.votes)-Number(a.votes));
 const total=rows.reduce((sum,row)=>sum+Number(row.votes),0);
 const leaders=total?rows.filter(row=>Number(row.votes)===Number(rows[0].votes)):[];
 return <section className="adminVoteResults" aria-label="Seçim sonuçları">
  <h3>Seçim Sonuçları</h3>
  {!result?<p role="status">Sonuçlar yükleniyor…</p>:result.error?<div role="alert"><p>Sonuçlar yüklenemedi.</p><button type="button" onClick={()=>setAttempt(value=>value+1)}>Tekrar dene</button></div>:<>
   <p>Toplam {total} oy</p>
   {!total?<p>Bu seçimde oy kullanılmadı.</p>:leaders.length===1?<p><strong>Kazanan</strong> {leaders[0].candidate_name}</p>:<p><strong>Eşit oy</strong> {leaders.map(row=>row.candidate_name).join(", ")}</p>}
   <ul>{rows.map(row=><li key={row.candidate_id}><span>{row.candidate_name}</span><strong>{row.votes} oy{total>0&&` · %${(100*Number(row.votes)/total).toLocaleString("tr-TR",{maximumFractionDigits:1})}`}</strong></li>)}</ul>
  </>}
  <div className="adminVoteActions">
   <button type="button" onClick={()=>setAttempt(value=>value+1)}>Oyları yenile</button>
   {publishedAt?<p role="status">Seçim Merkezi’nde yayında.</p>:<button type="button" disabled={publishing||!result||result.error||election.status==="draft"} onClick={publish}>{publishing?"Yayınlanıyor…":"Sonuçları Yayınla"}</button>}
  </div>
  {publishError&&<p role="alert">{publishError}</p>}
 </section>;
}
