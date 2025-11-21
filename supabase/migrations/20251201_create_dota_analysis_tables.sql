-- Migration: Create Dota 2 Player Match Analysis tables
-- Date: 2025-12-01
-- Purpose: Add tables for detailed Dota 2 player match analysis (kill/death distribution, death cost, death by role)
-- Idempotent: All operations use IF NOT EXISTS / IF EXISTS checks

-- ============================================================================
-- PART 1: Extend matches_digest with Dota 2 specific columns
-- ============================================================================

-- Add role_position (1-5 for Pos1-5)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'role_position'
  ) THEN
    ALTER TABLE public.matches_digest 
    ADD COLUMN role_position integer NULL 
    CHECK (role_position IS NULL OR (role_position >= 1 AND role_position <= 5));
    
    COMMENT ON COLUMN public.matches_digest.role_position IS 'Dota 2 role position: 1=Safe Lane Carry, 2=Mid, 3=Offlane, 4=Soft Support, 5=Hard Support';
  END IF;
END $$;

-- Add gold_per_min (GPM)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'gold_per_min'
  ) THEN
    ALTER TABLE public.matches_digest 
    ADD COLUMN gold_per_min integer NULL;
    
    COMMENT ON COLUMN public.matches_digest.gold_per_min IS 'Dota 2 player match analysis: Gold per minute';
  END IF;
END $$;

-- Add xp_per_min (XPM)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'xp_per_min'
  ) THEN
    ALTER TABLE public.matches_digest 
    ADD COLUMN xp_per_min integer NULL;
    
    COMMENT ON COLUMN public.matches_digest.xp_per_min IS 'Dota 2 player match analysis: Experience per minute';
  END IF;
END $$;

-- Add last_hits
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'last_hits'
  ) THEN
    ALTER TABLE public.matches_digest 
    ADD COLUMN last_hits integer NULL;
    
    COMMENT ON COLUMN public.matches_digest.last_hits IS 'Dota 2 player match analysis: Last hits';
  END IF;
END $$;

-- Add denies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'denies'
  ) THEN
    ALTER TABLE public.matches_digest 
    ADD COLUMN denies integer NULL;
    
    COMMENT ON COLUMN public.matches_digest.denies IS 'Dota 2 player match analysis: Denies';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Create dota_player_death_events table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dota_player_death_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id bigint NOT NULL,
  account_id bigint NOT NULL,
  time_seconds integer NOT NULL CHECK (time_seconds >= 0),
  phase text NOT NULL CHECK (phase IN ('early', 'mid', 'late')),
  level_at_death integer NOT NULL CHECK (level_at_death >= 1 AND level_at_death <= 30),
  downtime_seconds integer NOT NULL CHECK (downtime_seconds >= 0),
  gold_lost integer NOT NULL DEFAULT 0,
  xp_lost integer NOT NULL DEFAULT 0,
  cs_lost integer NOT NULL DEFAULT 0,
  killer_hero_id integer NULL,
  killer_role_position integer NULL CHECK (killer_role_position IS NULL OR (killer_role_position >= 1 AND killer_role_position <= 5)),
  pos_x numeric NULL,
  pos_y numeric NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for dota_player_death_events
CREATE INDEX IF NOT EXISTS idx_dota_death_events_match_account 
  ON public.dota_player_death_events(match_id, account_id);

CREATE INDEX IF NOT EXISTS idx_dota_death_events_time 
  ON public.dota_player_death_events(match_id, account_id, time_seconds);

CREATE INDEX IF NOT EXISTS idx_dota_death_events_phase 
  ON public.dota_player_death_events(phase);

-- Comments for dota_player_death_events
COMMENT ON TABLE public.dota_player_death_events IS 'Dota 2 player match analysis: Individual death events with cost analysis';
COMMENT ON COLUMN public.dota_player_death_events.match_id IS 'OpenDota match ID (logical FK to matches_digest.match_id)';
COMMENT ON COLUMN public.dota_player_death_events.account_id IS 'Dota 2 account ID (logical FK to matches_digest.player_account_id)';
COMMENT ON COLUMN public.dota_player_death_events.time_seconds IS 'Second of death in match (0 = start)';
COMMENT ON COLUMN public.dota_player_death_events.phase IS 'Game phase: early (0-10min), mid (10-30min), late (30+min)';
COMMENT ON COLUMN public.dota_player_death_events.level_at_death IS 'Player level at time of death (1-30)';
COMMENT ON COLUMN public.dota_player_death_events.downtime_seconds IS 'Estimated respawn time in seconds';
COMMENT ON COLUMN public.dota_player_death_events.gold_lost IS 'Estimated gold lost during downtime (calculated)';
COMMENT ON COLUMN public.dota_player_death_events.xp_lost IS 'Estimated XP lost during downtime (calculated)';
COMMENT ON COLUMN public.dota_player_death_events.cs_lost IS 'Estimated CS lost during downtime (calculated)';
COMMENT ON COLUMN public.dota_player_death_events.killer_hero_id IS 'Hero ID of the killer (if available)';
COMMENT ON COLUMN public.dota_player_death_events.killer_role_position IS 'Role position of killer (1-5, if available)';
COMMENT ON COLUMN public.dota_player_death_events.pos_x IS 'X position on map at death (optional, if available from OpenDota)';
COMMENT ON COLUMN public.dota_player_death_events.pos_y IS 'Y position on map at death (optional, if available from OpenDota)';

-- ============================================================================
-- PART 3: Create dota_player_match_analysis table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dota_player_match_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id bigint NOT NULL,
  account_id bigint NOT NULL,
  role_position integer NOT NULL CHECK (role_position >= 1 AND role_position <= 5),
  -- Kill distribution
  kills_early integer NOT NULL DEFAULT 0,
  kills_mid integer NOT NULL DEFAULT 0,
  kills_late integer NOT NULL DEFAULT 0,
  kill_pct_early numeric NOT NULL DEFAULT 0 CHECK (kill_pct_early >= 0 AND kill_pct_early <= 100),
  kill_pct_mid numeric NOT NULL DEFAULT 0 CHECK (kill_pct_mid >= 0 AND kill_pct_mid <= 100),
  kill_pct_late numeric NOT NULL DEFAULT 0 CHECK (kill_pct_late >= 0 AND kill_pct_late <= 100),
  -- Death distribution
  deaths_early integer NOT NULL DEFAULT 0,
  deaths_mid integer NOT NULL DEFAULT 0,
  deaths_late integer NOT NULL DEFAULT 0,
  death_pct_early numeric NOT NULL DEFAULT 0 CHECK (death_pct_early >= 0 AND death_pct_early <= 100),
  death_pct_mid numeric NOT NULL DEFAULT 0 CHECK (death_pct_mid >= 0 AND death_pct_mid <= 100),
  death_pct_late numeric NOT NULL DEFAULT 0 CHECK (death_pct_late >= 0 AND death_pct_late <= 100),
  -- Death cost summary
  total_gold_lost integer NOT NULL DEFAULT 0,
  total_xp_lost integer NOT NULL DEFAULT 0,
  total_cs_lost integer NOT NULL DEFAULT 0,
  -- Death by role
  death_pct_pos1 numeric NOT NULL DEFAULT 0 CHECK (death_pct_pos1 >= 0 AND death_pct_pos1 <= 100),
  death_pct_pos2 numeric NOT NULL DEFAULT 0 CHECK (death_pct_pos2 >= 0 AND death_pct_pos2 <= 100),
  death_pct_pos3 numeric NOT NULL DEFAULT 0 CHECK (death_pct_pos3 >= 0 AND death_pct_pos3 <= 100),
  death_pct_pos4 numeric NOT NULL DEFAULT 0 CHECK (death_pct_pos4 >= 0 AND death_pct_pos4 <= 100),
  death_pct_pos5 numeric NOT NULL DEFAULT 0 CHECK (death_pct_pos5 >= 0 AND death_pct_pos5 <= 100),
  -- Extra data
  analysis_extra jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Unique constraint: one analysis per match+player
  CONSTRAINT dota_match_analysis_unique UNIQUE (match_id, account_id)
);

-- Indexes for dota_player_match_analysis
CREATE INDEX IF NOT EXISTS idx_dota_match_analysis_match_account 
  ON public.dota_player_match_analysis(match_id, account_id);

CREATE INDEX IF NOT EXISTS idx_dota_match_analysis_account 
  ON public.dota_player_match_analysis(account_id);

CREATE INDEX IF NOT EXISTS idx_dota_match_analysis_role 
  ON public.dota_player_match_analysis(role_position);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_dota_match_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_dota_match_analysis_updated_at ON public.dota_player_match_analysis;

CREATE TRIGGER trigger_update_dota_match_analysis_updated_at
  BEFORE UPDATE ON public.dota_player_match_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_dota_match_analysis_updated_at();

-- Comments for dota_player_match_analysis
COMMENT ON TABLE public.dota_player_match_analysis IS 'Dota 2 player match analysis: Summary analysis per match+player (kill/death distribution, death cost, death by role)';
COMMENT ON COLUMN public.dota_player_match_analysis.match_id IS 'OpenDota match ID (logical FK to matches_digest.match_id)';
COMMENT ON COLUMN public.dota_player_match_analysis.account_id IS 'Dota 2 account ID (logical FK to matches_digest.player_account_id)';
COMMENT ON COLUMN public.dota_player_match_analysis.role_position IS 'Dota 2 role position: 1=Safe Lane Carry, 2=Mid, 3=Offlane, 4=Soft Support, 5=Hard Support';
COMMENT ON COLUMN public.dota_player_match_analysis.kills_early IS 'Number of kills in early phase (0-10 minutes)';
COMMENT ON COLUMN public.dota_player_match_analysis.kills_mid IS 'Number of kills in mid phase (10-30 minutes)';
COMMENT ON COLUMN public.dota_player_match_analysis.kills_late IS 'Number of kills in late phase (30+ minutes)';
COMMENT ON COLUMN public.dota_player_match_analysis.kill_pct_early IS 'Percentage of total kills in early phase (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.kill_pct_mid IS 'Percentage of total kills in mid phase (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.kill_pct_late IS 'Percentage of total kills in late phase (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.deaths_early IS 'Number of deaths in early phase (0-10 minutes)';
COMMENT ON COLUMN public.dota_player_match_analysis.deaths_mid IS 'Number of deaths in mid phase (10-30 minutes)';
COMMENT ON COLUMN public.dota_player_match_analysis.deaths_late IS 'Number of deaths in late phase (30+ minutes)';
COMMENT ON COLUMN public.dota_player_match_analysis.death_pct_early IS 'Percentage of total deaths in early phase (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.death_pct_mid IS 'Percentage of total deaths in mid phase (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.death_pct_late IS 'Percentage of total deaths in late phase (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.total_gold_lost IS 'Total gold lost due to all deaths (sum of gold_lost from death_events)';
COMMENT ON COLUMN public.dota_player_match_analysis.total_xp_lost IS 'Total XP lost due to all deaths (sum of xp_lost from death_events)';
COMMENT ON COLUMN public.dota_player_match_analysis.total_cs_lost IS 'Total CS lost due to all deaths (sum of cs_lost from death_events)';
COMMENT ON COLUMN public.dota_player_match_analysis.death_pct_pos1 IS 'Percentage of deaths caused by Pos1 (Safe Lane Carry) opponents (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.death_pct_pos2 IS 'Percentage of deaths caused by Pos2 (Mid) opponents (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.death_pct_pos3 IS 'Percentage of deaths caused by Pos3 (Offlane) opponents (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.death_pct_pos4 IS 'Percentage of deaths caused by Pos4 (Soft Support) opponents (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.death_pct_pos5 IS 'Percentage of deaths caused by Pos5 (Hard Support) opponents (0-100)';
COMMENT ON COLUMN public.dota_player_match_analysis.analysis_extra IS 'Extra analysis data in JSON format (e.g., heatmap data, additional metrics)';

-- ============================================================================
-- PART 4: RLS Policies (following existing pattern)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.dota_player_death_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dota_player_match_analysis ENABLE ROW LEVEL SECURITY;

-- SELECT policies for public (read access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dota_player_death_events'
    AND policyname = 'dota_death_events_select_public'
  ) THEN
    CREATE POLICY "dota_death_events_select_public"
    ON public.dota_player_death_events
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dota_player_match_analysis'
    AND policyname = 'dota_match_analysis_select_public'
  ) THEN
    CREATE POLICY "dota_match_analysis_select_public"
    ON public.dota_player_match_analysis
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- INSERT/UPDATE/DELETE policies for service_role (write access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dota_player_death_events'
    AND policyname = 'dota_death_events_insert_service_role'
  ) THEN
    CREATE POLICY "dota_death_events_insert_service_role"
    ON public.dota_player_death_events
    FOR INSERT
    TO service_role
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dota_player_death_events'
    AND policyname = 'dota_death_events_update_service_role'
  ) THEN
    CREATE POLICY "dota_death_events_update_service_role"
    ON public.dota_player_death_events
    FOR UPDATE
    TO service_role
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dota_player_death_events'
    AND policyname = 'dota_death_events_delete_service_role'
  ) THEN
    CREATE POLICY "dota_death_events_delete_service_role"
    ON public.dota_player_death_events
    FOR DELETE
    TO service_role
    USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dota_player_match_analysis'
    AND policyname = 'dota_match_analysis_insert_service_role'
  ) THEN
    CREATE POLICY "dota_match_analysis_insert_service_role"
    ON public.dota_player_match_analysis
    FOR INSERT
    TO service_role
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dota_player_match_analysis'
    AND policyname = 'dota_match_analysis_update_service_role'
  ) THEN
    CREATE POLICY "dota_match_analysis_update_service_role"
    ON public.dota_player_match_analysis
    FOR UPDATE
    TO service_role
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dota_player_match_analysis'
    AND policyname = 'dota_match_analysis_delete_service_role'
  ) THEN
    CREATE POLICY "dota_match_analysis_delete_service_role"
    ON public.dota_player_match_analysis
    FOR DELETE
    TO service_role
    USING (auth.role() = 'service_role');
  END IF;
END $$;

