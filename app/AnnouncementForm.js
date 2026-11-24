"use client";
import {useState} from "react";
import "./announcement-form.css";

export default function AnnouncementForm({db,userId,onPublished}){
 const [title,setTitle]=useState(""),[content,setContent]=useState(""),[pinned,setPinned]=useState(false);
 const [saving,setSaving]=useState(false),[message,setMessage]=useState(null);
 async function publish(event){
  event.preventDefault();
  if(saving)return;
  if(!title.trim()||!content.trim()){setMessage({error:true,text:"Başlığı ve duyuru metnini yaz."});return}
  setSaving(true);setMessage(null);
  try{
   const {error}=await db.from("announcements").insert({title:title.trim(),content:content.trim(),pinned,created_by:userId});
   if(error)throw error;
   setTitle("");setContent("");setPinned(false);
   setMessage({text:"Duyuru üye ana sayfasında ve Duyurular bölümünde yayınlandı."});
   if(onPublished)void onPublished();
  }catch(error){
   setMessage({error:true,text:error?.code==="42501"?"Duyuru yayınlamak için aktif yönetici hesabı gerekiyor.":"Duyuru yayınlanamadı. Tekrar dene."});
  }finally{setSaving(false)}
 }
 return <form className="announcementComposer" onSubmit={publish}>
  <h2>Yeni duyuru</h2>
  <label>Başlık<input value={title} onChange={event=>setTitle(event.target.value)} maxLength={160} required/></label>
  <label>Duyuru metni<textarea value={content} onChange={event=>setContent(event.target.value)} rows={5} maxLength={3000} required/></label>
  <label className="announcementPin"><input type="checkbox" checked={pinned} onChange={event=>setPinned(event.target.checked)}/> Duyurular listesinde üste sabitle</label>
  <button type="submit" disabled={saving}>{saving?"Yayınlanıyor…":"Duyuruyu yayınla"}</button>
  {message&&<p role={message.error?"alert":"status"}>{message.text}</p>}
 </form>;
}
