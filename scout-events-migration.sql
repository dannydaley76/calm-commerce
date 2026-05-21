-- Scout product analytics events
-- Run this in Supabase SQL Editor for the production project.

create extension if not exists pgcrypto;

create table if not exists public.scout_events (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references public.learners(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  extension_id text,
  event_name text not null,
  platform text,
  domain text,
  page_url text,
  user_tier text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists scout_events_created_at_idx on public.scout_events (created_at desc);
create index if not exists scout_events_event_name_idx on public.scout_events (event_name);
create index if not exists scout_events_anonymous_id_idx on public.scout_events (anonymous_id);
create index if not exists scout_events_learner_id_idx on public.scout_events (learner_id);
create index if not exists scout_events_platform_idx on public.scout_events (platform);

alter table public.scout_events enable row level security;

drop policy if exists "scout_events_insert_public" on public.scout_events;
create policy "scout_events_insert_public" on public.scout_events
for insert
with check (true);

drop policy if exists "scout_events_select_own" on public.scout_events;
create policy "scout_events_select_own" on public.scout_events
for select
using (
  auth_user_id = auth.uid()
  or exists (
    select 1
    from public.learners l
    where l.id = scout_events.learner_id
      and l.auth_user_id = auth.uid()
  )
);
