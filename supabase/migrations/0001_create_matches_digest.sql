-- Migration: Create matches_digest table
-- NOTE: RLS (Row Level Security) will be enabled in a later migration.

create table if not exists public.matches_digest (
  id uuid primary key default gen_random_uuid(),
  player_account_id bigint not null,
  match_id bigint not null,
  hero_id integer not null,
  kills integer not null,
  deaths integer not null,
  assists integer not null,
  duration_seconds integer not null,
  start_time timestamptz not null,
  result text not null check (result in ('win', 'lose')),
  lane text null,
  role text null,
  kda numeric null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_account_id, match_id)
);

-- Optional helper to keep updated_at current on update (can be added later if needed)
-- create trigger set_timestamp
--   before update on public.matches_digest
--   for each row
--   execute procedure trigger_set_timestamp();


