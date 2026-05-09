-- =====================================================================
-- MACRO PMS · PostgreSQL 15+ DDL
-- =====================================================================
-- Naming: snake_case tables, plural; PKs are 'id' (text, prefixed code)
-- All money amounts in MWK minor units (kwacha × 100) stored as bigint.
-- All timestamps stored as 'timestamptz'; app default tz Africa/Blantyre.
-- Soft delete via deleted_at where data must be recoverable; hard delete
-- forbidden on AR / PV / PR / audit / document_versions.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;          -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;            -- case-insensitive email

-- ----- ENUMS ----------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'PROJECT_OFFICER','HEAD_OF_PROGRAMS','GRANT_FINANCE_OFFICER',
  'FINANCE_MANAGER','EXECUTIVE_DIRECTOR','PROCUREMENT_OFFICER',
  'ADMINISTRATOR','VENDOR'
);

CREATE TYPE ar_stage AS ENUM (
  'DRAFT','PO_SUBMITTED','HOP_RECOMMENDED','FM_APPROVED','ED_APPROVED',
  'DISBURSED','LIQUIDATION_PENDING','LIQUIDATED','RETURNED','REJECTED'
);

CREATE TYPE pv_stage AS ENUM (
  'DRAFT','PO_SUBMITTED','GFO_REVIEWED','FM_APPROVED','ED_APPROVED',
  'PAID','POSTED','RETURNED','REJECTED'
);

CREATE TYPE pr_stage AS ENUM (
  'DRAFT','SUBMITTED','HOP_APPROVED','RFQ_ISSUED','QUOTES_RECEIVED',
  'EVALUATED','LPO_ISSUED','GOODS_RECEIVED','CLOSED','CANCELLED'
);

CREATE TYPE ap_stage AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');
CREATE TYPE priority   AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');

CREATE TYPE entity_kind AS ENUM ('AR','PV','PR','AP','ACT','VENDOR','BR','EFT','SOW');

-- ----- TENANCY / IDENTITY ---------------------------------------------
CREATE TABLE projects (
  id           text PRIMARY KEY,                       -- 'IMP'
  code         text NOT NULL UNIQUE,
  name         text NOT NULL,
  donor        text NOT NULL,
  color_hex    text NOT NULL,
  ccy          char(3) NOT NULL DEFAULT 'MWK',
  budget_total bigint NOT NULL CHECK (budget_total >= 0),
  spent_total  bigint NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end   date NOT NULL,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            text PRIMARY KEY,                      -- 'U-PO'
  full_name     text NOT NULL,
  role          user_role NOT NULL,
  email         citext NOT NULL UNIQUE,
  phone         text,
  region        text,
  password_hash text NOT NULL,                         -- argon2id
  mfa_secret    text,                                  -- nullable: TOTP secret
  primary_proj  text REFERENCES projects(id),
  initials      text NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_project_access (
  user_id  text NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  proj_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, proj_id)
);

CREATE TABLE refresh_tokens (
  jti        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_at  timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked    boolean NOT NULL DEFAULT false,
  ua_hash    text,
  ip         inet
);
CREATE INDEX ON refresh_tokens (user_id);

-- ----- BUDGET STRUCTURE -----------------------------------------------
CREATE TABLE dip_lines (
  code            text PRIMARY KEY,                    -- 'DIP-2.4.1'
  proj_id         text NOT NULL REFERENCES projects(id),
  label           text NOT NULL,
  budget_amount   bigint NOT NULL CHECK (budget_amount >= 0),
  committed       bigint NOT NULL DEFAULT 0,
  spent           bigint NOT NULL DEFAULT 0,
  watch           boolean NOT NULL DEFAULT false,
  closed          boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON dip_lines (proj_id);

CREATE TABLE budget_revisions (
  id            text PRIMARY KEY,                      -- 'BR-2026-0007'
  proj_id       text NOT NULL REFERENCES projects(id),
  effective_date date NOT NULL,
  donor_auth_ref text,
  donor_auth_doc_id text REFERENCES documents(id),
  justification text NOT NULL,
  status        text NOT NULL DEFAULT 'DRAFT',         -- DRAFT|FM_SUBMITTED|ED_APPROVED|REJECTED
  created_by    text NOT NULL REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE budget_revision_lines (
  rev_id     text NOT NULL REFERENCES budget_revisions(id) ON DELETE CASCADE,
  dip_code   text NOT NULL REFERENCES dip_lines(code),
  amount_from bigint NOT NULL,
  amount_to   bigint NOT NULL,
  PRIMARY KEY (rev_id, dip_code)
);

-- ----- VENDORS ---------------------------------------------------------
CREATE TABLE vendors (
  id          text PRIMARY KEY,                        -- 'V-001'
  name        text NOT NULL,
  tpin        text NOT NULL UNIQUE,
  category    text NOT NULL,
  contact_email citext,
  contact_phone text,
  address     text,
  bank_name   text,
  bank_acct   text,
  ifsc_swift  text,
  payment_terms text,                                  -- 'Net 30'
  status      text NOT NULL DEFAULT 'PENDING',         -- PENDING|ACTIVE|SUSPENDED|BLACKLISTED
  paid_ytd    bigint NOT NULL DEFAULT 0,
  on_time_pct numeric(5,2),
  three_way_match_pct numeric(5,2),
  dispute_count int NOT NULL DEFAULT 0,
  ceiling_amount bigint,                               -- annual ceiling, null=unlimited
  wtec_ref    text,
  wtec_expires date,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON vendors (status);
CREATE INDEX ON vendors (wtec_expires) WHERE wtec_expires IS NOT NULL;

-- ----- ACTIVITIES ------------------------------------------------------
CREATE TABLE activities (
  id            text PRIMARY KEY,                      -- 'ACT-2026-0138'
  proj_id       text NOT NULL REFERENCES projects(id),
  dip_code      text NOT NULL REFERENCES dip_lines(code),
  title         text NOT NULL,
  description   text,
  officer_id    text NOT NULL REFERENCES users(id),
  stage         text NOT NULL DEFAULT 'CONCEPT',       -- CONCEPT|SOW|ADVANCE|EXECUTE|LIQUIDATE|CLOSED
  budget_amount bigint NOT NULL CHECK (budget_amount >= 0),
  advance_amount bigint NOT NULL DEFAULT 0,
  spent_amount   bigint NOT NULL DEFAULT 0,
  start_date    date,
  end_date      date,
  due_liq_date  date,
  location      text,
  participants_planned int,
  participants_actual  int,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON activities (officer_id);
CREATE INDEX ON activities (proj_id, stage);

-- ----- ADVANCE REQUESTS -----------------------------------------------
CREATE TABLE advance_requests (
  id            text PRIMARY KEY,                      -- 'AR-2026-0179'
  activity_id   text REFERENCES activities(id),
  proj_id       text NOT NULL REFERENCES projects(id),
  dip_code      text NOT NULL REFERENCES dip_lines(code),
  title         text NOT NULL,
  amount        bigint NOT NULL CHECK (amount > 0),
  requested_by  text NOT NULL REFERENCES users(id),
  stage         ar_stage NOT NULL DEFAULT 'DRAFT',
  submitted_at  timestamptz,
  recommended_by text REFERENCES users(id),
  recommended_at timestamptz,
  fm_approved_by text REFERENCES users(id),
  fm_approved_at timestamptz,
  ed_approved_by text REFERENCES users(id),
  ed_approved_at timestamptz,
  disbursed_at  timestamptz,
  due_liq_date  date,
  liquidated_at timestamptz,
  liquidated_amount bigint,
  return_reason text,
  returned_by   text REFERENCES users(id),
  reject_reason text,
  rejected_by   text REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON advance_requests (stage);
CREATE INDEX ON advance_requests (requested_by, stage);
CREATE INDEX ON advance_requests (proj_id, stage);

CREATE TABLE ar_budget_lines (
  ar_id       text NOT NULL REFERENCES advance_requests(id) ON DELETE CASCADE,
  line_no     int  NOT NULL,
  description text NOT NULL,
  qty         numeric(12,2) NOT NULL,
  unit        text,
  unit_rate   bigint NOT NULL,
  amount      bigint NOT NULL,
  PRIMARY KEY (ar_id, line_no)
);

-- ----- PURCHASE / PROCUREMENT REQUISITIONS ----------------------------
CREATE TABLE procurement_requisitions (
  id            text PRIMARY KEY,                      -- 'PR-2026-0050'
  proj_id       text NOT NULL REFERENCES projects(id),
  dip_code      text NOT NULL REFERENCES dip_lines(code),
  requested_by  text NOT NULL REFERENCES users(id),
  description   text NOT NULL,
  amount        bigint NOT NULL CHECK (amount > 0),
  stage         pr_stage NOT NULL DEFAULT 'DRAFT',
  raised_at     date NOT NULL,
  hop_approved_at timestamptz,
  rfq_issued_at timestamptz,
  evaluated_at  timestamptz,
  lpo_issued_at timestamptz,
  goods_received_at timestamptz,
  closed_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON procurement_requisitions (stage);

CREATE TABLE rfq_quotes (
  id           text PRIMARY KEY,                       -- 'Q-2026-0123'
  pr_id        text NOT NULL REFERENCES procurement_requisitions(id),
  vendor_id    text NOT NULL REFERENCES vendors(id),
  quoted_amount bigint NOT NULL,
  delivery_days int,
  warranty     text,
  technical_score numeric(5,2),
  recommended  boolean NOT NULL DEFAULT false,
  received_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE local_purchase_orders (
  id          text PRIMARY KEY,                        -- 'LPO-2026-0234'
  pr_id       text NOT NULL REFERENCES procurement_requisitions(id),
  vendor_id   text NOT NULL REFERENCES vendors(id),
  total_amount bigint NOT NULL,
  issued_at   timestamptz NOT NULL DEFAULT now(),
  issued_by   text NOT NULL REFERENCES users(id),
  delivery_address text,
  expected_delivery date,
  status      text NOT NULL DEFAULT 'OPEN'             -- OPEN|FULFILLED|PARTIAL|CANCELLED
);

CREATE TABLE goods_received_notes (
  id          text PRIMARY KEY,                        -- 'GRN-2026-0091'
  lpo_id      text NOT NULL REFERENCES local_purchase_orders(id),
  received_at date NOT NULL,
  received_by text NOT NULL REFERENCES users(id),
  qty_received numeric(12,2),
  condition_notes text,
  match_status text NOT NULL DEFAULT 'PENDING'         -- PENDING|MATCHED|VARIANCE
);

-- ----- PAYMENT VOUCHERS -----------------------------------------------
CREATE TABLE payment_vouchers (
  id            text PRIMARY KEY,                      -- 'PV-2026-1248'
  proj_id       text NOT NULL REFERENCES projects(id),
  dip_code      text NOT NULL REFERENCES dip_lines(code),
  ar_id         text REFERENCES advance_requests(id),  -- nullable: imprest top-ups, vendor invoices
  pr_id         text REFERENCES procurement_requisitions(id),
  lpo_id        text REFERENCES local_purchase_orders(id),
  grn_id        text REFERENCES goods_received_notes(id),
  vendor_id     text REFERENCES vendors(id),           -- nullable for imprest
  payee_name    text NOT NULL,
  bank_acct     text,
  bank_name     text,
  net_amount    bigint NOT NULL CHECK (net_amount >= 0),
  vat_amount    bigint NOT NULL DEFAULT 0,
  wht_amount    bigint NOT NULL DEFAULT 0,
  gross_amount  bigint NOT NULL,
  title         text NOT NULL,
  stage         pv_stage NOT NULL DEFAULT 'DRAFT',
  prepared_by   text REFERENCES users(id),
  submitted_at  timestamptz,
  gfo_reviewed_by text REFERENCES users(id),
  gfo_reviewed_at timestamptz,
  fm_approved_by text REFERENCES users(id),
  fm_approved_at timestamptz,
  ed_approved_by text REFERENCES users(id),
  ed_approved_at timestamptz,
  paid_at       timestamptz,
  paid_by       text REFERENCES users(id),
  posted_at     timestamptz,                          -- to GL
  return_reason text,
  returned_by   text REFERENCES users(id),
  reject_reason text,
  rejected_by   text REFERENCES users(id),
  bundle_doc_id text,                                  -- generated PDF
  eft_batch_id  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON payment_vouchers (stage);
CREATE INDEX ON payment_vouchers (vendor_id, stage);
CREATE INDEX ON payment_vouchers (proj_id, stage);

CREATE TABLE pv_lines (
  pv_id       text NOT NULL REFERENCES payment_vouchers(id) ON DELETE CASCADE,
  line_no     int  NOT NULL,
  description text NOT NULL,
  qty         numeric(12,2) NOT NULL,
  unit        text,
  unit_rate   bigint NOT NULL,
  amount      bigint NOT NULL,
  vat_rate    numeric(5,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (pv_id, line_no)
);

-- ----- ACTION POINTS / ESCALATIONS ------------------------------------
CREATE TABLE action_points (
  id          text PRIMARY KEY,                        -- 'AP-0480'
  title       text NOT NULL,
  source      text NOT NULL,                           -- 'Internal Audit Q1' etc.
  priority    priority NOT NULL DEFAULT 'MEDIUM',
  owner_id    text NOT NULL REFERENCES users(id),
  due_date    date NOT NULL,
  stage       ap_stage NOT NULL DEFAULT 'OPEN',
  link_kind   entity_kind,
  link_id     text,
  resolution_note text,
  closed_at   timestamptz,
  closed_by   text REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON action_points (owner_id, stage);
CREATE INDEX ON action_points (due_date) WHERE stage IN ('OPEN','IN_PROGRESS');

-- ----- DOCUMENTS / FILES ----------------------------------------------
CREATE TABLE documents (
  id          text PRIMARY KEY,                        -- 'DOC-...'
  s3_key      text NOT NULL UNIQUE,
  filename    text NOT NULL,
  mime_type   text NOT NULL,
  size_bytes  bigint NOT NULL,
  sha256      text NOT NULL,                           -- integrity
  uploaded_by text NOT NULL REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE entity_attachments (
  entity_kind entity_kind NOT NULL,
  entity_id   text NOT NULL,
  doc_id      text NOT NULL REFERENCES documents(id),
  attached_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_kind, entity_id, doc_id)
);

-- versioning of generated bundles (Voucher Bundle, AR PDF, etc.)
CREATE TABLE document_versions (
  entity_kind entity_kind NOT NULL,
  entity_id   text NOT NULL,
  version_no  int  NOT NULL,
  doc_id      text NOT NULL REFERENCES documents(id),
  diff_summary text,
  changed_by  text NOT NULL REFERENCES users(id),
  changed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_kind, entity_id, version_no)
);

-- ----- AUDIT LOG (append-only) ----------------------------------------
CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  who         text NOT NULL REFERENCES users(id),
  entity      entity_kind NOT NULL,
  entity_id   text NOT NULL,
  action      text NOT NULL,                           -- 'submit','approve','return',...
  note        text,
  prev_hash   text,                                    -- chain hash of previous row
  hash        text                                     -- sha256(prev_hash || row payload)
);
CREATE INDEX ON audit_log (entity, entity_id);
CREATE INDEX ON audit_log (who, at DESC);

-- ----- NOTIFICATIONS ---------------------------------------------------
CREATE TABLE notifications (
  id        text PRIMARY KEY,
  recipient text NOT NULL REFERENCES users(id),
  text      text NOT NULL,
  link_kind entity_kind,
  link_id   text,
  read      boolean NOT NULL DEFAULT false,
  read_at   timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON notifications (recipient, read) WHERE read = false;

-- ----- EFT BATCHES -----------------------------------------------------
CREATE TABLE eft_batches (
  id          text PRIMARY KEY,                        -- 'EFT-2026-0091'
  bank_code   text NOT NULL,                           -- 'STD','NBM','NBS'
  pacs008_xml_doc_id text REFERENCES documents(id),
  total_amount bigint NOT NULL,
  count_payments int NOT NULL,
  status      text NOT NULL DEFAULT 'DRAFT',           -- DRAFT|LOCKED|SUBMITTED|CONFIRMED|REJECTED
  submitted_at timestamptz,
  submitted_by text REFERENCES users(id),
  bank_ack_ref text,
  bank_ack_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE eft_batch_items (
  batch_id    text NOT NULL REFERENCES eft_batches(id) ON DELETE CASCADE,
  pv_id       text NOT NULL REFERENCES payment_vouchers(id) UNIQUE,
  PRIMARY KEY (batch_id, pv_id)
);

-- ----- RECURRING TRANSACTIONS -----------------------------------------
CREATE TABLE recurring_transactions (
  id          text PRIMARY KEY,                        -- 'REC-001'
  name        text NOT NULL,
  proj_id     text NOT NULL REFERENCES projects(id),
  dip_code    text NOT NULL REFERENCES dip_lines(code),
  amount      bigint NOT NULL,
  frequency   text NOT NULL,                           -- 'MONTHLY','QUARTERLY','ANNUAL'
  next_run_at date NOT NULL,
  payee_count int NOT NULL DEFAULT 1,
  payee_payload jsonb NOT NULL DEFAULT '[]'::jsonb,    -- array of {payee_name, amount, bank}
  type        text NOT NULL,                           -- 'STIPEND','RENT','UTILITY','RETAINER','INSURANCE'
  active      boolean NOT NULL DEFAULT true,
  created_by  text NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recurring_runs (
  id          bigserial PRIMARY KEY,
  rec_id      text NOT NULL REFERENCES recurring_transactions(id),
  ran_at      timestamptz NOT NULL DEFAULT now(),
  pv_ids      text[] NOT NULL DEFAULT '{}',
  status      text NOT NULL                            -- 'GENERATED','FAILED','SKIPPED'
);

-- ----- APPROVAL MATRIX -------------------------------------------------
CREATE TABLE approval_matrix (
  id          text PRIMARY KEY,                        -- 'AR<2M' etc.
  entity_kind entity_kind NOT NULL,                    -- AR / PV / PR
  threshold_low  bigint NOT NULL DEFAULT 0,
  threshold_high bigint,                               -- nullable = unbounded
  route       jsonb NOT NULL,                          -- ['HOP','FM','ED']
  active      boolean NOT NULL DEFAULT true,
  effective_at timestamptz NOT NULL DEFAULT now()
);

-- ----- INTEGRATIONS / WEBHOOKS ----------------------------------------
CREATE TABLE webhook_endpoints (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  url         text NOT NULL,
  secret      text NOT NULL,
  events      text[] NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id          bigserial PRIMARY KEY,
  endpoint_id text NOT NULL REFERENCES webhook_endpoints(id),
  event       text NOT NULL,
  payload     jsonb NOT NULL,
  status      text NOT NULL,                           -- 'PENDING','DELIVERED','FAILED'
  http_code   int,
  attempts    int NOT NULL DEFAULT 0,
  delivered_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ----- FEATURE FLAGS ---------------------------------------------------
CREATE TABLE feature_flags (
  key         text PRIMARY KEY,
  description text,
  rollout_pct int NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  enabled     boolean NOT NULL DEFAULT false,
  updated_by  text REFERENCES users(id),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- Triggers · maintain updated_at + DIP balance integrity
-- =====================================================================
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ar_touch  BEFORE UPDATE ON advance_requests
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_pv_touch  BEFORE UPDATE ON payment_vouchers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_act_touch BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================================
-- Row-level security · projects must be enforced per token's user_id
-- (implementation: SET LOCAL macro.user_id = '...' per request)
-- =====================================================================
-- Example policy on advance_requests:
--   ALTER TABLE advance_requests ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY ar_proj_visible ON advance_requests USING (
--     proj_id IN (SELECT proj_id FROM user_project_access
--                 WHERE user_id = current_setting('macro.user_id'))
--     OR EXISTS (SELECT 1 FROM users u
--                WHERE u.id = current_setting('macro.user_id')
--                  AND u.role IN ('FINANCE_MANAGER','EXECUTIVE_DIRECTOR','ADMINISTRATOR'))
--   );
