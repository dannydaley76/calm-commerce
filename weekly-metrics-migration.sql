-- Migration: add weekly_metrics table
-- Run this in Supabase SQL editor (or via CLI)
-- Created: 2026-04-16
-- Safe to re-run: all statements are idempotent

create table if not exists weekly_metrics (
  id            uuid        primary key default gen_random_uuid(),
  project_id    uuid        not null references projects(id) on delete cascade,
  week_ending   text        not null,
  data_json     jsonb       not null default '{}'::jsonb,
  submitted_at  timestamptz not null default now()
);

-- Row-level security
alter table weekly_metrics enable row level security;

-- Drop policies before re-creating so this script can be run more than once
drop policy if exists "weekly_metrics_select_own" on weekly_metrics;
drop policy if exists "weekly_metrics_insert_own" on weekly_metrics;

create policy "weekly_metrics_select_own" on weekly_metrics
for select using (
  project_id in (
    select p.id
    from projects p
    inner join learners l on l.id = p.learner_id
    where l.auth_user_id::text = auth.uid()::text
  )
);

create policy "weekly_metrics_insert_own" on weekly_metrics
for insert with check (
  project_id in (
    select p.id
    from projects p
    inner join learners l on l.id = p.learner_id
    where l.auth_user_id::text = auth.uid()::text
  )
);
