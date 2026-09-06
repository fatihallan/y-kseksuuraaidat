const SUPABASE_URL='https://kzhklbtdyzinfacaotuh.supabase.co';
const SUPABASE_KEY='sb_publishable__FvHp-RV7UHiWF0H9Y5Tug_yfMGyTX9';
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let D={members:[],periods:[],payments:[],expenses:[],logs:[]},periodId=null;
let isAdmin=false;

async function run(table,fn){const {data,error}=await fn(db.from(table));if(error){alert('Hata: '+error.message);throw error}return data}
async function refreshAuth(){const {data:{session}}=await db.auth.getSession();isAdmin=!!session;renderAuth();}
function renderAuth(){const area=$('#authArea');if(isAdmin){area.innerHTML='<span class="viewer">✏️ Düzenleme modu aktif</span><button class="authbtn" id="logoutBtn">Çıkış</button>';$('#logoutBtn').onclick=async()=>{await db.auth.signOut();await refreshAuth();await load();};}else{area.innerHTML='<span class="viewer">👁️ Görüntüleme modu</span><button class="authbtn" id="loginBtn">Yönetici Girişi</button>';$('#loginBtn').onclick=openLogin;}}
function openLogin(){modal(`<h3>Yönetici Girişi</h3><form id="loginForm"><input id="loginEmail" type="email" placeholder="E-posta" required><input id="loginPassword" type="password" placeholder="Şifre" required><div class="actions"><button type="button" id="cancel">Vazgeç</button><button class="primary">Giriş Yap</button></div></form>`);$('#cancel').onclick=close;$('#loginForm').onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$('#loginEmail').value,password:$('#loginPassword').value});if(error){alert('Giriş yapılamadı: '+error.message);return;}close();await refreshAuth();await load();};}
function requireAdmin(){if(!isAdmin){alert('Bu işlem sadece yönetici içindir.');return false;}return true;}
async function load(){
 const [members,periods,payments,expenses,logs]=await Promise.all([
  run('members',q=>q.select('*').eq('active',true).order('name')),
  run('periods',q=>q.select('*').order('sort_order')),
  run('payments',q=>q.select('*')),
  run('expenses',q=>q.select('*').order('expense_date',{ascending:false})),
  run('logs',q=>q.select('*').order('created_at',{ascending:false}).limit(100))
 ]);
 D={members:members||[],periods:periods||[],payments:payments||[],expenses:expenses||[],logs:logs||[]};
 if(!periodId&&D.periods.length)periodId=D.periods[0].id;render();
}
const pay=(m,p)=>D.payments.find(x=>+x.member_id===+m&&+x.period_id===+p);
async function log(action,details){await run('logs',q=>q.insert({action,details}))}
function render(){
 const totalExpected=D.periods.reduce((a,p)=>a+Number(p.amount)*D.members.length,0);
 const paid=D.payments.filter(x=>x.status==='paid').reduce((a,x)=>a+Number(x.amount||0),0);
 const expense=D.expenses.reduce((a,x)=>a+Number(x.amount||0),0);
 $('#stats').innerHTML=[['Toplam Üye',D.members.length],['Beklenen Aidat',money(totalExpected)],['Tahsil Edilen',money(paid)],['Kasa Bakiyesi',money(paid-expense)]].map(x=>`<div class="stat"><label>${x[0]}</label><strong>${x[1]}</strong><small>güncel durum</small></div>`).join('');
 $('#homeTable').innerHTML=`<table><thead><tr><th>Üye</th><th>Toplam</th><th>Ödenen</th><th>Kalan</th></tr></thead><tbody>${D.members.map(m=>{let t=D.periods.reduce((a,p)=>a+Number(p.amount),0),o=D.periods.reduce((a,p)=>a+(pay(m.id,p.id)?.status==='paid'?Number(pay(m.id,p.id).amount):0),0);return `<tr><td>${esc(m.name)}</td><td>${money(t)}</td><td>${money(o)}</td><td>${money(t-o)}</td></tr>`}).join('')}</tbody></table>`;
 renderDues();renderExpenses();renderMembers();renderLogs();document.querySelectorAll('[data-admin]').forEach(el=>el.style.display=isAdmin?'':'none');
}
function renderDues(){
 const p=D.periods.find(x=>+x.id===+periodId);$('#periods').innerHTML=D.periods.map(x=>`<button class="period ${+x.id===+periodId?'selected':''}" data-p="${x.id}"><b>${esc(x.name)} ${x.year}</b><small>Aidat tutarı</small><input data-a="${x.id}" data-admin type="number" value="${x.amount}"></button>`).join('');
 if(!p){$('#duesTable').innerHTML='Aidat dönemi yok';return}
 $('#duesTable').innerHTML=`<table><thead><tr><th>Üye</th><th>Tutar</th><th>Ödenen</th><th>Durum</th><th></th></tr></thead><tbody>${D.members.map(m=>{let x=pay(m.id,p.id),s=x?.status||'unpaid';return `<tr><td>${esc(m.name)}</td><td>${money(p.amount)}</td><td>${money(x?.amount||0)}</td><td><span class="badge ${s==='paid'?'paid':'unpaid'}">${s==='paid'?'ÖDENDİ':'ÖDENMEDİ'}</span></td><td><button data-edit="${m.id}" data-admin>Düzenle</button></td></tr>`}).join('')}</tbody></table>`;
 document.querySelectorAll('[data-p]').forEach(b=>b.onclick=e=>{if(e.target.tagName==='INPUT')return;periodId=+b.dataset.p;renderDues()});
 document.querySelectorAll('[data-a]').forEach(i=>{i.onclick=e=>e.stopPropagation();i.onchange=async()=>{if(!requireAdmin())return;await run('periods',q=>q.update({amount:+i.value||0}).eq('id',i.dataset.a));await log('Aidat tutarı güncellendi',i.value+' TL');load()}});
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editPayment(+b.dataset.edit,p.id));
}
function modal(html){$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden')}function close(){$('#modal').classList.add('hidden')}
function editPayment(memberId,pid){if(!requireAdmin())return;const m=D.members.find(x=>+x.id===memberId),p=D.periods.find(x=>+x.id===pid),x=pay(memberId,pid);modal(`<h3>${esc(m.name)}</h3><form id="pf"><select id="ps"><option value="unpaid">Ödenmedi</option><option value="paid">Ödendi</option></select><input id="pa" type="number" value="${x?.amount??p.amount}"><textarea id="pn" placeholder="Not">${esc(x?.note||'')}</textarea><div class="actions"><button type="button" id="cancel">Vazgeç</button><button class="primary">Kaydet</button></div></form>`);$('#ps').value=x?.status||'unpaid';$('#cancel').onclick=close;$('#pf').onsubmit=async e=>{e.preventDefault();let row={member_id:memberId,period_id:pid,status:$('#ps').value,amount:+$('#pa').value||0,note:$('#pn').value,updated_at:new Date().toISOString()};await run('payments',q=>q.upsert(row,{onConflict:'member_id,period_id'}));await log('Aidat güncellendi',m.name+' / '+p.name);close();load()}}
function renderExpenses(){$('#expenseTable').innerHTML=`<table><thead><tr><th>Tarih</th><th>Gider</th><th>Açıklama</th><th>Tutar</th><th></th></tr></thead><tbody>${D.expenses.map(x=>`<tr><td>${x.expense_date}</td><td>${esc(x.title)}</td><td>${esc(x.description||'-')}</td><td>${money(x.amount)}</td><td><button class="danger" data-de="${x.id}" data-admin>Sil</button></td></tr>`).join('')}</tbody></table>`;document.querySelectorAll('[data-de]').forEach(b=>b.onclick=async()=>{if(!requireAdmin())return;if(confirm('Silinsin mi?')){await run('expenses',q=>q.delete().eq('id',b.dataset.de));await log('Gider silindi','Kayıt kaldırıldı');load()}})}
function renderMembers(){$('#membersList').innerHTML=D.members.map(m=>`<div class="member"><div><b>${esc(m.name)}</b><small>Aktif üye</small></div><button class="danger" data-rm="${m.id}" data-admin>Kaldır</button></div>`).join('');document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{if(!requireAdmin())return;let m=D.members.find(x=>+x.id===+b.dataset.rm);if(confirm(m.name+' kaldırılsın mı?')){await run('members',q=>q.update({active:false}).eq('id',m.id));await log('Üye kaldırıldı',m.name);load()}})}
function renderLogs(){$('#logsList').innerHTML=D.logs.map(x=>`<div class="log"><b>${esc(x.action)}</b><div>${esc(x.details||'')}</div><small>${new Date(x.created_at).toLocaleString('tr-TR')}</small></div>`).join('')||'Henüz işlem yok'}
const info={home:['Ana Sayfa','Aidat ve kasa durumunu yönetin.'],dues:['Aidatlar','Ödeme durumlarını düzenleyin.'],expenses:['Giderler','Kasa harcamalarını yönetin.'],members:['Üyeler','Üye listesini düzenleyin.'],logs:['İşlem Geçmişi','Son işlemleri görüntüleyin.']};
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.page').forEach(x=>x.classList.toggle('hidden',x.id!==b.dataset.page));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x===b));$('#title').textContent=info[b.dataset.page][0];$('#subtitle').textContent=info[b.dataset.page][1]});
$('#goDues').onclick=()=>document.querySelector('[data-page="dues"]').click();
$('#modal').onclick=e=>{if(e.target.id==='modal')close()};
$('#addMember').onclick=async()=>{if(!requireAdmin())return;let n=prompt('Üye adı:');if(n?.trim()){await run('members',q=>q.insert({name:n.trim(),active:true}));await log('Yeni üye eklendi',n.trim());load()}};
$('#addExpense').onclick=()=>{if(!requireAdmin())return;modal(`<h3>Yeni Gider</h3><form id="ef"><input id="et" placeholder="Gider adı" required><input id="ed" type="date" value="${new Date().toISOString().slice(0,10)}" required><input id="ea" type="number" placeholder="Tutar" required><textarea id="ex" placeholder="Açıklama"></textarea><div class="actions"><button type="button" id="cancel">Vazgeç</button><button class="primary">Kaydet</button></div></form>`);$('#cancel').onclick=close;$('#ef').onsubmit=async e=>{e.preventDefault();let r={title:$('#et').value,expense_date:$('#ed').value,amount:+$('#ea').value,description:$('#ex').value};await run('expenses',q=>q.insert(r));await log('Yeni gider eklendi',r.title);close();load()}};
refreshAuth().then(load);
