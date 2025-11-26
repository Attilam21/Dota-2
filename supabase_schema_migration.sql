-- Supabase Schema Migration: Align matches_digest and players_digest with TypeScript ETL contract
-- Based on MatchDigest and PlayerDigest types from lib/types/opendota.ts
-- 
-- This script:
-- 1. Drops and recreates matches_digest with all MatchDigest fields
-- 2. Drops and recreates players_digest with all PlayerDigest fields
-- 3. Adds indexes for common query patterns
-- 4. Leaves raw_matches untouched

BEGIN;

-- Drop existing digest tables (data loss acceptable per requirements)
DROP TABLE IF EXISTS public.players_digest CASCADE;
DROP TABLE IF EXISTS public.matches_digest CASCADE;

-- Create matches_digest table aligned with MatchDigest interface
CREATE TABLE public.matches_digest (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL UNIQUE,
  duration INTEGER NOT NULL,
  start_time TIMESTAMPTZ,
  radiant_win BOOLEAN NOT NULL,
  radiant_score INTEGER,
  dire_score INTEGER,
  game_mode INTEGER,
  lobby_type INTEGER,
  objectives_summary JSONB,
  teamfight_summary JSONB,
  economy_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players_digest table aligned with PlayerDigest interface
CREATE TABLE public.players_digest (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL,
  player_slot INTEGER NOT NULL,
  account_id BIGINT,
  hero_id INTEGER NOT NULL,
  kills INTEGER,
  deaths INTEGER,
  assists INTEGER,
  gold_per_min NUMERIC(10, 2),
  xp_per_min NUMERIC(10, 2),
  gold_spent INTEGER,
  last_hits INTEGER,
  denies INTEGER,
  net_worth INTEGER,
  hero_damage INTEGER,
  tower_damage INTEGER,
  damage_taken INTEGER,
  teamfight_participation NUMERIC(5, 4),
  kda NUMERIC(10, 4),
  kill_participation NUMERIC(5, 4),
  lane INTEGER,
  lane_role INTEGER,
  vision_score INTEGER,
  items JSONB,
  position_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_slot)
);

-- Indexes for matches_digest
CREATE INDEX idx_matches_digest_match_id ON public.matches_digest(match_id);
CREATE INDEX idx_matches_digest_start_time ON public.matches_digest(start_time);

-- Indexes for players_digest
CREATE INDEX idx_players_digest_match_id ON public.players_digest(match_id);
CREATE INDEX idx_players_digest_account_id ON public.players_digest(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_players_digest_hero_id ON public.players_digest(hero_id);
CREATE INDEX idx_players_digest_match_player ON public.players_digest(match_id, player_slot);

-- Comments for documentation
COMMENT ON TABLE public.matches_digest IS 'Digest of OpenDota match data, aligned with MatchDigest TypeScript type';
COMMENT ON TABLE public.players_digest IS 'Digest of player performance data per match, aligned with PlayerDigest TypeScript type';
COMMENT ON COLUMN public.matches_digest.match_id IS 'OpenDota match ID, unique identifier';
COMMENT ON COLUMN public.players_digest.match_id IS 'Foreign key to matches_digest.match_id';
COMMENT ON COLUMN public.players_digest.player_slot IS 'Player slot (0-4 radiant, 128-132 dire), part of composite unique key with match_id';

COMMIT;

