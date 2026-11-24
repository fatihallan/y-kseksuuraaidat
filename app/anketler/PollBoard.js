"use client";
import {useEffect,useState} from "react";
import "./polls.css";

export default function PollBoard({db,admin=false}){
 const [polls,setPolls]=useState(null),[error,setError]=useState(""),[question,setQuestion]=useState(""),[options,setOptions]=useState(""),[choices,setChoices]=useState({}),[busy,setBusy]=useState(null);
 async function load(){
  const {data,error}=await db.rpc("list_suura_polls");
  if(error){setError("Anketler yüklenemedi.");return}
  setPolls(data||[]);
 }
 useEffect(()=>{void load()},[db]);
 async function run(rpc,args,key){
  setBusy(key);setError("");
  try{
   const {error}=await db.rpc(rpc,args);
   if(error){setError(error.message);return false}
   await load();return true;
  }finally{setBusy(null)}
 }
 async function create(event){
  event.preventDefault();
  const labels=options.split("\n").map(value=>value.trim()).filter(Boolean);
  if(labels.length<2||labels.length>8||labels.some(label=>label.length>80)){setError("Her satıra bir seçenek olacak şekilde 2–8 seçenek yaz. Her seçenek en fazla 80 karakter olabilir.");return}
  if(await run("manage_suura_poll",{p_action:"create",p_question:question,p_options:labels},"create")){setQuestion("");setOptions("");}
 }
 return <div className="pollBoard">
  {admin&&<form className="pollCard pollCreate" onSubmit={create}>
   <h2>Yeni anket</h2>
   <label>Soru<input value={question} onChange={event=>setQuestion(event.target.value)} minLength={3} maxLength={160} required/></label>
   <label>Seçenekler <small>Her satıra bir seçenek yaz.</small><textarea value={options} onChange={event=>setOptions(event.target.value)} rows={4} maxLength={648} required/></label>
   <button disabled={busy!==null}>Anketi aç</button>
  </form>}
  {error&&<p role="alert">{error}</p>}
  <button type="button" disabled={busy!==null} onClick={()=>{setError("");void load()}}>Anketleri yenile</button>
  {polls===null?<p role="status">{error?"Tekrar yüklemeyi dene.":"Anketler yükleniyor…"}</p>:!polls.length?<p>Henüz anket yok.</p>:polls.map(poll=>{
   const total=poll.counts?.reduce((sum,count)=>sum+Number(count),0)||0;
   return <article className="pollCard" key={poll.id}>
    <div className="pollTitle"><h2>{poll.question}</h2><span>{poll.closed_at?"Kapalı":"Oylama açık"}</span></div>
    {poll.counts&&<><p>Toplam {total} oy</p><ul>{poll.options.map((option,index)=>{
     const count=Number(poll.counts[index]||0),percent=total?Math.round(count*100/total):0;
     return <li key={index}><span>{option}{poll.choice===index+1?" · Senin oyun":""}</span><strong>{count} oy · %{percent}</strong><progress value={percent} max={100} aria-label={option}/></li>;
    })}</ul></>}
    {!admin&&!poll.closed_at&&!poll.choice&&<form onSubmit={event=>{event.preventDefault();void run("vote_suura_poll",{p_poll_id:poll.id,p_choice:choices[poll.id]},poll.id)}}>
     <fieldset><legend>Bir seçenek seç</legend>{poll.options.map((option,index)=><label className="pollOption" key={index}><input type="radio" name={`poll-${poll.id}`} checked={choices[poll.id]===index+1} onChange={()=>setChoices(previous=>({...previous,[poll.id]:index+1}))}/>{option}</label>)}</fieldset>
     <button disabled={!choices[poll.id]||busy!==null}>Oy ver</button>
    </form>}
    {admin&&!poll.closed_at&&<button type="button" disabled={busy!==null} onClick={()=>{if(confirm("Bu anket oy vermeye kapatılsın mı?"))void run("manage_suura_poll",{p_action:"close",p_poll_id:poll.id},poll.id)}}>Anketi kapat</button>}
   </article>;
  })}
 </div>;
}
