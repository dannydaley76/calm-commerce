-- Ecom Learning — Canonical MVP schema outline
-- Updated: 2026-03-31
--
-- This file is the current schema-direction artifact for the clarified learner MVP.
-- It supersedes the older project + JSON-blob worksheet draft as the canonical model.
--
-- Product assumptions reflected here:
-- - preview access exists before payment
-- - full paid access is driven by Stripe-backed entitlement state
-- - one project per learner is the MVP product rule
-- - worksheet responses are field-level and project-scoped
-- - Lean Canvas is derived from worksheet responses, not separately authored for MVP

-- Extensions / helpers
create extension if not exists pgcrypto;

-- Learners
create table if not exists learners (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deletion_requested_at timestamptz
);

-- Entitlements
create table if not exists learner_entitlements (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  status text not null check (status in ('preview','active','expired','cancelled')),
  access_level text not null check (access_level in ('preview','full')),
  product_code text not null default 'calm_commerce_os' check (product_code in ('scanner_extension','research_workspace','calm_commerce_os')),
  billing_type text not null default 'preview' check (billing_type in ('one_time','subscription','bundled','preview')),
  starts_at timestamptz,
  ends_at timestamptz,
  provider text not null default 'stripe',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects (one active project per learner for MVP, enforced in app logic initially)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Field-level worksheet responses, scoped to project
create table if not exists worksheet_responses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  worksheet_id text not null,
  field_key text not null,
  value_json jsonb not null default 'null'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, worksheet_id, field_key)
);

-- Chapter progress, scoped to project
create table if not exists chapter_progress (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  chapter_id text not null,
  status text not null check (status in ('not_started','in_progress','completed')),
  last_location_type text not null check (last_location_type in ('chapter','worksheet','completion')),
  last_location_key text,
  worksheet_completion_percent integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, chapter_id)
);

-- Explicit resume row, scoped to project
create table if not exists project_resume_state (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,
  chapter_id text not null,
  last_location_type text not null check (last_location_type in ('chapter','worksheet','completion')),
  last_location_key text,
  resume_path text,
  updated_at timestamptz not null default now()
);

-- Request-based deletion workflow
create table if not exists account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','processing','completed','rejected')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  notes text
);

-- Recommended Stripe/billing event log
create table if not exists billing_event_log (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  provider_event_id text not null unique,
  event_type text not null,
  payload_json jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received'
);

-- Row level security
alter table learners enable row level security;
alter table learner_entitlements enable row level security;
alter table projects enable row level security;
alter table worksheet_responses enable row level security;
alter table chapter_progress enable row level security;
alter table project_resume_state enable row level security;
alter table account_deletion_requests enable row level security;
alter table billing_event_log enable row level security;

-- Learners: owner can read/update own learner record
create policy "learners_select_own" on learners
for select using (auth.uid() = auth_user_id);

create policy "learners_insert_own" on learners
for insert with check (auth.uid() = auth_user_id);

create policy "learners_update_own" on learners
for update using (auth.uid() = auth_user_id);

-- Entitlements: learner owner can read own entitlement rows
create policy "entitlements_select_own" on learner_entitlements
for select using (
  exists (
    select 1 from learners l
    where l.id = learner_entitlements.learner_id
      and l.auth_user_id = auth.uid()
  )
);

-- Projects: learner owner can read/write own projects
create policy "projects_select_own" on projects
for select using (
  exists (
    select 1 from learners l
    where l.id = projects.learner_id
      and l.auth_user_id = auth.uid()
  )
);

create policy "projects_insert_own" on projects
for insert with check (
  exists (
    select 1 from learners l
    where l.id = projects.learner_id
      and l.auth_user_id = auth.uid()
  )
);

create policy "projects_update_own" on projects
for update using (
  exists (
    select 1 from learners l
    where l.id = projects.learner_id
      and l.auth_user_id = auth.uid()
  )
);

-- Worksheet responses: project owner can read/write own responses
create policy "worksheet_responses_select_own" on worksheet_responses
for select using (
  exists (
    select 1
    from projects p
    join learners l on l.id = p.learner_id
    where p.id = worksheet_responses.project_id
      and l.auth_user_id = auth.uid()
  )
);

create policy "worksheet_responses_insert_own" on worksheet_responses
for insert with check (
  exists (
    select 1
    from projects p
    join learners l on l.id = p.learner_id
    where p.id = worksheet_responses.project_id
      and l.auth_user_id = auth.uid()
  )
);

create policy "worksheet_responses_update_own" on worksheet_responses
for update using (
  exists (
    select 1
    from projects p
    join learners l on l.id = p.learner_id
    where p.id = worksheet_responses.project_id
      and l.auth_user_id = auth.uid()
  )
);

-- Chapter progress: project owner can read/write own progress
create policy "chapter_progress_select_own" on chapter_progress
for select using (
  exists (
    select 1
    from projects p
    join learners l on l.id = p.learner_id
    where p.id = chapter_progress.project_id
      and l.auth_user_id = auth.uid()
  )
);

create policy "chapter_progress_insert_own" on chapter_progress
for insert with check (
  exists (
    select 1
    from projects p
    join learners l on l.id = p.learner_id
    where p.id = chapter_progress.project_id
      and l.auth_user_id = auth.uid()
  )
);

create policy "chapter_progress_update_own" on chapter_progress
for update using (
  exists (
    select 1
    from projects p
    join learners l on l.id = p.learner_id
    where p.id = chapter_progress.project_id
      and l.auth_user_id = auth.uid()
  )
);

-- Resume state: project owner can read/write own resume state
create policy "project_resume_state_select_own" on project_resume_state
for select using (
  exists (
    select 1
    from projects p
    join learners l on l.id = p.learner_id
    where p.id = project_resume_state.project_id
      and l.auth_user_id = auth.uid()
  )
);

create policy "project_resume_state_insert_own" on project_resume_state
for insert with check (
  exists (
    select 1
    from projects p
    join learners l on l.id = p.learner_id
    where p.id = project_resume_state.project_id
      and l.auth_user_id = auth.uid()
  )
);

create policy "project_resume_state_update_own" on project_resume_state
for update using (
  exists (
    select 1
    from projects p
    join learners l on l.id = p.learner_id
    where p.id = project_resume_state.project_id
      and l.auth_user_id = auth.uid()
  )
);

-- Deletion requests: learner owner can create/read own requests
create policy "account_deletion_requests_select_own" on account_deletion_requests
for select using (
  exists (
    select 1 from learners l
    where l.id = account_deletion_requests.learner_id
      and l.auth_user_id = auth.uid()
  )
);

create policy "account_deletion_requests_insert_own" on account_deletion_requests
for insert with check (
  exists (
    select 1 from learners l
    where l.id = account_deletion_requests.learner_id
      and l.auth_user_id = auth.uid()
  )
);

-- Billing event log is operational/internal; no learner-facing policies defined here on purpose.

-- Kanban board tables were part of an older shared/internal schema draft.
-- They are intentionally omitted from the canonical learner MVP schema because
-- kanban/operator workflow is out of scope for the learner product.
