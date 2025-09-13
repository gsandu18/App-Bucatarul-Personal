// ===== Storage shim (fără să-ți șteargă datele la fiecare load) =====
const store = (() => {
  try {
    const t = '__test__' + Math.random();
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch (e) {
    const mem = {};
    return {
      getItem:k => (k in mem ? mem[k] : null),
      setItem:(k,v) => { mem[k] = String(v) },
      removeItem:k => { delete mem[k] }
    };
  }
})();

// ===== Helpers =====
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const routes={home:'#home',auth:'#auth',dashboard:'#dashboard',profile:'#profile'};
const panels={orders:'#panel-orders',menus:'#panel-menus',chat:'#panel-chat',calendar:'#panel-calendar',settings:'#panel-settings'};

// ===== Seed demo user (ca să testezi imediat) =====
(function seedDemo(){
  try{
    const users = JSON.parse(store.getItem('bp_users')||'[]');
    if(!users.find(u=>u.email==='demo@bp.ro')){
      users.push({id:'u_demo', name:'Demo', email:'demo@bp.ro', password:'1234', role:'chef', city:'Milano', phone:''});
      store.setItem('bp_users', JSON.stringify(users));
    }
  }catch{}
})();

// ===== State =====
const state={
  user: JSON.parse(store.getItem('bp_user')||'null'),
  orders: JSON.parse(store.getItem('bp_orders')||'[]'),
  messages: JSON.parse(store.getItem('bp_chat')||'[]'),
  events: JSON.parse(store.getItem('bp_events')||'[]'),
  menus: JSON.parse(store.getItem('bp_menus')||'[]')
};
let currentRoute='home';

const persistOrders = () => { try{ store.setItem('bp_orders', JSON.stringify(state.orders)); }catch{} };
const persistMenus  = () => { try{ store.setItem('bp_menus', JSON.stringify(state.menus)); }catch{} };
const persistChat   = () => { try{ store.setItem('bp_chat', JSON.stringify(state.messages)); }catch{} };
const persistEvents = () => { try{ store.setItem('bp_events', JSON.stringify(state.events)); }catch{} };

function toast(msg){ const t=$('#toast'); if(!t){ alert(msg); return; } t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); }

// ===== Theme =====
function initTheme(){
  const saved = store.getItem('bp_theme') ?? 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = $('#themeBtn'), icon = $('#themeIcon'), label=$('#themeLabel');
  function upd(){ const cur=document.documentElement.getAttribute('data-theme'); if(icon) icon.textContent=(cur==='dark'?'🌙':'☀️'); if(label) label.textContent=(cur==='dark'?'Dark':'Light'); btn?.setAttribute('aria-pressed', cur==='dark'); }
  btn?.addEventListener('click', ()=>{
    const cur=document.documentElement.getAttribute('data-theme');
    const next=(cur==='dark')?'light':'dark';
    document.documentElement.setAttribute('data-theme', next);
    try{ store.setItem('bp_theme', next); }catch{}
    upd();
  }, {passive:true});
  upd();
}

// ===== Routing =====
function toggleHeaderButtons(){
  const authBtn = $('#authBtn');
  const logoutBtn = $('#logoutBtn');
  let dashBtn = $('#hdrDashBtn');

  if(state.user?.role==='chef' && !dashBtn){
    dashBtn=document.createElement('button');
    dashBtn.id='hdrDashBtn'; dashBtn.className='btn gold'; dashBtn.type='button'; dashBtn.textContent='Dashboard';
    dashBtn.onclick=()=>{ showRoute('dashboard'); setPanel('orders'); };
    $('.header .actions')?.appendChild(dashBtn);
  }
  if(state.user?.role!=='chef' && dashBtn){ dashBtn.remove(); }

  if(authBtn) authBtn.style.display = state.user ? 'none' : '';
  if(logoutBtn) logoutBtn.style.display = (state.user && currentRoute==='dashboard') ? '' : 'none';
}

function showRoute(name){
  currentRoute=name;
  Object.values(routes).forEach(id=>$(id)?.classList.remove('show'));
  $(routes[name])?.classList.add('show');
  if((name==='dashboard'||name==='profile') && !state.user){
    toast('Autentifică-te pentru a accesa această secțiune.');
    $(routes[name])?.classList.remove('show'); $(routes.auth)?.classList.add('show'); currentRoute='auth';
  }
  if(currentRoute==='dashboard') renderDashboard();
  $$('.tablink').forEach(b=>b.classList.toggle('active', b.dataset.go===currentRoute));
  toggleHeaderButtons();
}

// ===== Renderers =====
function updateAuthUI(){ const rb=$('#roleBadge'); if(rb) rb.textContent='Rol: ' + (state.user?.role || '-'); toggleHeaderButtons(); }
function setPanel(name){
  Object.values(panels).forEach(id=>$(id)?.classList.remove('show'));
  $(panels[name])?.classList.add('show');
  $$('.sidebar .tab').forEach(t=>t.classList.toggle('active', t.dataset.panel===name));
}
function renderDashboard(){ updateAuthUI(); renderOrders(); renderMenus(); renderChat(); renderEvents(); }
function renderOrders(){
  const list=$('#ordersList'); if(!list) return; list.innerHTML='';
  const mine=(state.user?.role==='chef')?state.orders:state.orders.filter(o=>o.email===state.user?.email || !state.user);
  if(mine.length===0){ list.innerHTML='<p style="color:#8fa0a8">Nu există comenzi.</p>'; return; }
  mine.forEach(o=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`
      ${o.img?`<div style="aspect-ratio:16/9;border-radius:12px;overflow:hidden;margin:-2px -2px 8px;border:1px solid #e3ece7"><img src="${o.img}" style="width:100%;height:100%;object-fit:cover" alt=""></div>`:''}
      <div><strong>${o.tip||'Comandă'}</strong> · <span style="color:#96a3aa">${o.oras||'-'} · ${o.data||''}</span></div>
      <div style="color:#4b5b57">${o.nume||'-'} — ${o.email||''}</div>
      <span class="status">${o.status||'nou'}</span>`;
    list.appendChild(el);
  });
}
function renderMenus(){
  const ml=$('#menusList'); if(!ml) return; ml.innerHTML='';
  state.menus.forEach(m=>{
    const c=document.createElement('div'); c.className='card';
    c.innerHTML=`
      ${m.imageUrl?`<div style="aspect-ratio:4/3;border-radius:14px;overflow:hidden;margin:-4px -4px 10px;border:1px solid var(--line)">
        <img src="${m.imageUrl}" style="width:100%;height:100%;object-fit:cover" alt=""></div>`:''}
      <strong>${m.title}</strong><div style="color:#5e6a6e">Preț: ${m.price} RON</div>`;
    ml.appendChild(c);
  });
}
function renderChat(){
  const box=$('#chatMessages'); if(!box) return; box.innerHTML='';
  state.messages.slice(-60).forEach(m=>{
    const d=document.createElement('div'); d.className='item';
    d.innerHTML=`<strong>${m.from}</strong> <span style="color:#8ea1aa">${new Date(m.at).toLocaleString()}</span><br>${m.text}`;
    box.appendChild(d);
  }); box.scrollTop=box.scrollHeight;
}
function renderEvents(){
  const ev=$('#eventsList'); if(!ev) return; ev.innerHTML='';
  state.events.forEach(e=>{
    const li=document.createElement('li'); li.className='item';
    li.innerHTML=`<strong>${e.title}</strong> — ${e.date} ${e.time}`;
    ev.appendChild(li);
  });
}

// ===== Listeners =====
function bindListeners(){
  document.addEventListener('click', (e)=>{
    const r = e.target.closest('[data-route]');
    if(r){ e.preventDefault(); showRoute(r.dataset.route); return; }
    const tl = e.target.closest('.tablink');
    if(tl){
      e.preventDefault();
      showRoute(tl.dataset.go);
      if(tl.dataset.panel) setPanel(tl.dataset.panel);
      return;
    }
    const sb = e.target.closest('.sidebar .tab');
    if(sb){ e.preventDefault(); setPanel(sb.dataset.panel); return; }
  }, {passive:false});

  $('#logoutBtn')?.addEventListener('click', logout, {passive:true});
  $('#logoutBtnProfile')?.addEventListener('click', logout, {passive:true});
  function logout(){ state.user=null; try{ store.removeItem('bp_user'); }catch{} updateAuthUI(); showRoute('home'); }

  $('#tabLoginBtn')?.addEventListener('click', ()=>{ $('#tabLogin').style.display='block'; $('#tabSignup').style.display='none'; }, {passive:true});
  $('#tabSignupBtn')?.addEventListener('click', ()=>{ $('#tabLogin').style.display='none'; $('#tabSignup').style.display='block'; }, {passive:true});

  $('#loginForm')?.addEventListener('submit', e=>{
    e.preventDefault();
    const {email,password}=Object.fromEntries(new FormData(e.target).entries());
    const users=JSON.parse(store.getItem('bp_users')||'[]');
    const u=users.find(x=>x.email===email && x.password===password);
    if(!u){ toast('Date invalide.'); return; }
    state.user=u; try{ store.setItem('bp_user', JSON.stringify(u)); }catch{}
    toast('Bun venit, ' + (u.name||'chef') + '!');
    updateAuthUI(); showRoute('dashboard'); setPanel('orders');
  });

  $('#signupForm')?.addEventListener('submit', e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(e.target).entries());
    const users=JSON.parse(store.getItem('bp_users')||'[]');
    if(users.some(u=>u.email===d.email)){ toast('Email existent.'); return; }
    const nu={id:'u_'+Date.now(), name:d.name, email:d.email, password:d.password, role:d.role, city:'', phone:''};
    users.push(nu); try{ store.setItem('bp_users', JSON.stringify(users)); store.setItem('bp_user', JSON.stringify(nu)); }catch{}
    state.user=nu; toast('Cont creat. Bine ai venit!');
    updateAuthUI(); showRoute('dashboard'); setPanel('orders');
  });

  $('#menuForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const title = $('#menuTitle')?.value?.trim();
    const price = Number($('#menuPrice')?.value || 0);
    const imageUrl = $('#menuImageUrl')?.value?.trim();
    if(!title || !price){ toast('Completează titlul și prețul.'); return; }
    state.menus.unshift({ id:'m_'+Date.now(), title, price, imageUrl });
    persistMenus();
    toast('Meniu salvat.');
    e.target.reset();
    renderMenus();
  }, {passive:false});

  $('#chatForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const input = $('#chatInput');
    const text = input?.value?.trim();
    if(!text) return;
    const from = state.user?.name || 'Client';
    state.messages.push({ id:'msg_'+Date.now(), from, text, at:Date.now() });
    persistChat();
    input.value = '';
    renderChat();
  }, {passive:false});

  $('#eventForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const date = $('#eventDate')?.value;
    const time = $('#eventTime')?.value;
    const title = $('#eventTitle')?.value?.trim();
    if(!date || !time || !title){ toast('Completează data, ora și titlul.'); return; }
    state.events.unshift({ id:'ev_'+Date.now(), date, time, title });
    persistEvents();
    toast('Eveniment adăugat.');
    e.target.reset();
    renderEvents();
  }, {passive:false});

  $('#authBtn')?.addEventListener('click', ()=>{ showRoute('auth'); }, {passive:true});

  document.querySelectorAll('form button:not([type])').forEach(b=>b.type='submit');
}

// ===== INIT =====
function init(){
  $('#year')?.textContent = new Date().getFullYear();
  initTheme();
  bindListeners();
  showRoute('home'); setPanel('orders'); updateAuthUI();
}
document.addEventListener('DOMContentLoaded', init);
