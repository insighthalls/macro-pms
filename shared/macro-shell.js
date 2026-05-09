/* Shared shell + UI helpers used by every role workspace.
   Loaded after macro-core.js. Exposes window.UI with helpers for
   sidebar/topbar render, toasts, modals, and table rendering. */
(function(){
  const ICONS = {
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></svg>',
    inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h6l2 3h2l2-3h6"/><path d="M3 12V5h18v7"/><path d="M3 12v7h18v-7"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
    money:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
    coins:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><ellipse cx="9" cy="8" rx="6" ry="2.5"/><path d="M3 8v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V8"/><ellipse cx="15" cy="14" rx="6" ry="2.5"/><path d="M9 14v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-6"/></svg>',
    file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 3H6v18h12V7l-4-4z"/><path d="M14 3v4h4"/></svg>',
    flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 21V4h12l-2 4 2 4H5"/></svg>',
    cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 4h2l2 12h12l2-8H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>',
    users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6"/><path d="M15 20c0-2.5 2-4 4-4s2 1 2 1"/></svg>',
    chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21h18"/><path d="M6 17V9M12 17V5M18 17v-6"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    cog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.5-2.4.8a7 7 0 0 0-2.2-1.3L13.7 3h-3.4l-.6 2.2a7 7 0 0 0-2.2 1.3l-2.4-.8-2 3.5 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.3l-2 1.5 2 3.5 2.4-.8a7 7 0 0 0 2.2 1.3l.6 2.2h3.4l.6-2.2a7 7 0 0 0 2.2-1.3l2.4.8 2-3.5-2-1.5A7 7 0 0 0 19 12z"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>',
    bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 17V11a6 6 0 1 1 12 0v6l2 2H4l2-2z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m5 12 5 5L20 7"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 6l12 12M6 18 18 6"/></svg>',
    edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 20h4l11-11-4-4L4 16v4z"/></svg>',
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 4v12M6 12l6 6 6-6"/><path d="M4 20h16"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M4 16a4 4 0 0 1 4-4h12"/></svg>',
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="7" width="13" height="10"/><path d="M15 10h4l3 3v4h-7"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>'
  };

  function icon(n){ return ICONS[n]||''; }

  // ---- Toast ----
  function ensureToastWrap(){
    let w = document.getElementById('toast-wrap');
    if (!w){ w = document.createElement('div'); w.id='toast-wrap'; w.className='toast-wrap'; document.body.appendChild(w); }
    return w;
  }
  function toast(msg, tone){
    const w = ensureToastWrap();
    const el = document.createElement('div');
    el.className = 'toast' + (tone? ' '+tone : '');
    el.innerHTML = (tone==='green'? icon('check') : tone==='red'? icon('x') : icon('check')) + '<span>'+msg+'</span>';
    w.appendChild(el);
    setTimeout(()=>{ el.style.transition='.25s'; el.style.opacity='0'; el.style.transform='translateY(8px)'; setTimeout(()=>el.remove(), 280); }, 2400);
  }

  // ---- Sidebar render ----
  function sidebar(role, items, activeId, footer){
    const u = MACRO.user(role.userId);
    return `
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">M</div>
          <div><div class="brand-name">MACRO PMS</div><div class="brand-sub">${role.system||'Project Mgmt System'}</div></div>
        </div>
        <div class="role-card ${role.cls||''}">
          <div class="av">${u?u.init:'?'}</div>
          <div><b>${u?u.name:role.name}</b><small>${role.label}</small></div>
        </div>
        <div class="nav-section">${role.section1||'Workspace'}</div>
        <div class="nav" id="nav">
          ${items.map(it => `<button data-view="${it.id}" class="${it.id===activeId?'active':''}">
            ${icon(it.icon)}<span>${it.label}</span>${it.badge?`<span class="badge${it.badgeQ?' q':''}">${it.badge}</span>`:''}
          </button>`).join('')}
        </div>
        <div class="sidebar-foot"><span class="dot"></span>${footer||'v4.0 · Sandbox'}</div>
      </aside>`;
  }

  // ---- Topbar ----
  function topbar(role, crumbs, project){
    const p = MACRO.project(project) || MACRO.PROJECTS[0];
    const me = role && role.userId;
    const myNotifs = me ? MACRO.list('notifs', n => n.to===me) : [];
    const unread = myNotifs.filter(n => !n.read).length;
    setTimeout(()=>bindNotifBell(me), 0);
    return `<div class="topbar">
      <div class="crumbs">${crumbs.map((c,i)=>i===crumbs.length-1?`<b>${c}</b>`:`<span>${c}</span><span>›</span>`).join(' ')}</div>
      <div class="proj-pill"><span class="sw" style="background:${p.color}">${p.code.split(' ')[0].slice(0,2)}</span>${p.code} · ${p.donor.split('·')[0].trim()}</div>
      <div class="role-switch" style="margin-left:14px"><a href="index.html">All roles</a></div>
      <div class="search">${icon('search')}<input placeholder="Search ARs, vouchers, vendors…" /><kbd>⌘K</kbd></div>
      <div class="notif-wrap" id="notif-wrap">
        <button class="icon-btn" id="notif-bell" title="Notifications">${icon('bell')}${unread?`<span class="dot count">${unread}</span>`:''}</button>
        <div class="notif-pop" id="notif-pop">
          <div class="notif-h"><b>Notifications</b><span class="muted small">${unread} unread · ${myNotifs.length} total</span></div>
          <div class="notif-list">${
            myNotifs.length
              ? myNotifs.slice(0,12).map(n => `<a class="notif-row${n.read?' read':''}" data-nid="${n.id}" href="#">
                  <span class="dt"></span>
                  <div><div class="t">${n.text}</div><div class="m mono">${n.link||''} · ${MACRO.fmt.since(n.at)}</div></div>
                </a>`).join('')
              : `<div class="notif-empty muted">You're all caught up.</div>`
          }</div>
          <div class="notif-f"><button id="notif-mark-all" class="btn sm">Mark all read</button></div>
        </div>
      </div>
      <button class="icon-btn" title="Settings">${icon('cog')}</button>
    </div>`;
  }

  function bindNotifBell(me){
    const wrap = document.getElementById('notif-wrap'); if (!wrap || wrap.__bound) return; wrap.__bound = true;
    const bell = document.getElementById('notif-bell');
    const pop = document.getElementById('notif-pop');
    bell.addEventListener('click', e => { e.stopPropagation(); pop.classList.toggle('show'); });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) pop.classList.remove('show'); });
    pop.querySelectorAll('[data-nid]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      MACRO.update('notifs', a.dataset.nid, {read:true});
      a.classList.add('read');
    }));
    const mAll = document.getElementById('notif-mark-all');
    if (mAll) mAll.addEventListener('click', () => {
      MACRO.list('notifs', n => n.to===me && !n.read).forEach(n => MACRO.update('notifs', n.id, {read:true}));
    });
  }

  // ---- Approval timeline (live, role-stamped) ----
  function timeline(events){
    return `<ol class="atl">${events.map(e=>{
      const u = e.who ? MACRO.user(e.who) : null;
      const tone = e.tone || (e.action==='return'||e.action==='reject'?'red':e.action==='submit'?'blue':e.done?'green':'gray');
      return `<li class="atl-row ${tone} ${e.done===false?'pending':''}">
        <span class="atl-dot"></span>
        <div class="atl-body">
          <div class="atl-t"><b>${e.label}</b>${u?`<span class="atl-who">${u.name} · ${u.role}</span>`:e.who?`<span class="atl-who">${e.who}</span>`:''}</div>
          ${e.note?`<div class="atl-note">${e.note}</div>`:''}
          <div class="atl-m mono">${e.at?MACRO.fmt.full(e.at):'—'}${e.dur?' · '+e.dur:''}</div>
        </div>
      </li>`;
    }).join('')}</ol>`;
  }

  // Build a timeline for an AR/PV/PR from the audit log + flow
  function timelineFor(flowKey, id){
    const FLOW_LABELS = {
      AR: [['submit','PO submitted'],['recommend','HoP recommended'],['fm-approve','FM approved'],['ed-approve','ED approved'],['disburse','Disbursed by GFO'],['liquidate','Liquidated']],
      PV: [['submit','PO submitted'],['gfo-review','GFO reviewed'],['fm-approve','FM approved'],['ed-approve','ED approved'],['pay','Paid'],['post','Posted to GL']],
      PR: [['submit','PR submitted'],['approve','HoP approved'],['rfq','RFQ issued'],['quotes-in','Quotes received'],['evaluate','Evaluated'],['issue-lpo','LPO issued'],['receive','Goods received'],['close','Closed']]
    };
    const labels = FLOW_LABELS[flowKey] || [];
    const log = MACRO.list('audit', a => a.id===id);
    const events = labels.map(([action,label]) => {
      const ev = log.find(l => l.action===action);
      if (ev) return {label, who:ev.who, action:ev.action, at:ev.at, note:ev.note, done:true};
      return {label, done:false, at:null};
    });
    // Find any return/reject events
    const ret = log.find(l => l.action==='return' || l.action==='reject');
    if (ret) events.push({label: ret.action==='reject'?'Rejected':'Returned for revision', who:ret.who, action:ret.action, at:ret.at, note:ret.note, done:true, tone:'red'});
    return timeline(events);
  }

  // ---- Modal ----
  function modal({title, body, footer, lg}){
    const id='m-'+Date.now();
    const html = `<div class="modal-bk show" id="${id}">
      <div class="modal${lg?' lg':''}">
        <div class="modal-h"><h3>${title}</h3><span class="x" data-close>${icon('x')}</span></div>
        <div class="modal-b">${body}</div>
        ${footer?`<div class="modal-f">${footer}</div>`:''}
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    function close(){ el.remove(); }
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-close]')) close(); });
    return { el, close };
  }

  // ---- Drawer ----
  function drawer({title, body, footer}){
    document.querySelectorAll('.drawer,.drawer-bk').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', `<div class="drawer-bk show" id="drwbk"></div>
      <div class="drawer show" id="drw">
        <div class="drawer-h"><h3>${title}</h3><span class="x" data-close>${icon('x')}</span></div>
        <div class="drawer-b">${body}</div>
        ${footer?`<div class="drawer-f">${footer}</div>`:''}
      </div>`);
    function close(){ const a=document.getElementById('drw'),b=document.getElementById('drwbk'); if(a){a.classList.remove('show'); setTimeout(()=>a.remove(),250);} if(b){b.classList.remove('show'); setTimeout(()=>b.remove(),250);} }
    document.getElementById('drwbk').addEventListener('click', close);
    document.getElementById('drw').addEventListener('click', e => { if(e.target.closest('[data-close]')) close(); });
    return { close };
  }

  // ---- Bind nav ----
  function bindNav(onSelect){
    document.querySelectorAll('#nav button').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#nav button').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        const id = b.getAttribute('data-view');
        document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id==='v-'+id));
        if (onSelect) onSelect(id);
      });
    });
  }

  // ---- Pill helpers ----
  function pill(text, tone){ return `<span class="pill ${tone||'blue'}">${text}</span>`; }
  function stagePill(stage){
    return pill(stage, MACRO.stageTone('AR', stage));
  }

  // ---- Confirm ----
  function confirm(opts){
    return new Promise(resolve => {
      const m = modal({
        title: opts.title || 'Confirm',
        body: `<p style="margin:0">${opts.body||'Are you sure?'}</p>${opts.note?`<div class="fld" style="margin-top:14px"><label>${opts.note}</label><textarea id="m-note" placeholder="${opts.placeholder||'Add a note…'}"></textarea></div>`:''}`,
        footer: `<button class="btn" data-close>Cancel</button><button class="btn ${opts.tone||'primary'}" id="m-ok">${opts.ok||'Confirm'}</button>`
      });
      m.el.querySelector('#m-ok').addEventListener('click', () => {
        const note = m.el.querySelector('#m-note')?.value || '';
        m.close();
        resolve({ ok:true, note });
      });
      m.el.addEventListener('click', e => { if(e.target===m.el || e.target.closest('[data-close]')) resolve({ok:false}); });
    });
  }

  window.UI = { icon, toast, sidebar, topbar, modal, drawer, bindNav, pill, stagePill, confirm, timeline, timelineFor };
})();
