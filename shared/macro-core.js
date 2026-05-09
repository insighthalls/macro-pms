/* MACRO PMS · Shared core
   localStorage-backed data + workflow engine.
   All role workspaces share window.MACRO so transitions move records
   between role queues in real-time (and across tabs via storage events).
*/
(function(){
  const KEY = 'macro_pms_v1';
  const VERSION = 4;

  // ---------- Seed ----------
  const PROJECTS = [
    {id:'IMP', code:'IMPACT KP', name:'IMPACT KP — DREAMS Plus', donor:'PEPFAR / USAID', color:'#1F4E79', budget:5_840_000_000, spent:3_927_000_000, ccy:'MWK', period:'Oct 2024 – Sep 2027'},
    {id:'LRR', code:'LINK RISE', name:'LINK RISE — TB & HIV Continuum', donor:'Global Fund · NMF4', color:'#7A1F4E', budget:8_120_000_000, spent:4_312_000_000, ccy:'MWK', period:'Apr 2024 – Mar 2027'},
    {id:'AGY', code:'AGYW Plus', name:'AGYW Plus — Adolescent Girls', donor:'CIFF · Children\u2019s Investment', color:'#1F794E', budget:2_140_000_000, spent:1_018_000_000, ccy:'MWK', period:'Jan 2025 – Dec 2026'},
    {id:'TKD', code:'Tikondane FT', name:'Tikondane Fast-Track', donor:'Embassy of Norway', color:'#794E1F', budget:980_000_000, spent:612_400_000, ccy:'MWK', period:'Jul 2025 – Jun 2026'},
    {id:'COR', code:'Core Ops', name:'Core Operations', donor:'Multi-donor pool', color:'#4E1F79', budget:1_640_000_000, spent:1_088_000_000, ccy:'MWK', period:'FY 2025/26'}
  ];

  const USERS = [
    {id:'U-PO',  name:'Tendai Phiri',     role:'Project Officer',    region:'KP',  email:'t.phiri@macro.org',     init:'TP', proj:'IMP'},
    {id:'U-HOP', name:'Chimwemwe Banda',  role:'Head of Programs',   region:'HQ',  email:'c.banda@macro.org',     init:'CB', proj:'IMP'},
    {id:'U-GFO', name:'Dalitso Nkhata',   role:'Grant Finance Officer', region:'HQ', email:'d.nkhata@macro.org', init:'DN', proj:'IMP'},
    {id:'U-FM',  name:'Ruth Mwale',       role:'Finance Manager',    region:'HQ',  email:'r.mwale@macro.org',     init:'RM', proj:'ALL'},
    {id:'U-ED',  name:'Eleanor Phiri',    role:'Executive Director', region:'HQ',  email:'e.phiri@macro.org',     init:'EP', proj:'ALL'},
    {id:'U-PRC', name:'Watson Lungu',     role:'Procurement Officer',region:'HQ',  email:'w.lungu@macro.org',     init:'WL', proj:'ALL'},
    {id:'U-ADM', name:'Florence Mhone',   role:'Administrator',      region:'HQ',  email:'f.mhone@macro.org',     init:'FM', proj:'ALL'},
    {id:'U-VND', name:'Sunbird Stationers',role:'Vendor',            region:'Lilongwe', email:'ar@sunbird.mw',    init:'SS', proj:'—'}
  ];

  // DIP lines (project · component · subline)
  const DIP = [
    {code:'DIP-1.1.1', proj:'IMP', label:'KP outreach – Lilongwe Cluster',  budget: 84_000_000, committed: 18_400_000, spent: 41_200_000},
    {code:'DIP-1.1.2', proj:'IMP', label:'KP outreach – Mzuzu / Karonga',   budget: 62_000_000, committed: 12_600_000, spent: 28_400_000},
    {code:'DIP-2.4.1', proj:'IMP', label:'Peer-led case finding',           budget: 41_200_000, committed:  6_800_000, spent: 36_900_000},
    {code:'DIP-2.4.2', proj:'IMP', label:'Index-testing field operations',  budget: 33_500_000, committed:  4_100_000, spent: 18_700_000},
    {code:'DIP-3.2.1', proj:'IMP', label:'CHW stipends Q3',                  budget: 28_800_000, committed:  9_600_000, spent: 12_400_000},
    {code:'DIP-4.1.1', proj:'IMP', label:'Training & workshops',             budget: 36_400_000, committed:  3_200_000, spent: 19_800_000},
    {code:'DIP-1.2.1', proj:'LRR', label:'TB community screening',           budget: 92_000_000, committed: 14_800_000, spent: 38_700_000},
    {code:'DIP-2.1.1', proj:'LRR', label:'Sample transport network',         budget: 47_600_000, committed:  6_200_000, spent: 26_300_000},
    {code:'DIP-3.1.1', proj:'AGY', label:'Safe-spaces operations',           budget: 54_800_000, committed:  8_400_000, spent: 21_900_000},
    {code:'DIP-3.1.2', proj:'AGY', label:'Mentor stipends',                  budget: 22_400_000, committed:  3_100_000, spent: 11_400_000},
    {code:'DIP-9.1.1', proj:'COR', label:'Office utilities & rent',          budget: 84_000_000, committed:  7_000_000, spent: 49_000_000},
    {code:'DIP-9.2.1', proj:'COR', label:'Vehicle running & fuel',           budget: 38_400_000, committed:  4_200_000, spent: 22_100_000}
  ];

  // ---------- Workflow definitions ----------
  // Each entity has stages[] and transitions[{from,to,action,role}]
  const FLOWS = {
    AR: { // Advance Request
      stages: ['Draft','PO Submitted','HoP Recommended','FM Approved','ED Approved','Disbursed','Liquidation Pending','Liquidated','Returned','Rejected'],
      next: {
        'Draft':            [{to:'PO Submitted',  action:'submit',     role:'Project Officer'}],
        'PO Submitted':     [{to:'HoP Recommended', action:'recommend',role:'Head of Programs'}, {to:'Returned', action:'return', role:'Head of Programs'}],
        'HoP Recommended':  [{to:'FM Approved',   action:'fm-approve', role:'Finance Manager'}, {to:'Returned', action:'return', role:'Finance Manager'}],
        'FM Approved':      [{to:'ED Approved',   action:'ed-approve', role:'Executive Director'}, {to:'Rejected', action:'reject', role:'Executive Director'}],
        'ED Approved':      [{to:'Disbursed',     action:'disburse',   role:'Grant Finance Officer'}],
        'Disbursed':        [{to:'Liquidation Pending', action:'await-liq', role:'system'}],
        'Liquidation Pending':[{to:'Liquidated',  action:'liquidate',  role:'Project Officer'}],
        'Returned':         [{to:'PO Submitted',  action:'resubmit',   role:'Project Officer'}],
      }
    },
    PV: { // Payment Voucher
      stages: ['Draft','PO Submitted','GFO Reviewed','FM Approved','ED Approved','Paid','Posted','Returned','Rejected'],
      next: {
        'Draft':           [{to:'PO Submitted',  action:'submit',     role:'Project Officer'}],
        'PO Submitted':    [{to:'GFO Reviewed',  action:'gfo-review', role:'Grant Finance Officer'},{to:'Returned', action:'return', role:'Grant Finance Officer'}],
        'GFO Reviewed':    [{to:'FM Approved',   action:'fm-approve', role:'Finance Manager'},{to:'Returned',action:'return',role:'Finance Manager'}],
        'FM Approved':     [{to:'ED Approved',   action:'ed-approve', role:'Executive Director'},{to:'Rejected',action:'reject',role:'Executive Director'}],
        'ED Approved':     [{to:'Paid',          action:'pay',        role:'Grant Finance Officer'}],
        'Paid':            [{to:'Posted',        action:'post',       role:'Grant Finance Officer'}],
        'Returned':        [{to:'PO Submitted',  action:'resubmit',   role:'Project Officer'}],
      }
    },
    PR: { // Procurement Requisition
      stages: ['Draft','Submitted','HoP Approved','RFQ Issued','Quotes Received','Evaluated','LPO Issued','Goods Received','Closed','Cancelled'],
      next: {
        'Draft':           [{to:'Submitted',      action:'submit',    role:'Project Officer'}],
        'Submitted':       [{to:'HoP Approved',   action:'approve',   role:'Head of Programs'}],
        'HoP Approved':    [{to:'RFQ Issued',     action:'rfq',       role:'Procurement Officer'}],
        'RFQ Issued':      [{to:'Quotes Received',action:'quotes-in', role:'Procurement Officer'}],
        'Quotes Received': [{to:'Evaluated',      action:'evaluate',  role:'Procurement Officer'}],
        'Evaluated':       [{to:'LPO Issued',     action:'issue-lpo', role:'Procurement Officer'}],
        'LPO Issued':      [{to:'Goods Received', action:'receive',   role:'Project Officer'}],
        'Goods Received':  [{to:'Closed',         action:'close',     role:'Procurement Officer'}],
      }
    },
    AP: { // Action Point
      stages: ['Open','In Progress','Resolved','Closed','Overdue'],
      next: {
        'Open':       [{to:'In Progress', action:'start',  role:'any'}],
        'In Progress':[{to:'Resolved',    action:'resolve',role:'any'}],
        'Resolved':   [{to:'Closed',      action:'close',  role:'Administrator'}],
      }
    }
  };

  // ---------- Seeding ----------
  function seedDB(){
    const today = new Date('2026-05-08');
    const D = (offset) => { const d = new Date(today); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10); };

    const activities = [
      {id:'ACT-2026-0138', proj:'IMP', title:'Lilongwe peer-educator stand-down', dip:'DIP-2.4.1', officer:'U-PO', stage:'Liquidate', budget:1_840_000, advance:1_840_000, spent:1_710_000, dueLiq:D(-3), date:D(-12)},
      {id:'ACT-2026-0142', proj:'IMP', title:'Mzuzu KP cluster mapping',           dip:'DIP-1.1.2', officer:'U-PO', stage:'Execute',  budget:3_240_000, advance:2_400_000, spent:1_120_000, dueLiq:D(11),  date:D(-3)},
      {id:'ACT-2026-0151', proj:'IMP', title:'Karonga sample-transport refresher', dip:'DIP-2.4.2', officer:'U-PO', stage:'Advance',  budget:2_180_000, advance:0,         spent:0,         dueLiq:D(18),  date:D(2)},
      {id:'ACT-2026-0153', proj:'LRR', title:'TB CHW stipend cycle Q3',            dip:'DIP-3.2.1', officer:'U-PO', stage:'SOW',      budget:9_600_000, advance:0,         spent:0,         dueLiq:D(28),  date:D(8)},
      {id:'ACT-2026-0156', proj:'AGY', title:'Mentor onboarding · Cohort 4',       dip:'DIP-3.1.2', officer:'U-PO', stage:'Concept',  budget:3_100_000, advance:0,         spent:0,         dueLiq:D(34),  date:D(14)},
      {id:'ACT-2026-0148', proj:'IMP', title:'Index testing field rotation',       dip:'DIP-2.4.2', officer:'U-PO', stage:'Execute',  budget:2_460_000, advance:1_840_000, spent:980_000,   dueLiq:D(6),   date:D(-1)},
      {id:'ACT-2026-0144', proj:'IMP', title:'Hot-spot mapping review',            dip:'DIP-1.1.1', officer:'U-PO', stage:'Liquidate',budget:1_960_000, advance:1_960_000, spent:1_960_000, dueLiq:D(-1),  date:D(-9)},
      {id:'ACT-2026-0159', proj:'COR', title:'HQ utilities cycle May',             dip:'DIP-9.1.1', officer:'U-ADM',stage:'Liquidate',budget:7_000_000, advance:7_000_000, spent:6_840_000, dueLiq:D(-5),  date:D(-14)},
    ];

    // Advance requests across the full state machine
    const ars = [
      {id:'AR-2026-0166', actId:'ACT-2026-0138', proj:'IMP', dip:'DIP-2.4.1', amount:1_840_000, requestedBy:'U-PO', stage:'Liquidation Pending', dueLiq:D(-19), submitted:D(-32), title:'Lilongwe peer-educator stand-down'},
      {id:'AR-2026-0179', actId:'ACT-2026-0142', proj:'IMP', dip:'DIP-1.1.2', amount:2_400_000, requestedBy:'U-PO', stage:'Returned', returnedBy:'U-FM', returnReason:'Activity dates overlap with existing AR-0172 — confirm split.', submitted:D(-3), title:'Mzuzu KP cluster mapping'},
      {id:'AR-2026-0180', actId:'ACT-2026-0148', proj:'IMP', dip:'DIP-2.4.2', amount:1_840_000, requestedBy:'U-PO', stage:'Disbursed', disbursedOn:D(-2), submitted:D(-7), title:'Index testing field rotation'},
      {id:'AR-2026-0181', actId:'ACT-2026-0151', proj:'IMP', dip:'DIP-2.4.2', amount:2_180_000, requestedBy:'U-PO', stage:'PO Submitted', submitted:D(0),  title:'Karonga sample-transport refresher'},
      {id:'AR-2026-0178', actId:'ACT-2026-0144', proj:'IMP', dip:'DIP-1.1.1', amount:1_960_000, requestedBy:'U-PO', stage:'Liquidated', submitted:D(-22), liquidatedOn:D(-2), title:'Hot-spot mapping review'},
      {id:'AR-2026-0177', actId:'ACT-2026-0144', proj:'IMP', dip:'DIP-1.1.1', amount:1_240_000, requestedBy:'U-PO', stage:'HoP Recommended', submitted:D(-1), title:'Lilongwe weekend KP outreach'},
      {id:'AR-2026-0176', actId:'ACT-2026-0153', proj:'LRR', dip:'DIP-3.2.1', amount:9_600_000, requestedBy:'U-PO', stage:'FM Approved', submitted:D(-2), title:'TB CHW stipend cycle Q3'},
      {id:'AR-2026-0175', actId:'ACT-2026-0156', proj:'AGY', dip:'DIP-3.1.2', amount:3_100_000, requestedBy:'U-PO', stage:'ED Approved', submitted:D(-4), title:'Mentor onboarding · Cohort 4'},
      {id:'AR-2026-0174', actId:'ACT-2026-0159', proj:'COR', dip:'DIP-9.1.1', amount:7_000_000, requestedBy:'U-ADM',stage:'Liquidation Pending', submitted:D(-15), title:'HQ utilities cycle May'},
      {id:'AR-2026-0173', actId:'ACT-2026-0148', proj:'IMP', dip:'DIP-2.4.2', amount:840_000,   requestedBy:'U-PO', stage:'Rejected', rejectedBy:'U-ED', rejectReason:'Duplicates AR-0180.', submitted:D(-6), title:'Index testing top-up'},
    ];

    // Vouchers
    const pvs = [
      {id:'PV-2026-1240', proj:'IMP', dip:'DIP-2.4.1', payee:'Sunbird Stationers',     vendorId:'V-001', net:486_000,   gross:540_000, wht:54_000,   stage:'Posted',     submitted:D(-22), paidOn:D(-12), title:'Workshop printing · Lilongwe'},
      {id:'PV-2026-1241', proj:'IMP', dip:'DIP-1.1.1', payee:'AfriRide Logistics',     vendorId:'V-002', net:1_240_000, gross:1_400_000,wht:160_000,  stage:'Paid',       submitted:D(-15), paidOn:D(-1),  title:'Vehicle hire · Mzuzu run'},
      {id:'PV-2026-1242', proj:'IMP', dip:'DIP-4.1.1', payee:'Lakeshore Lodge',        vendorId:'V-003', net:2_640_000, gross:3_000_000,wht:360_000,  stage:'ED Approved',submitted:D(-5),  title:'Workshop venue · Salima'},
      {id:'PV-2026-1243', proj:'LRR', dip:'DIP-1.2.1', payee:'Reagent Supplies Mw',    vendorId:'V-004', net:5_840_000, gross:6_400_000,wht:560_000,  stage:'FM Approved',submitted:D(-2),  title:'Sample collection consumables'},
      {id:'PV-2026-1244', proj:'IMP', dip:'DIP-3.2.1', payee:'Tendai Phiri (Imprest)', vendorId:'U-PO',  net:284_000,   gross:284_000,  wht:0,         stage:'GFO Reviewed', submitted:D(-1), title:'Imprest top-up · field DSA'},
      {id:'PV-2026-1245', proj:'IMP', dip:'DIP-2.4.2', payee:'Capital Print House',    vendorId:'V-005', net:412_000,   gross:464_000,  wht:52_000,    stage:'PO Submitted',submitted:D(0),  title:'Index-testing job aids'},
      {id:'PV-2026-1246', proj:'AGY', dip:'DIP-3.1.1', payee:'Crossroads Hotel',       vendorId:'V-006', net:1_180_000, gross:1_320_000,wht:140_000,   stage:'Returned', returnedBy:'U-GFO', returnReason:'TPIN missing — request from vendor.', submitted:D(-2), title:'Safe-space convening accommodation'},
      {id:'PV-2026-1247', proj:'COR', dip:'DIP-9.2.1', payee:'PetroMax Ltd',           vendorId:'V-007', net:880_000,   gross:1_000_000,wht:120_000,   stage:'PO Submitted',submitted:D(0),  title:'Fuel reconciliation · April fleet'},
      {id:'PV-2026-1248', proj:'IMP', dip:'DIP-2.4.2', payee:'Sunbird Stationers',     vendorId:'V-001', net:1_840_000, gross:2_080_000,wht:240_000,   stage:'Draft', title:'Index-testing field rotation · field expenses'},
    ];

    // Vendors
    const vendors = [
      {id:'V-001', name:'Sunbird Stationers',  tpin:'21048372', cat:'Printing & Stationery',  status:'Active', contact:'ar@sunbird.mw',  paid_ytd:18_400_000, terms:'Net 30'},
      {id:'V-002', name:'AfriRide Logistics',  tpin:'30471284', cat:'Transport & Vehicle Hire',status:'Active', contact:'ops@afriride.mw',paid_ytd:42_600_000, terms:'Net 30'},
      {id:'V-003', name:'Lakeshore Lodge',     tpin:'18374625', cat:'Hospitality & Venue',     status:'Active', contact:'sales@lakeshore.mw',paid_ytd:11_240_000,terms:'Net 14'},
      {id:'V-004', name:'Reagent Supplies Mw', tpin:'29384726', cat:'Lab & Medical Supplies',  status:'Active', contact:'orders@rsm.mw',  paid_ytd:78_400_000, terms:'Net 45'},
      {id:'V-005', name:'Capital Print House', tpin:'20183746', cat:'Printing & Stationery',   status:'Active', contact:'jobs@capitalprint.mw',paid_ytd:6_240_000,terms:'Net 30'},
      {id:'V-006', name:'Crossroads Hotel',    tpin:'14283746', cat:'Hospitality & Venue',     status:'Active', contact:'reservations@crossroads.mw',paid_ytd:4_120_000,terms:'Net 14'},
      {id:'V-007', name:'PetroMax Ltd',        tpin:'10293847', cat:'Fuel & Lubricants',       status:'Active', contact:'fleet@petromax.mw',paid_ytd:14_800_000,terms:'Net 30'},
      {id:'V-008', name:'Northern Tents & Hire',tpin:'17283746',cat:'Equipment Hire',          status:'Pending', contact:'info@northerntents.mw',paid_ytd:0,terms:'—'},
    ];

    // Procurement requisitions
    const prs = [
      {id:'PR-2026-0050', proj:'IMP', dip:'DIP-4.1.1', requestedBy:'U-PO', amount:3_000_000, stage:'Submitted',     desc:'Workshop venue & catering · Salima',  raised:D(-1)},
      {id:'PR-2026-0051', proj:'LRR', dip:'DIP-1.2.1', requestedBy:'U-PO', amount:6_400_000, stage:'HoP Approved',  desc:'Sample collection consumables Q3',    raised:D(-3)},
      {id:'PR-2026-0052', proj:'IMP', dip:'DIP-2.4.2', requestedBy:'U-PO', amount:1_240_000, stage:'RFQ Issued',    desc:'Job-aid printing · 2,000 sets',       raised:D(-5)},
      {id:'PR-2026-0053', proj:'IMP', dip:'DIP-1.1.1', requestedBy:'U-PO', amount:2_800_000, stage:'Quotes Received', desc:'Vehicle hire 30-day · Lilongwe',    raised:D(-7)},
      {id:'PR-2026-0054', proj:'COR', dip:'DIP-9.2.1', requestedBy:'U-ADM',amount:1_640_000, stage:'Evaluated',     desc:'HQ generator service contract',       raised:D(-9)},
      {id:'PR-2026-0055', proj:'AGY', dip:'DIP-3.1.1', requestedBy:'U-PO', amount:980_000,   stage:'LPO Issued',    desc:'Safe-space stationery cycle',         raised:D(-12)},
    ];

    // Action points
    const aps = [
      {id:'AP-0480', stage:'Open',        owner:'U-PO',  due:D(0),  source:'Internal Audit Q1', priority:'High',    title:'Submit attendance scans for ACT-2026-0142', linkType:'AR', linkId:'AR-2026-0179'},
      {id:'AP-0481', stage:'In Progress', owner:'U-PO',  due:D(2),  source:'FM Review',         priority:'Medium',  title:'Reconcile 19-day overdue liquidation AR-0166', linkType:'AR', linkId:'AR-2026-0166'},
      {id:'AP-0482', stage:'Open',        owner:'U-HOP', due:D(1),  source:'Donor Mission',     priority:'High',    title:'Sign-off SOW for TB CHW stipend cycle Q3', linkType:'AR', linkId:'AR-2026-0176'},
      {id:'AP-0483', stage:'Open',        owner:'U-GFO', due:D(0),  source:'Pre-payment',       priority:'High',    title:'TPIN missing on PV-2026-1246', linkType:'PV', linkId:'PV-2026-1246'},
      {id:'AP-0484', stage:'Resolved',    owner:'U-PO',  due:D(-3), source:'Internal Audit Q1', priority:'Low',     title:'Upload Karonga workshop scans', linkType:'ACT', linkId:'ACT-2026-0144'},
      {id:'AP-0485', stage:'Open',        owner:'U-FM',  due:D(3),  source:'External Audit',    priority:'High',    title:'Review DIP-2.4.1 over-spend trend', linkType:'DIP', linkId:'DIP-2.4.1'},
      {id:'AP-0486', stage:'In Progress', owner:'U-PRC', due:D(2),  source:'Procurement',       priority:'Medium',  title:'Re-issue RFQ for PR-2026-0053 (one quote only)', linkType:'PR', linkId:'PR-2026-0053'},
      {id:'AP-0487', stage:'Closed',      owner:'U-PO',  due:D(-10),source:'Internal Audit Q1', priority:'Medium',  title:'Cash-count documentation refresh', linkType:'',linkId:''},
      {id:'AP-0488', stage:'Open',        owner:'U-ED',  due:D(4),  source:'Board',             priority:'High',    title:'Approve LINK RISE budget reallocation', linkType:'',linkId:''},
    ];

    // Notifications
    const notifs = [
      {id:'N-001', to:'U-PO',  text:'AR-2026-0179 returned by Finance Manager', at:D(0), read:false, link:'AR-2026-0179'},
      {id:'N-002', to:'U-PO',  text:'AP-0480 due today',                         at:D(0), read:false, link:'AP-0480'},
      {id:'N-003', to:'U-GFO', text:'PV-2026-1245 awaiting your review',         at:D(0), read:false, link:'PV-2026-1245'},
      {id:'N-004', to:'U-FM',  text:'AR-2026-0177 recommended by HoP',           at:D(-1),read:false, link:'AR-2026-0177'},
      {id:'N-005', to:'U-ED',  text:'AR-2026-0176 awaiting ED approval',         at:D(-2),read:false, link:'AR-2026-0176'},
      {id:'N-006', to:'U-HOP', text:'New PR-2026-0050 from Project Officer',     at:D(-1),read:false, link:'PR-2026-0050'},
    ];

    // Audit log seed
    const audit = [
      {at:D(-32),who:'U-PO', entity:'AR',id:'AR-2026-0166', action:'submit',   note:'Submitted'},
      {at:D(-30),who:'U-HOP',entity:'AR',id:'AR-2026-0166', action:'recommend',note:'Recommended'},
      {at:D(-29),who:'U-FM', entity:'AR',id:'AR-2026-0166', action:'fm-approve',note:'Approved by FM'},
      {at:D(-28),who:'U-ED', entity:'AR',id:'AR-2026-0166', action:'ed-approve',note:'Approved by ED'},
      {at:D(-27),who:'U-GFO',entity:'AR',id:'AR-2026-0166', action:'disburse', note:'MK 1,840,000 disbursed'},
      {at:D(-3), who:'U-PO', entity:'AR',id:'AR-2026-0179', action:'submit',   note:'Submitted'},
      {at:D(-1), who:'U-FM', entity:'AR',id:'AR-2026-0179', action:'return',   note:'Returned: dates overlap'},
      {at:D(-2), who:'U-GFO',entity:'PV',id:'PV-2026-1246', action:'return',   note:'Returned: TPIN missing'},
      {at:D(0),  who:'U-PO', entity:'PV',id:'PV-2026-1247', action:'submit',   note:'Submitted'},
    ];

    return {
      __version: VERSION,
      __seededAt: new Date().toISOString(),
      activities, ars, pvs, vendors, prs, aps, notifs, audit,
      seq: { ar:181, pv:1248, pr:55, ap:488, act:164 }
    };
  }

  // ---------- Persistence ----------
  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (!raw) return seedDB();
      const parsed = JSON.parse(raw);
      if (parsed.__version !== VERSION) return seedDB();
      return parsed;
    } catch(e){ return seedDB(); }
  }
  function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); broadcast(); }

  let _state = load();
  if (!localStorage.getItem(KEY)) save(_state);
  const subscribers = new Set();
  function broadcast(){ subscribers.forEach(fn=>{ try{ fn(_state); }catch(e){} }); }
  function reload(){ _state = load(); broadcast(); }
  window.addEventListener('storage', e => { if (e.key === KEY) reload(); });

  // ---------- Public API ----------
  function list(coll, filter){
    const arr = _state[coll] || [];
    if (!filter) return arr.slice();
    return arr.filter(filter);
  }
  function get(coll, id){
    return (_state[coll] || []).find(r => r.id === id);
  }
  function create(coll, data){
    const arr = _state[coll] || (_state[coll] = []);
    arr.unshift(data);
    save(_state);
    return data;
  }
  function update(coll, id, patch){
    const arr = _state[coll] || [];
    const i = arr.findIndex(r => r.id === id);
    if (i < 0) return null;
    arr[i] = Object.assign({}, arr[i], patch);
    save(_state);
    return arr[i];
  }
  function remove(coll, id){
    const arr = _state[coll] || [];
    const i = arr.findIndex(r => r.id === id);
    if (i < 0) return false;
    arr.splice(i,1);
    save(_state);
    return true;
  }
  function audit(entity, id, action, who, note){
    (_state.audit || (_state.audit=[])).unshift({at:new Date().toISOString().slice(0,10), who, entity, id, action, note: note||''});
    save(_state);
  }
  function transition(flowKey, coll, id, action, who, note, extra){
    const flow = FLOWS[flowKey]; if (!flow) throw new Error('No flow '+flowKey);
    const rec = get(coll, id); if (!rec) throw new Error('No record '+id);
    const opts = flow.next[rec.stage] || [];
    const opt = opts.find(o => o.action === action);
    if (!opt) throw new Error('Action '+action+' not allowed from '+rec.stage);
    const patch = Object.assign({stage: opt.to}, extra||{});
    update(coll, id, patch);
    audit(flowKey, id, action, who, note || (opt.to));
    return get(coll, id);
  }
  function nextId(prefix, key){
    const seq = _state.seq || (_state.seq={});
    seq[key] = (seq[key]||0)+1;
    save(_state);
    const num = String(seq[key]).padStart(prefix==='AR'||prefix==='AR-2026'?4:4,'0');
    return prefix.includes('-') ? prefix+num : prefix+'-2026-'+num;
  }
  function notify(to, text, link){
    const id = 'N-'+Math.random().toString(36).slice(2,8).toUpperCase();
    create('notifs', {id, to, text, link, at:new Date().toISOString().slice(0,10), read:false});
  }
  function reset(){ _state = seedDB(); save(_state); }

  // ---------- Formatting ----------
  const fmt = {
    mwk(n){ if (n==null||isNaN(n)) return '—'; return 'MK '+Number(n).toLocaleString(); },
    short(n){ const v=Number(n)||0; if (v>=1e9) return 'MK '+(v/1e9).toFixed(2)+'B'; if (v>=1e6) return 'MK '+(v/1e6).toFixed(2)+'M'; if (v>=1e3) return 'MK '+(v/1e3).toFixed(0)+'K'; return 'MK '+v; },
    date(s){ if (!s) return '—'; const d = new Date(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}); },
    full(s){ if (!s) return '—'; const d = new Date(s); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); },
    since(s){ if (!s) return '—'; const d = new Date(s); const today = new Date('2026-05-08'); const diff = Math.round((today-d)/86400000); if (diff===0) return 'today'; if (diff===1) return 'yesterday'; if (diff>0) return diff+'d ago'; return 'in '+(-diff)+'d'; },
    until(s){ if (!s) return '—'; const d = new Date(s); const today = new Date('2026-05-08'); const diff = Math.round((d-today)/86400000); if (diff===0) return 'today'; if (diff===1) return 'tomorrow'; if (diff<0) return Math.abs(diff)+'d overdue'; return 'in '+diff+'d'; }
  };

  // ---------- Tone helpers ----------
  function stageTone(flowKey, stage){
    const map = {
      // AR
      'Draft':'gray','PO Submitted':'blue','HoP Recommended':'blue','FM Approved':'blue','ED Approved':'green','Disbursed':'green','Liquidation Pending':'amber','Liquidated':'green','Returned':'red','Rejected':'red',
      // PV
      'GFO Reviewed':'blue','Paid':'green','Posted':'green',
      // PR
      'Submitted':'blue','HoP Approved':'blue','RFQ Issued':'blue','Quotes Received':'amber','Evaluated':'blue','LPO Issued':'green','Goods Received':'green','Closed':'green','Cancelled':'red',
      // AP
      'Open':'amber','In Progress':'blue','Resolved':'green','Overdue':'red'
    };
    return map[stage] || 'gray';
  }

  // ---------- Expose ----------
  window.MACRO = {
    PROJECTS, USERS, DIP, FLOWS,
    state: () => _state,
    reload, save: () => save(_state), reset, broadcast,
    list, get, create, update, remove,
    transition, audit, nextId, notify,
    subscribe(fn){ subscribers.add(fn); return () => subscribers.delete(fn); },
    user(id){ return USERS.find(u=>u.id===id); },
    project(id){ return PROJECTS.find(p=>p.id===id); },
    dip(code){ return DIP.find(d=>d.code===code); },
    fmt, stageTone
  };
})();
