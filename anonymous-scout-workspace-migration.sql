-- Anonymous Scout workspace capture
-- Run this in Supabase SQL Editor for the production project.

create extension if not exists pgcrypto;

create table if not exists public.anonymous_scout_workspaces (
  id uuid primary key default gen_random_uuid(),
  workspace_token_hash text not null unique,
  anonymous_id text,
  extension_id text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  claimed_learner_id uuid references public.learners(id) on delete set null,
  claimed_at timestamptz
);

create table if not exists public.anonymous_scout_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.anonymous_scout_workspaces(id) on delete cascade,
  source_url text not null,
  source_platform text,
  product_title text not null,
  product_image_url text,
  scanner_score integer,
  payload_json jsonb not null default '{}'::jsonb,
  draft_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, source_url)
);

alter table public.anonymous_scout_products
  add column if not exists claimed_product_idea_id text,
  add column if not exists claimed_at timestamptz;

create index if not exists anonymous_scout_workspaces_last_seen_at_idx
  on public.anonymous_scout_workspaces (last_seen_at desc);

create index if not exists anonymous_scout_workspaces_anonymous_id_idx
  on public.anonymous_scout_workspaces (anonymous_id);

create index if not exists anonymous_scout_products_workspace_id_idx
  on public.anonymous_scout_products (workspace_id);

create index if not exists anonymous_scout_products_updated_at_idx
  on public.anonymous_scout_products (updated_at desc);

alter table public.anonymous_scout_workspaces enable row level security;
alter table public.anonymous_scout_products enable row level security;

-- No public anonymous read/write policies are added here. The app writes through
-- its server-side service-role import API, using a raw browser token only long
-- enough to hash it before lookup/upsert.
