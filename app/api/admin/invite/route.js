import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";

const url="https://kzhklbtdyzinfacaotuh.supabase.co";
const anon="sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9";

export async function POST(req){
 try{
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY; // production secret
  if(!secret)return NextResponse.json({error:"Sunucu davet anahtarı ayarlanmamış."},{status:503});
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/,"");
  if(!token)return NextResponse.json({error:"Oturum gerekli."},{status:401});
  const userDb=createClient(url,anon,{global:{headers:{Authorization:"Bearer "+token}}});
  const {data:{user},error:userError}=await userDb.auth.getUser(token);
  if(userError||!user)return NextResponse.json({error:"Geçersiz oturum."},{status:401});
  const {data:profile}=await userDb.from("profiles").select("role,is_active").eq("id",user.id).single();
  if(profile?.role!=="admin"||!profile?.is_active)return NextResponse.json({error:"Yalnızca yönetici üye davet edebilir."},{status:403});
  const {email,full_name}=await req.json();
  const cleanEmail=String(email||"").trim().toLowerCase();
  const cleanName=String(full_name||"").trim();
  if(!cleanEmail||!cleanName)return NextResponse.json({error:"Ad soyad ve e-posta gerekli."},{status:400});
  const admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  const origin=new URL(req.url).origin;
  const {data,error}=await admin.auth.admin.inviteUserByEmail(cleanEmail,{redirectTo:origin+"/ilk-giris",data:{full_name:cleanName,onboarding_required:true}});
  if(error)return NextResponse.json({error:error.message},{status:400});
  if(data?.user?.id)await admin.from("profiles").update({full_name:cleanName,role:"member",is_active:true}).eq("id",data.user.id);
  return NextResponse.json({ok:true,message:cleanName+" için davet gönderildi."});
 }catch(e){return NextResponse.json({error:e?.message||"Davet gönderilemedi."},{status:500})}
}
export async function DELETE(req){
 try{
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret)return NextResponse.json({error:"Sunucu yönetim anahtarı ayarlanmamış."},{status:503});
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/,"");
  if(!token)return NextResponse.json({error:"Oturum gerekli."},{status:401});
  const userDb=createClient(url,anon,{global:{headers:{Authorization:"Bearer "+token}}});
  const {data:{user},error:userError}=await userDb.auth.getUser(token);
  if(userError||!user)return NextResponse.json({error:"Geçersiz oturum."},{status:401});
  const {data:profile}=await userDb.from("profiles").select("role,is_active").eq("id",user.id).single();
  if(profile?.role!=="admin"||!profile?.is_active)return NextResponse.json({error:"Yalnızca yönetici üye silebilir."},{status:403});
  const {user_id}=await req.json();
  if(!user_id||user_id===user.id)return NextResponse.json({error:"Bu hesap silinemez."},{status:400});
  const admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  const {error}=await admin.auth.admin.deleteUser(user_id);
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true,message:"Üye tamamen silindi. E-posta yeniden davet edilebilir."});
 }catch(e){return NextResponse.json({error:e?.message||"Üye silinemedi."},{status:500})}
}
