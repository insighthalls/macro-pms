-- =====================================================================
-- MACRO PMS · Seed data
-- Mirrors the prototype seed in /shared/macro-core.js
-- All amounts in MWK minor units (× 100). Run AFTER schema.sql.
-- Reference date: 2026-05-08.
-- Password hashes are placeholder argon2id hashes for "password123".
-- =====================================================================

INSERT INTO projects (id, code, name, donor, color_hex, ccy, budget_total, spent_total, period_start, period_end) VALUES
  ('IMP','IMPACT KP','IMPACT KP — DREAMS Plus',                  'PEPFAR / USAID',                  '#1F4E79','MWK', 584000000000, 392700000000, '2024-10-01','2027-09-30'),
  ('LRR','LINK RISE','LINK RISE — TB & HIV Continuum',           'Global Fund · NMF4',              '#7A1F4E','MWK', 812000000000, 431200000000, '2024-04-01','2027-03-31'),
  ('AGY','AGYW Plus','AGYW Plus — Adolescent Girls',              'CIFF · Children''s Investment',  '#1F794E','MWK', 214000000000, 101800000000, '2025-01-01','2026-12-31'),
  ('TKD','Tikondane FT','Tikondane Fast-Track',                   'Embassy of Norway',               '#794E1F','MWK',  98000000000,  61240000000, '2025-07-01','2026-06-30'),
  ('COR','Core Ops','Core Operations',                            'Multi-donor pool',                '#4E1F79','MWK', 164000000000, 108800000000, '2025-07-01','2026-06-30');

INSERT INTO users (id, full_name, role, email, region, password_hash, primary_proj, initials) VALUES
  ('U-PO',  'Tendai Phiri',       'PROJECT_OFFICER',       't.phiri@macro.org',     'KP',  '$argon2id$v=19$m=65536,t=3,p=4$placeholder', 'IMP','TP'),
  ('U-HOP', 'Chimwemwe Banda',    'HEAD_OF_PROGRAMS',      'c.banda@macro.org',     'HQ',  '$argon2id$v=19$m=65536,t=3,p=4$placeholder', 'IMP','CB'),
  ('U-GFO', 'Dalitso Nkhata',     'GRANT_FINANCE_OFFICER', 'd.nkhata@macro.org',    'HQ',  '$argon2id$v=19$m=65536,t=3,p=4$placeholder', 'IMP','DN'),
  ('U-FM',  'Ruth Mwale',         'FINANCE_MANAGER',       'r.mwale@macro.org',     'HQ',  '$argon2id$v=19$m=65536,t=3,p=4$placeholder', NULL, 'RM'),
  ('U-ED',  'Eleanor Phiri',      'EXECUTIVE_DIRECTOR',    'e.phiri@macro.org',     'HQ',  '$argon2id$v=19$m=65536,t=3,p=4$placeholder', NULL, 'EP'),
  ('U-PRC', 'Watson Lungu',       'PROCUREMENT_OFFICER',   'w.lungu@macro.org',     'HQ',  '$argon2id$v=19$m=65536,t=3,p=4$placeholder', NULL, 'WL'),
  ('U-ADM', 'Florence Mhone',     'ADMINISTRATOR',         'f.mhone@macro.org',     'HQ',  '$argon2id$v=19$m=65536,t=3,p=4$placeholder', NULL, 'FM'),
  ('U-VND', 'Sunbird Stationers', 'VENDOR',                'ar@sunbird.mw',         'Lilongwe','$argon2id$v=19$m=65536,t=3,p=4$placeholder', NULL,'SS');

INSERT INTO user_project_access (user_id, proj_id) VALUES
  ('U-PO','IMP'), ('U-HOP','IMP'), ('U-HOP','LRR'), ('U-HOP','AGY'),
  ('U-GFO','IMP'), ('U-GFO','LRR'), ('U-GFO','AGY'), ('U-GFO','TKD'), ('U-GFO','COR'),
  ('U-FM','IMP'),  ('U-FM','LRR'),  ('U-FM','AGY'),  ('U-FM','TKD'),  ('U-FM','COR'),
  ('U-ED','IMP'),  ('U-ED','LRR'),  ('U-ED','AGY'),  ('U-ED','TKD'),  ('U-ED','COR'),
  ('U-PRC','IMP'), ('U-PRC','LRR'), ('U-PRC','AGY'), ('U-PRC','TKD'), ('U-PRC','COR'),
  ('U-ADM','IMP'), ('U-ADM','LRR'), ('U-ADM','AGY'), ('U-ADM','TKD'), ('U-ADM','COR');

INSERT INTO dip_lines (code, proj_id, label, budget_amount, committed, spent) VALUES
  ('DIP-1.1.1','IMP','KP outreach – Lilongwe Cluster',    8400000000, 1840000000, 4120000000),
  ('DIP-1.1.2','IMP','KP outreach – Mzuzu / Karonga',     6200000000, 1260000000, 2840000000),
  ('DIP-2.4.1','IMP','Peer-led case finding',             4120000000,  680000000, 3690000000),
  ('DIP-2.4.2','IMP','Index-testing field operations',    3350000000,  410000000, 1870000000),
  ('DIP-3.2.1','IMP','CHW stipends Q3',                   2880000000,  960000000, 1240000000),
  ('DIP-4.1.1','IMP','Training & workshops',              3640000000,  320000000, 1980000000),
  ('DIP-1.2.1','LRR','TB community screening',            9200000000, 1480000000, 3870000000),
  ('DIP-2.1.1','LRR','Sample transport network',          4760000000,  620000000, 2630000000),
  ('DIP-3.1.1','AGY','Safe-spaces operations',            5480000000,  840000000, 2190000000),
  ('DIP-3.1.2','AGY','Mentor stipends',                   2240000000,  310000000, 1140000000),
  ('DIP-9.1.1','COR','Office utilities & rent',           8400000000,  700000000, 4900000000),
  ('DIP-9.2.1','COR','Vehicle running & fuel',            3840000000,  420000000, 2210000000);

INSERT INTO vendors (id, name, tpin, category, contact_email, payment_terms, status, paid_ytd) VALUES
  ('V-001','Sunbird Stationers',  '21048372','Printing & Stationery',   'ar@sunbird.mw',           'Net 30','ACTIVE', 1840000000),
  ('V-002','AfriRide Logistics',  '30471284','Transport & Vehicle Hire','ops@afriride.mw',         'Net 30','ACTIVE', 4260000000),
  ('V-003','Lakeshore Lodge',     '18374625','Hospitality & Venue',     'sales@lakeshore.mw',      'Net 14','ACTIVE', 1124000000),
  ('V-004','Reagent Supplies Mw', '29384726','Lab & Medical Supplies',  'orders@rsm.mw',           'Net 45','ACTIVE', 7840000000),
  ('V-005','Capital Print House', '20183746','Printing & Stationery',   'jobs@capitalprint.mw',    'Net 30','ACTIVE',  624000000),
  ('V-006','Crossroads Hotel',    '14283746','Hospitality & Venue',     'reservations@crossroads.mw','Net 14','ACTIVE', 412000000),
  ('V-007','PetroMax Ltd',        '10293847','Fuel & Lubricants',       'fleet@petromax.mw',       'Net 30','ACTIVE', 1480000000),
  ('V-008','Northern Tents & Hire','17283746','Equipment Hire',         'info@northerntents.mw',   '—',     'PENDING',         0);

INSERT INTO activities (id, proj_id, dip_code, title, officer_id, stage, budget_amount, advance_amount, spent_amount, due_liq_date, start_date) VALUES
  ('ACT-2026-0138','IMP','DIP-2.4.1','Lilongwe peer-educator stand-down','U-PO','LIQUIDATE',184000000,184000000,171000000,'2026-05-05','2026-04-26'),
  ('ACT-2026-0142','IMP','DIP-1.1.2','Mzuzu KP cluster mapping',         'U-PO','EXECUTE',  324000000,240000000,112000000,'2026-05-19','2026-05-05'),
  ('ACT-2026-0148','IMP','DIP-2.4.2','Index testing field rotation',     'U-PO','EXECUTE',  246000000,184000000, 98000000,'2026-05-14','2026-05-07'),
  ('ACT-2026-0151','IMP','DIP-2.4.2','Karonga sample-transport refresher','U-PO','ADVANCE', 218000000,        0,        0,'2026-05-26','2026-05-10'),
  ('ACT-2026-0153','LRR','DIP-3.2.1','TB CHW stipend cycle Q3',          'U-PO','SOW',      960000000,        0,        0,'2026-06-05','2026-05-16'),
  ('ACT-2026-0156','AGY','DIP-3.1.2','Mentor onboarding · Cohort 4',     'U-PO','CONCEPT',  310000000,        0,        0,'2026-06-11','2026-05-22'),
  ('ACT-2026-0159','COR','DIP-9.1.1','HQ utilities cycle May',           'U-ADM','LIQUIDATE',700000000,700000000,684000000,'2026-05-03','2026-04-24');

INSERT INTO advance_requests (id, activity_id, proj_id, dip_code, title, amount, requested_by, stage, submitted_at) VALUES
  ('AR-2026-0166','ACT-2026-0138','IMP','DIP-2.4.1','Lilongwe peer-educator stand-down',184000000,'U-PO','LIQUIDATION_PENDING','2026-04-06'),
  ('AR-2026-0179','ACT-2026-0142','IMP','DIP-1.1.2','Mzuzu KP cluster mapping',         240000000,'U-PO','RETURNED',           '2026-05-05'),
  ('AR-2026-0180','ACT-2026-0148','IMP','DIP-2.4.2','Index testing field rotation',     184000000,'U-PO','DISBURSED',          '2026-05-01'),
  ('AR-2026-0181','ACT-2026-0151','IMP','DIP-2.4.2','Karonga sample-transport refresher',218000000,'U-PO','PO_SUBMITTED',      '2026-05-08'),
  ('AR-2026-0178','ACT-2026-0144','IMP','DIP-1.1.1','Hot-spot mapping review',          196000000,'U-PO','LIQUIDATED',         '2026-04-16'),
  ('AR-2026-0177','ACT-2026-0144','IMP','DIP-1.1.1','Lilongwe weekend KP outreach',     124000000,'U-PO','HOP_RECOMMENDED',    '2026-05-07'),
  ('AR-2026-0176','ACT-2026-0153','LRR','DIP-3.2.1','TB CHW stipend cycle Q3',          960000000,'U-PO','FM_APPROVED',        '2026-05-06'),
  ('AR-2026-0175','ACT-2026-0156','AGY','DIP-3.1.2','Mentor onboarding · Cohort 4',     310000000,'U-PO','ED_APPROVED',        '2026-05-04'),
  ('AR-2026-0174','ACT-2026-0159','COR','DIP-9.1.1','HQ utilities cycle May',           700000000,'U-ADM','LIQUIDATION_PENDING','2026-04-23'),
  ('AR-2026-0173','ACT-2026-0148','IMP','DIP-2.4.2','Index testing top-up',              84000000,'U-PO','REJECTED',           '2026-05-02');

INSERT INTO payment_vouchers (id, proj_id, dip_code, vendor_id, payee_name, net_amount, vat_amount, wht_amount, gross_amount, title, stage, submitted_at) VALUES
  ('PV-2026-1240','IMP','DIP-2.4.1','V-001','Sunbird Stationers',     48600000, 7290000, 5400000, 54000000,'Workshop printing · Lilongwe','POSTED',     '2026-04-16'),
  ('PV-2026-1241','IMP','DIP-1.1.1','V-002','AfriRide Logistics',    124000000,18600000,16000000,140000000,'Vehicle hire · Mzuzu run',    'PAID',       '2026-04-23'),
  ('PV-2026-1242','IMP','DIP-4.1.1','V-003','Lakeshore Lodge',       264000000,39600000,36000000,300000000,'Workshop venue · Salima',     'ED_APPROVED','2026-05-03'),
  ('PV-2026-1243','LRR','DIP-1.2.1','V-004','Reagent Supplies Mw',   584000000,87600000,56000000,640000000,'Sample collection consumables','FM_APPROVED','2026-05-06'),
  ('PV-2026-1244','IMP','DIP-3.2.1', NULL,  'Tendai Phiri (Imprest)', 28400000,        0,        0, 28400000,'Imprest top-up · field DSA',  'GFO_REVIEWED','2026-05-07'),
  ('PV-2026-1245','IMP','DIP-2.4.2','V-005','Capital Print House',    41200000, 6180000, 5200000, 46400000,'Index-testing job aids',      'PO_SUBMITTED','2026-05-08'),
  ('PV-2026-1246','AGY','DIP-3.1.1','V-006','Crossroads Hotel',      118000000,17700000,14000000,132000000,'Safe-space convening accommodation','RETURNED','2026-05-06'),
  ('PV-2026-1247','COR','DIP-9.2.1','V-007','PetroMax Ltd',           88000000,13200000,12000000,100000000,'Fuel reconciliation · April',  'PO_SUBMITTED','2026-05-08'),
  ('PV-2026-1248','IMP','DIP-2.4.2','V-001','Sunbird Stationers',    184000000,27600000,24000000,208000000,'Index-testing field rotation', 'DRAFT', NULL);

INSERT INTO procurement_requisitions (id, proj_id, dip_code, requested_by, description, amount, stage, raised_at) VALUES
  ('PR-2026-0050','IMP','DIP-4.1.1','U-PO', 'Workshop venue & catering · Salima',  300000000,'SUBMITTED',     '2026-05-07'),
  ('PR-2026-0051','LRR','DIP-1.2.1','U-PO', 'Sample collection consumables Q3',    640000000,'HOP_APPROVED',  '2026-05-05'),
  ('PR-2026-0052','IMP','DIP-2.4.2','U-PO', 'Job-aid printing · 2,000 sets',       124000000,'RFQ_ISSUED',    '2026-05-03'),
  ('PR-2026-0053','IMP','DIP-1.1.1','U-PO', 'Vehicle hire 30-day · Lilongwe',      280000000,'QUOTES_RECEIVED','2026-05-01'),
  ('PR-2026-0054','COR','DIP-9.2.1','U-ADM','HQ generator service contract',       164000000,'EVALUATED',     '2026-04-29'),
  ('PR-2026-0055','AGY','DIP-3.1.1','U-PO', 'Safe-space stationery cycle',          98000000,'LPO_ISSUED',    '2026-04-26');

INSERT INTO action_points (id, title, source, priority, owner_id, due_date, stage, link_kind, link_id) VALUES
  ('AP-0480','Submit attendance scans for ACT-2026-0142','Internal Audit Q1','HIGH','U-PO', '2026-05-08','OPEN',       'AR','AR-2026-0179'),
  ('AP-0481','Reconcile 19-day overdue liquidation AR-0166','FM Review','MEDIUM','U-PO',   '2026-05-10','IN_PROGRESS','AR','AR-2026-0166'),
  ('AP-0482','Sign-off SOW for TB CHW stipend cycle Q3','Donor Mission','HIGH','U-HOP',    '2026-05-09','OPEN',       'AR','AR-2026-0176'),
  ('AP-0483','TPIN missing on PV-2026-1246','Pre-payment','HIGH','U-GFO',                  '2026-05-08','OPEN',       'PV','PV-2026-1246'),
  ('AP-0484','Upload Karonga workshop scans','Internal Audit Q1','LOW','U-PO',             '2026-05-05','RESOLVED',   'ACT','ACT-2026-0144'),
  ('AP-0485','Review DIP-2.4.1 over-spend trend','External Audit','HIGH','U-FM',           '2026-05-11','OPEN',       NULL,NULL),
  ('AP-0486','Re-issue RFQ for PR-2026-0053 (one quote only)','Procurement','MEDIUM','U-PRC','2026-05-10','IN_PROGRESS','PR','PR-2026-0053'),
  ('AP-0487','Cash-count documentation refresh','Internal Audit Q1','MEDIUM','U-PO',       '2026-04-28','CLOSED',     NULL,NULL),
  ('AP-0488','Approve LINK RISE budget reallocation','Board','HIGH','U-ED',                '2026-05-12','OPEN',       NULL,NULL);

INSERT INTO notifications (id, recipient, text, link_kind, link_id) VALUES
  ('N-001','U-PO',  'AR-2026-0179 returned by Finance Manager','AR','AR-2026-0179'),
  ('N-002','U-PO',  'AP-0480 due today','AP','AP-0480'),
  ('N-003','U-GFO', 'PV-2026-1245 awaiting your review','PV','PV-2026-1245'),
  ('N-004','U-FM',  'AR-2026-0177 recommended by HoP','AR','AR-2026-0177'),
  ('N-005','U-ED',  'AR-2026-0176 awaiting ED approval','AR','AR-2026-0176'),
  ('N-006','U-HOP', 'New PR-2026-0050 from Project Officer','PR','PR-2026-0050');

INSERT INTO approval_matrix (id, entity_kind, threshold_low, threshold_high, route) VALUES
  ('AR<2M',   'AR',          0,  200000000, '["HOP","FM"]'::jsonb),
  ('AR2-10M', 'AR',  200000000, 1000000000, '["HOP","FM","ED"]'::jsonb),
  ('AR>10M',  'AR', 1000000000,       NULL, '["HOP","FM","ED","BOARD"]'::jsonb),
  ('PV<1M',   'PV',          0,  100000000, '["GFO","FM"]'::jsonb),
  ('PV1-5M',  'PV',  100000000,  500000000, '["GFO","FM","ED"]'::jsonb),
  ('PV>5M',   'PV',  500000000,       NULL, '["GFO","FM","ED"]'::jsonb),
  ('PR<3M',   'PR',          0,  300000000, '["HOP","PRC"]'::jsonb),
  ('PR>3M',   'PR',  300000000,       NULL, '["HOP","FM","PRC"]'::jsonb);

-- Audit chain seed (simplified — real impl computes hash chain)
INSERT INTO audit_log (at, who, entity, entity_id, action, note) VALUES
  ('2026-04-06 09:00+02','U-PO', 'AR','AR-2026-0166','submit',    'Submitted'),
  ('2026-04-08 10:30+02','U-HOP','AR','AR-2026-0166','recommend', 'Recommended'),
  ('2026-04-09 14:15+02','U-FM', 'AR','AR-2026-0166','fm-approve','Approved by FM'),
  ('2026-04-10 11:40+02','U-ED', 'AR','AR-2026-0166','ed-approve','Approved by ED'),
  ('2026-04-11 16:00+02','U-GFO','AR','AR-2026-0166','disburse',  'MK 1,840,000 disbursed'),
  ('2026-05-05 09:30+02','U-PO', 'AR','AR-2026-0179','submit',    'Submitted'),
  ('2026-05-07 12:10+02','U-FM', 'AR','AR-2026-0179','return',    'Returned: dates overlap'),
  ('2026-05-06 15:20+02','U-GFO','PV','PV-2026-1246','return',    'Returned: TPIN missing'),
  ('2026-05-08 08:45+02','U-PO', 'PV','PV-2026-1247','submit',    'Submitted');
