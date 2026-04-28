-- Migration: add UPDATE and DELETE RLS policies to weekly_metrics
-- Run this in Supabase SQL editor (or via CLI)
-- Created: 2026-04-21
-- Safe to re-run: all statements are idempotent
--
-- Fixes a bug where editing a marketplace metrics row created a duplicate
-- row instead of updating the existing one. The PATCH handler used
-- delete-then-insert, but the delete silently failed (no RLS policy for
-- DELETE), leaving the original row in place alongside the new insert.
-- The same root cause also silently broke the Delete button.

alter table weekly_metrics enable row level security;

drop policy if exists "weekly_metrics_update_own" on weekly_metrics;
drop policy if exists "weekly_metrics_delete_own" on weekly_metrics;

create policy "weekly_metrics_update_own" on weekly_metrics
for update using (
  project_id in (
    select p.id
    from projects p
    inner join learners l on l.id = p.learner_id
    where l.auth_user_id::text = auth.uid()::text
  )
) with check (
  project_id in (
    select p.id
    from projects p
    inner join learners l on l.id = p.learner_id
    where l.auth_user_id::text = auth.uid()::text
  )
);

create policy "weekly_metrics_delete_own" on weekly_metrics
for delete using (
  project_id in (
    select p.id
    from projects p
    inner join learners l on l.id = p.learner_id
    where l.auth_user_id::text = auth.uid()::text
  )
);
