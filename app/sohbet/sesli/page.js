"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import "./voice.css";

const db=createClient("https://kzhklbtdyzinfacaotuh.supabase.co","sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9");
const topic="suura-voice-general-v1";
const iceServers=[{urls:"stun:stun.l.google.com:19302"}];

export default function VoiceRoom(){
 const [member,setMember]=useState(null),[checking,setChecking]=useState(true);
 const [status,setStatus]=useState("idle"),[error,setError]=useState("");
 const [muted,setMuted]=useState(false),[devices,setDevices]=useState([]),[device,setDevice]=useState("");
 const [participants,setParticipants]=useState([]),[streams,setStreams]=useState({}),[connections,setConnections]=useState({});
 const room=useRef(null);

 function leave(){
  const current=room.current;
  room.current=null;
  if(!current)return;
  clearTimeout(current.timer);
  current.stream?.getTracks().forEach(track=>track.stop());
  current.peers.forEach(({pc})=>pc.close());
  if(current.channel)void db.removeChannel(current.channel);
 }

 useEffect(()=>{
  let alive=true;
  async function check(session){
   if(!session){if(alive){leave();setMember(null);setStatus("idle");setParticipants([]);setStreams({});setConnections({});setChecking(false)}return;}
   const {data}=await db.from("profiles").select("full_name,is_active").eq("id",session.user.id).maybeSingle();
   if(alive){setMember(data?.is_active?{name:data.full_name||"Üye"}:null);setChecking(false);}
  }
  db.auth.getSession().then(({data})=>check(data.session));
  const {data}=db.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT")void check(null)});
  const onPageHide=()=>disconnect();
  window.addEventListener("pagehide",onPageHide);
  return()=>{alive=false;window.removeEventListener("pagehide",onPageHide);data.subscription.unsubscribe();leave()};
 },[]);

 function disconnect(message=""){
  leave();
  setStatus("idle");setParticipants([]);setStreams({});setConnections({});setError(message);
 }

 async function selectMicrophone(id){
  const current=room.current;
  if(!current?.stream){setDevice(id);return;}
  if(current.switching)return;
  current.switching=true;
  let next;
  try{
   next=await microphone(id);
   if(room.current!==current){next.getTracks().forEach(track=>track.stop());return;}
   const track=next.getAudioTracks()[0];
   const oldTrack=current.stream.getAudioTracks()[0];
   track.enabled=oldTrack.enabled;
   const senders=[...current.peers.values()].map(peer=>peer.sender);
   const switched=await Promise.allSettled(senders.map(sender=>sender.replaceTrack(track)));
   if(switched.some(result=>result.status==="rejected")){
    await Promise.allSettled(senders.map(sender=>sender.replaceTrack(oldTrack)));
    throw Error("Mikrofon değiştirilemedi.");
   }
   if(room.current!==current){next.getTracks().forEach(track=>track.stop());return;}
   current.stream.getTracks().forEach(item=>item.stop());
   current.stream=next;
   setDevice(id);setError("");
  }catch{next?.getTracks().forEach(track=>track.stop());if(room.current===current)setError("Mikrofon değiştirilemedi.");}
  finally{current.switching=false;}
 }

 async function join(){
  if(room.current||!member)return;
  if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){setError("Bu tarayıcı sesli sohbeti desteklemiyor.");return;}
  const current={id:crypto.randomUUID(),peers:new Map(),present:new Map(),stream:null,channel:null};
  room.current=current;setStatus("joining");setError("");setMuted(false);
  const live=()=>room.current===current;
  const trackPresence=()=>current.channel.track({id:current.id,name:member.name,muted:!current.stream.getAudioTracks()[0].enabled});
  current.trackPresence=trackPresence;

  try{
   const stream=await microphone(device);
   if(!live()){stream.getTracks().forEach(track=>track.stop());return;}
   current.stream=stream;
   navigator.mediaDevices.enumerateDevices().then(items=>{if(live())setDevices(items.filter(item=>item.kind==="audioinput"))}).catch(()=>{});
   await db.realtime.setAuth();
   if(!live())return;
   const channel=db.channel(topic,{config:{private:true,presence:{key:current.id}}});
   current.channel=channel;
   const signal=(to,body)=>channel.send({type:"broadcast",event:"signal",payload:{from:current.id,to,...body}});
   function addPeer(id){
    if(current.peers.has(id))return current.peers.get(id);
    const pc=new RTCPeerConnection({iceServers});
    const audio=current.stream.getAudioTracks()[0];
    const sender=pc.addTrack(audio,current.stream);
    const peer={pc,sender,pending:[],queue:Promise.resolve()};
    current.peers.set(id,peer);
    pc.ontrack=event=>{if(live()&&current.peers.get(id)===peer)setStreams(previous=>({...previous,[id]:event.streams[0]||new MediaStream([event.track])}));};
    pc.onicecandidate=event=>{if(live()&&event.candidate)void signal(id,{candidate:event.candidate.toJSON()});};
    pc.onconnectionstatechange=()=>{if(live()&&current.peers.get(id)===peer)setConnections(previous=>({...previous,[id]:pc.connectionState}));};
    return peer;
   }
   function queue(id,task){
    const peer=addPeer(id);
    peer.queue=peer.queue.then(()=>{if(live()&&current.peers.get(id)===peer)return task(peer)}).catch(()=>{
     if(live()&&current.peers.get(id)===peer)setConnections(previous=>({...previous,[id]:"failed"}));
    });
   }
   channel.on("presence",{event:"sync"},()=>{
    if(!live())return;
    const present=new Map(Object.entries(channel.presenceState()).filter(([id,list])=>/^[0-9a-f-]{36}$/.test(id)&&list.length).map(([id,list])=>[id,{id,name:String(list[0].name||"Üye").slice(0,100),muted:Boolean(list[0].muted)}]));
    current.present=present;setParticipants([...present.values()]);
    for(const [id,{pc}] of current.peers){
     if(present.has(id))continue;
     current.peers.delete(id);pc.close();
     setStreams(previous=>Object.fromEntries(Object.entries(previous).filter(([key])=>key!==id)));
     setConnections(previous=>Object.fromEntries(Object.entries(previous).filter(([key])=>key!==id)));
    }
    for(const id of present.keys()){
     if(id===current.id||current.peers.has(id)||current.id>id)continue;
     queue(id,async ({pc})=>{
      await pc.setLocalDescription(await pc.createOffer());
      if(live())await signal(id,{description:pc.localDescription.toJSON()});
     });
    }
   }).on("broadcast",{event:"signal"},({payload})=>{
    if(!live()||payload?.to!==current.id||payload.from===current.id||!/^[0-9a-f-]{36}$/.test(payload.from||""))return;
    const id=payload.from;
    queue(id,async ({pc,pending})=>{
     const description=payload.description;
     if((description?.type==="offer"&&id<current.id)||(description?.type==="answer"&&id>current.id)){
      await pc.setRemoteDescription(description);
      for(const candidate of pending.splice(0))await pc.addIceCandidate(candidate);
      if(description.type==="offer"){
       await pc.setLocalDescription(await pc.createAnswer());
       if(live())await signal(id,{description:pc.localDescription.toJSON()});
      }
     }else if(payload.candidate){
      if(pc.remoteDescription)await pc.addIceCandidate(payload.candidate);
      else if(pending.length<64)pending.push(payload.candidate);
     }
    });
   }).subscribe(async state=>{
    if(!live())return;
    if(state==="SUBSCRIBED"){
     if(await trackPresence()!=="ok"){if(live())disconnect("Odaya katılınamadı. Tekrar dene.");return;}
     if(live()){clearTimeout(current.timer);setStatus("joined");}
    }else if(["CHANNEL_ERROR","TIMED_OUT","CLOSED"].includes(state))disconnect("Sesli oda bağlantısı kesildi. Tekrar katılabilirsin.");
   });
   current.timer=setTimeout(()=>{if(live())disconnect("Sesli odaya bağlanılamadı. Tekrar dene.");},12000);
  }catch(error){
   if(live())disconnect(error.name==="NotAllowedError"?"Tarayıcı ayarlarından mikrofon iznini açıp tekrar dene.":"Mikrofon açılamadı. Bir mikrofon bağlı olduğunu kontrol et.");
  }
 }

 function toggleMute(){
  const current=room.current;
  if(!current?.stream||current.switching)return;
  const track=current.stream.getAudioTracks()[0];
  track.enabled=!track.enabled;setMuted(!track.enabled);void current.trackPresence();
 }

 return <main className="voicePage">
  <a href="/sohbet">← Yazılı sohbete dön</a>
  <h1>Genel Sesli Oda</h1>
  {checking?<p role="status">Üyelik kontrol ediliyor…</p>:!member?<p>Sesli odaya katılmak için aktif üye hesabınla <a href="/">giriş yap</a>.</p>:<>
   <p>Mikrofon izni, odaya katılırken istenir.</p>
   <div className="voiceControls">
    {status==="idle"?<button type="button" onClick={join}>Odaya katıl</button>:<button type="button" onClick={()=>disconnect()}>{status==="joining"?"Bağlanmayı iptal et":"Odadan ayrıl"}</button>}
    {status==="joined"&&<button type="button" aria-pressed={muted} onClick={toggleMute}>{muted?"Mikrofonu aç":"Mikrofonu sustur"}</button>}
   </div>
   {status==="joining"&&<p role="status">Odaya bağlanılıyor…</p>}
   {error&&<p role="alert">{error}</p>}
   {status==="joined"&&<>
    <label>Mikrofon<select value={device} onChange={event=>void selectMicrophone(event.target.value)}><option value="">Varsayılan mikrofon</option>{devices.filter(item=>item.deviceId&&item.deviceId!=="default").map((item,index)=><option key={item.deviceId} value={item.deviceId}>{item.label||`Mikrofon ${index+1}`}</option>)}</select></label>
    <h2>Katılımcılar</h2>
    <ul>{participants.map(person=><li key={person.id}><span>{person.name}{person.id===room.current?.id?" (sen)":""}</span><span>{connections[person.id]==="failed"?"Bağlanamadı":person.muted?"Mikrofon kapalı":person.id===room.current?.id||connections[person.id]==="connected"?"Mikrofon açık":"Bağlanıyor…"}</span></li>)}</ul>
    {Object.entries(streams).map(([id,stream])=><RemoteAudio key={id} stream={stream}/>)}
   </>}
  </>}
 </main>;
}

function microphone(id){
 return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,...(id?{deviceId:{exact:id}}:{})}});
}

function RemoteAudio({stream}){
 const audio=useRef(null);
 const [blocked,setBlocked]=useState(false);
 useEffect(()=>{
  const element=audio.current;
  let active=true;
  element.srcObject=stream;
  element.play().catch(()=>{if(active)setBlocked(true)});
  return()=>{active=false;element.srcObject=null};
 },[stream]);
 return <><audio ref={audio} autoPlay playsInline/>{blocked&&<button type="button" onClick={()=>audio.current.play().then(()=>setBlocked(false)).catch(()=>{})}>Oda sesini oynat</button>}</>;
}
