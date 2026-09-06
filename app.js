const SUPABASE_URL='https://kzhklbtdyzinfacaotuh.supabase.co';
const SUPABASE_KEY='sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9';
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let D={members:[],periods:[],payments:[],expenses:[],logs:[],settings:{}},periodId=null,reportPeriodId=null,isAdmin=false;

async function run(table,fn){const {data,error}=await fn(db.from(table));if(error){alert('Hata: '+error.message);throw error}return data}
async function refreshAuth(){const {data:{session}}=await db.auth.getSession();isAdmin=!!session;renderAuth()}
function renderAuth(){const a=$('#authArea');if(isAdmin){a.innerHTML='<span class="viewer">✏️ Düzenleme modu aktif</span><button class="authbtn" id="logoutBtn">Çıkış</button>';$('#logoutBtn').onclick=async()=>{await db.auth.signOut();await refreshAuth();load()}}else{a.innerHTML='<span class="viewer">👁️ Görüntüleme modu</span><button class="authbtn" id="loginBtn">Yönetici Girişi</button>';$('#loginBtn').onclick=openLogin}}
function requireAdmin(){if(!isAdmin){alert('Bu işlem sadece yönetici içindir.');return false}return true}
function openLogin(){modal(`<h3>Yönetici Girişi</h3><form id="loginForm"><input id="loginEmail" type="email" placeholder="E-posta" required><input id="loginPassword" type="password" placeholder="Şifre" required><div class="actions"><button type="button" id="cancel">Vazgeç</button><button class="primary">Giriş Yap</button></div></form>`);$('#cancel').onclick=close;$('#loginForm').onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$('#loginEmail').value,password:$('#loginPassword').value});if(error){alert('Giriş yapılamadı: '+error.message);return}close();await refreshAuth();load()}}
async function load(){
 const jobs=[run('members',q=>q.select('*').eq('active',true).order('name')),run('periods',q=>q.select('*').order('sort_order')),run('payments',q=>q.select('*')),run('expenses',q=>q.select('*').order('expense_date',{ascending:false})),run('logs',q=>q.select('*').order('created_at',{ascending:false}).limit(100)),run('settings',q=>q.select('*').eq('id',1).maybeSingle())];
 const [members,periods,payments,expenses,logs,settings]=await Promise.all(jobs);
 D={members:members||[],periods:periods||[],payments:payments||[],expenses:expenses||[],logs:logs||[],settings:settings||{}};
 if(!periodId&&D.periods.length)periodId=D.periods[0].id;
 if(!reportPeriodId&&D.periods.length)reportPeriodId=D.periods[0].id;
 render();
}
const pay=(m,p)=>D.payments.find(x=>+x.member_id===+m&&+x.period_id===+p);
async function log(action,details){await run('logs',q=>q.insert({action,details}))}
function applySettings(){
 const s=D.settings||{};
 $('#bannerEyebrow').textContent=s.banner_eyebrow||'YÜKSEK ŞUURA';
 $('#bannerTitle').textContent=s.banner_title||'Aidat ve kasa yönetimi';
 $('#bannerText').textContent=s.banner_text||'Tüm veriler ortak veritabanında saklanır.';
 const logo=$('#brandLogo');
 logo.innerHTML=s.logo_url?`<img src="${esc(s.logo_url)}" alt="Logo">`:'YS';
}
function render(){
 applySettings();
 const expected=D.periods.reduce((a,p)=>a+Number(p.amount)*D.members.length,0);
 const paid=D.payments.filter(x=>x.status==='paid').reduce((a,x)=>a+Number(x.amount||0),0);
 const expense=D.expenses.reduce((a,x)=>a+Number(x.amount||0),0);
 $('#stats').innerHTML=[['Toplam Üye',D.members.length],['Beklenen Aidat',money(expected)],['Tahsil Edilen',money(paid)],['Kasa Bakiyesi',money(paid-expense)]].map(x=>`<div class="stat"><label>${x[0]}</label><strong>${x[1]}</strong><small>güncel durum</small></div>`).join('');
 $('#homeTable').innerHTML=`<table><thead><tr><th>Üye</th><th>Toplam</th><th>Ödenen</th><th>Kalan</th></tr></thead><tbody>${D.members.map(m=>{let t=D.periods.reduce((a,p)=>a+Number(p.amount),0),o=D.periods.reduce((a,p)=>a+(pay(m.id,p.id)?.status==='paid'?Number(pay(m.id,p.id).amount):0),0);return `<tr><td>${esc(m.name)}</td><td>${money(t)}</td><td>${money(o)}</td><td>${money(t-o)}</td></tr>`}).join('')}</tbody></table>`;
 renderDues();renderExpenses();renderMembers();renderLogs();renderReports();renderSettings();
 document.querySelectorAll('[data-admin]').forEach(el=>el.style.display=isAdmin?'':'none');
}
function renderDues(){
 const p=D.periods.find(x=>+x.id===+periodId);$('#periods').innerHTML=D.periods.map(x=>`<div class="periodWrap"><button class="period ${+x.id===+periodId?'selected':''}" data-p="${x.id}"><b>${esc(x.name)} ${x.year}</b><small>Aidat tutarı</small><input data-a="${x.id}" data-admin type="number" value="${x.amount}"></button><button class="periodDelete" data-del-period="${x.id}" data-admin title="Dönemi sil">🗑️</button></div>`).join('');
 if(!p){$('#duesTable').innerHTML='Aidat dönemi yok';return}
 $('#duesTable').innerHTML=`<table><thead><tr><th>Üye</th><th>Tutar</th><th>Ödenen</th><th>Durum</th><th></th></tr></thead><tbody>${D.members.map(m=>{let x=pay(m.id,p.id),st=x?.status||'unpaid';return `<tr><td>${esc(m.name)}</td><td>${money(p.amount)}</td><td>${money(x?.amount||0)}</td><td><span class="badge ${st==='paid'?'paid':'unpaid'}">${st==='paid'?'ÖDENDİ':'ÖDENMEDİ'}</span></td><td><button data-edit="${m.id}" data-admin>Düzenle</button></td></tr>`}).join('')}</tbody></table>`;
 document.querySelectorAll('[data-p]').forEach(b=>b.onclick=e=>{if(e.target.tagName==='INPUT')return;periodId=+b.dataset.p;renderDues()});
 document.querySelectorAll('[data-a]').forEach(i=>{i.onclick=e=>e.stopPropagation();i.onchange=async()=>{if(!requireAdmin())return;await run('periods',q=>q.update({amount:+i.value||0}).eq('id',i.dataset.a));await log('Aidat tutarı güncellendi',i.value+' TL');load()}});
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editPayment(+b.dataset.edit,p.id));
 document.querySelectorAll('[data-del-period]').forEach(b=>b.onclick=async e=>{
   e.stopPropagation();
   if(!requireAdmin())return;
   const id=+b.dataset.delPeriod;
   const per=D.periods.find(x=>+x.id===id);
   if(!per)return;
   const paymentCount=D.payments.filter(x=>+x.period_id===id).length;
   const msg=paymentCount
     ? `${per.name} ${per.year} dönemi ve bu döneme ait ${paymentCount} ödeme kaydı silinecek. Devam edilsin mi?`
     : `${per.name} ${per.year} dönemi silinsin mi?`;
   if(!confirm(msg))return;
   try{
     if(paymentCount) await run('payments',q=>q.delete().eq('period_id',id));
     await run('periods',q=>q.delete().eq('id',id));
     await log('Aidat dönemi silindi',per.name+' '+per.year);
     if(+periodId===id){
       const remaining=D.periods.filter(x=>+x.id!==id);
       periodId=remaining[0]?.id||null;
     }
     if(+reportPeriodId===id){
       const remaining=D.periods.filter(x=>+x.id!==id);
       reportPeriodId=remaining[0]?.id||null;
     }
     await load();
   }catch(err){console.error(err)}
 });
}
function modal(html){$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden')}function close(){$('#modal').classList.add('hidden')}
function editPayment(memberId,pid){if(!requireAdmin())return;const m=D.members.find(x=>+x.id===memberId),p=D.periods.find(x=>+x.id===pid),x=pay(memberId,pid);modal(`<h3>${esc(m.name)}</h3><form id="pf"><select id="ps"><option value="unpaid">Ödenmedi</option><option value="paid">Ödendi</option></select><input id="pa" type="number" value="${x?.amount??p.amount}"><textarea id="pn" placeholder="Not">${esc(x?.note||'')}</textarea><div class="actions"><button type="button" id="cancel">Vazgeç</button><button class="primary">Kaydet</button></div></form>`);$('#ps').value=x?.status||'unpaid';$('#cancel').onclick=close;$('#pf').onsubmit=async e=>{e.preventDefault();let row={member_id:memberId,period_id:pid,status:$('#ps').value,amount:+$('#pa').value||0,note:$('#pn').value,updated_at:new Date().toISOString()};await run('payments',q=>q.upsert(row,{onConflict:'member_id,period_id'}));await log('Aidat güncellendi',m.name+' / '+p.name);close();load()}}
function renderExpenses(){
 const q=($('#expenseSearch')?.value||'').toLowerCase();const rows=D.expenses.filter(x=>`${x.title} ${x.description||''} ${x.expense_date}`.toLowerCase().includes(q));
 $('#expenseTable').innerHTML=`<table><thead><tr><th>Tarih</th><th>Gider</th><th>Açıklama</th><th>Tutar</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.expense_date}</td><td>${esc(x.title)}</td><td>${esc(x.description||'-')}</td><td>${money(x.amount)}</td><td><button class="danger" data-de="${x.id}" data-admin>Sil</button></td></tr>`).join('')}</tbody></table>`;
 document.querySelectorAll('[data-de]').forEach(b=>b.onclick=async()=>{if(!requireAdmin())return;if(confirm('Silinsin mi?')){await run('expenses',q=>q.delete().eq('id',b.dataset.de));await log('Gider silindi','Kayıt kaldırıldı');load()}});
}
function renderMembers(){
 const q=($('#memberSearch')?.value||'').toLowerCase();const rows=D.members.filter(m=>m.name.toLowerCase().includes(q));
 $('#membersList').innerHTML=rows.map(m=>`<div class="member"><div><b>${esc(m.name)}</b><small>Aktif üye</small></div><button class="danger" data-rm="${m.id}" data-admin>Kaldır</button></div>`).join('');
 document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{if(!requireAdmin())return;let m=D.members.find(x=>+x.id===+b.dataset.rm);if(confirm(m.name+' kaldırılsın mı?')){await run('members',q=>q.update({active:false}).eq('id',m.id));await log('Üye kaldırıldı',m.name);load()}});
}
function renderLogs(){const q=($('#logSearch')?.value||'').toLowerCase();const rows=D.logs.filter(x=>`${x.action} ${x.details||''}`.toLowerCase().includes(q));$('#logsList').innerHTML=rows.map(x=>`<div class="log"><b>${esc(x.action)}</b><div>${esc(x.details||'')}</div><small>${new Date(x.created_at).toLocaleString('tr-TR')}</small></div>`).join('')||'Henüz işlem yok'}
function renderReports(){
 const p=D.periods.find(x=>+x.id===+reportPeriodId);$('#reportPeriod').innerHTML=D.periods.map(x=>`<button class="period ${+x.id===+reportPeriodId?'selected':''}" data-rp="${x.id}"><b>${esc(x.name)} ${x.year}</b><small>${money(x.amount)}</small></button>`).join('');
 if(!p){$('#reportSummary').innerHTML='Rapor için dönem yok.';$('#reportTable').innerHTML='';return}
 const rows=D.members.map(m=>{const x=pay(m.id,p.id);return {name:m.name,amount:Number(p.amount),paid:x?.status==='paid'?Number(x.amount||0):0,status:x?.status==='paid'?'Ödendi':'Ödenmedi'}});
 const total=rows.reduce((a,x)=>a+x.amount,0),collected=rows.reduce((a,x)=>a+x.paid,0),remaining=total-collected;
 $('#reportSummary').innerHTML=`<div class="reportBox"><h3>${esc(p.name)} ${p.year} Raporu</h3><div class="reportGrid"><div><small>Beklenen</small><strong>${money(total)}</strong></div><div><small>Tahsil Edilen</small><strong>${money(collected)}</strong></div><div><small>Kalan</small><strong>${money(remaining)}</strong></div></div></div>`;
 $('#reportTable').innerHTML=`<table><thead><tr><th>Üye</th><th>Beklenen</th><th>Ödenen</th><th>Kalan</th><th>Durum</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.name)}</td><td>${money(x.amount)}</td><td>${money(x.paid)}</td><td>${money(x.amount-x.paid)}</td><td>${x.status}</td></tr>`).join('')}</tbody></table>`;
 document.querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>{reportPeriodId=+b.dataset.rp;renderReports()});
}
function renderSettings(){if(!$('#settingsForm'))return;const s=D.settings||{};$('#setEyebrow').value=s.banner_eyebrow||'YÜKSEK ŞUURA';$('#setTitle').value=s.banner_title||'Aidat ve kasa yönetimi';$('#setText').value=s.banner_text||'Tüm veriler ortak veritabanında saklanır.';$('#setLogo').value=s.logo_url||'';$('#logoPreview').innerHTML=s.logo_url?`<img src="${esc(s.logo_url)}" alt="Mevcut logo">`:''}
const info={home:['Ana Sayfa','Aidat ve kasa durumunu yönetin.'],dues:['Aidatlar','Ödeme durumlarını düzenleyin.'],expenses:['Giderler','Kasa harcamalarını yönetin.'],members:['Üyeler','Üye listesini düzenleyin.'],logs:['İşlem Geçmişi','Son işlemleri görüntüleyin.'],reports:['Raporlar','Dönem bazlı rapor alın.'],settings:['Site Ayarları','Banner ve logo ayarlarını düzenleyin.']};
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.page').forEach(x=>x.classList.toggle('hidden',x.id!==b.dataset.page));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x===b));$('#title').textContent=info[b.dataset.page][0];$('#subtitle').textContent=info[b.dataset.page][1]});
$('#goDues').onclick=()=>document.querySelector('[data-page="dues"]').click();$('#modal').onclick=e=>{if(e.target.id==='modal')close()};
$('#addMember').onclick=async()=>{if(!requireAdmin())return;let n=prompt('Üye adı:');if(n?.trim()){await run('members',q=>q.insert({name:n.trim(),active:true}));await log('Yeni üye eklendi',n.trim());load()}};
$('#addExpense').onclick=()=>{if(!requireAdmin())return;modal(`<h3>Yeni Gider</h3><form id="ef"><input id="et" placeholder="Gider adı" required><input id="ed" type="date" value="${new Date().toISOString().slice(0,10)}" required><input id="ea" type="number" placeholder="Tutar" required><textarea id="ex" placeholder="Açıklama"></textarea><div class="actions"><button type="button" id="cancel">Vazgeç</button><button class="primary">Kaydet</button></div></form>`);$('#cancel').onclick=close;$('#ef').onsubmit=async e=>{e.preventDefault();let r={title:$('#et').value,expense_date:$('#ed').value,amount:+$('#ea').value,description:$('#ex').value};await run('expenses',q=>q.insert(r));await log('Yeni gider eklendi',r.title);close();load()}};
$('#addPeriod').onclick=()=>{if(!requireAdmin())return;modal(`<h3>Yeni Aidat Dönemi</h3><form id="periodForm"><input id="perName" placeholder="Dönem adı (Örn: Ocak)" required><input id="perYear" type="number" value="${new Date().getFullYear()}" required><input id="perAmount" type="number" placeholder="Aidat tutarı" required><div class="actions"><button type="button" id="cancel">Vazgeç</button><button class="primary">Dönem Ekle</button></div></form>`);$('#cancel').onclick=close;$('#periodForm').onsubmit=async e=>{e.preventDefault();let r={name:$('#perName').value,year:+$('#perYear').value,amount:+$('#perAmount').value,sort_order:D.periods.length+1};await run('periods',q=>q.insert(r));await log('Yeni dönem eklendi',r.name+' '+r.year);close();load()}};
$('#settingsForm').onsubmit=async e=>{e.preventDefault();if(!requireAdmin())return;let logoUrl=$('#setLogo').value.trim();const file=$('#logoFile').files[0];try{if(file){const ext=(file.name.split('.').pop()||'png').toLowerCase();const path=`site-logo/logo-${Date.now()}.${ext}`;$('#logoPreview').innerHTML='<div class="uploading">Logo yükleniyor...</div>';const {error:upErr}=await db.storage.from('site-assets').upload(path,file,{upsert:true,contentType:file.type});if(upErr)throw upErr;const {data:urlData}=db.storage.from('site-assets').getPublicUrl(path);logoUrl=urlData.publicUrl}let row={id:1,banner_eyebrow:$('#setEyebrow').value,banner_title:$('#setTitle').value,banner_text:$('#setText').value,logo_url:logoUrl,updated_at:new Date().toISOString()};await run('settings',q=>q.upsert(row));await log('Site ayarları güncellendi','Banner/logo düzenlendi');await load();alert('Ayarlar kaydedildi!')}catch(err){alert('Logo veya ayarlar kaydedilemedi: '+err.message)}};
['memberSearch','expenseSearch','logSearch'].forEach(id=>{$('#'+id).oninput=()=>{if(id==='memberSearch')renderMembers();if(id==='expenseSearch')renderExpenses();if(id==='logSearch')renderLogs()}});
$('#exportCsv').onclick=()=>{const p=D.periods.find(x=>+x.id===+reportPeriodId);if(!p)return;let lines=[['Üye','Beklenen','Ödenen','Kalan','Durum']];D.members.forEach(m=>{let x=pay(m.id,p.id),paid=x?.status==='paid'?Number(x.amount||0):0;lines.push([m.name,p.amount,paid,Number(p.amount)-paid,x?.status==='paid'?'Ödendi':'Ödenmedi'])});let csv='\\ufeff'+lines.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`${p.name}_${p.year}_rapor.csv`;a.click();URL.revokeObjectURL(a.href)};
$('#printReport').onclick=()=>{document.querySelector('[data-page="reports"]').click();setTimeout(()=>window.print(),100)};
refreshAuth().then(load);
