-- Migration: Align Dota 2 Schema to OpenDota Official Spec
-- Date: 2025-11-21
-- Purpose: Align Supabase schema to OpenDota API spec without data loss
-- Idempotent: All operations use IF NOT EXISTS / IF EXISTS checks
-- 
-- IMPORTANT: This migration does NOT drop any tables or columns.
-- It only adds defaults, indexes, and improves documentation.
--
-- Based on:
-- - docs/OPENDOTA_DATA_CAPABILITY_AUDIT.md
-- - docs/DATA_CONTRACT_DOTA2.md
-- - OpenDota API Spec v28.0.0

-- ============================================================================
-- PART 1: Ensure Default Values for Numeric Fields (Prevent NULL)
-- ============================================================================

-- matches_digest: Ensure defaults for optional numeric fields
DO $$ BEGIN
  -- Add default for kda if not already set
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'kda'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE public.matches_digest 
    ALTER COLUMN kda SET DEFAULT 0;
  END IF;
END $$;

-- dota_player_match_analysis: All numeric fields already have DEFAULT 0, verify
-- (No changes needed, schema already correct)

-- dota_player_death_events: Ensure defaults
DO $$ BEGIN
  -- gold_lost, xp_lost, cs_lost already have DEFAULT 0, verify
  -- (No changes needed, schema already correct)
END $$;

-- ============================================================================
-- PART 2: Add Useful Indexes for Dashboard Queries
-- ============================================================================

-- Index for death events queries by time (for timeline graphs)
CREATE INDEX IF NOT EXISTS idx_dota_death_events_match_account_time 
  ON public.dota_player_death_events(match_id, account_id, time_seconds);

-- Index for filtering death events by phase (for phase analysis)
CREATE INDEX IF NOT EXISTS idx_dota_death_events_phase 
  ON public.dota_player_death_events(phase);

-- Index for matches_digest queries by player and time
CREATE INDEX IF NOT EXISTS idx_matches_digest_player_time 
  ON public.matches_digest(player_account_id, start_time DESC);

-- Index for matches_digest queries by role_position (for role analysis)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'role_position'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_matches_digest_role_position 
      ON public.matches_digest(role_position);
  END IF;
END $$;

-- ============================================================================
-- PART 3: Update Column Comments (Documentation)
-- ============================================================================

-- Document that pos_x and pos_y are always NULL (not available from OpenDota)
COMMENT ON COLUMN public.dota_player_death_events.pos_x IS 
  'X position on map at death. ALWAYS NULL - not available from OpenDota standard endpoint. Reserved for future implementation with parsed matches or advanced endpoints.';

COMMENT ON COLUMN public.dota_player_death_events.pos_y IS 
  'Y position on map at death. ALWAYS NULL - not available from OpenDota standard endpoint. Reserved for future implementation with parsed matches or advanced endpoints.';

-- Document that killer_hero_id and killer_role_position may be NULL
COMMENT ON COLUMN public.dota_player_death_events.killer_hero_id IS 
  'Hero ID of the killer. NULL if OpenDota does not provide deaths_log[].by.hero_id or killed_by object.';

COMMENT ON COLUMN public.dota_player_death_events.killer_role_position IS 
  'Role position of killer (1-5). NULL if killer_hero_id is NULL or role cannot be determined.';

-- Document analysis_extra usage
COMMENT ON COLUMN public.dota_player_match_analysis.analysis_extra IS 
  'Extra analysis data in JSON format. Currently always {} (empty object). Reserved for future extensions: heatmap data, advanced metrics, timeline analysis.';

-- ============================================================================
-- PART 4: Add Helper Columns (Optional, for future use)
-- ============================================================================

-- Add killed_by_raw column to store killed_by object from OpenDota (for fallback logic)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dota_player_match_analysis' 
    AND column_name = 'killed_by_raw'
  ) THEN
    ALTER TABLE public.dota_player_match_analysis 
    ADD COLUMN killed_by_raw jsonb NULL;
    
    COMMENT ON COLUMN public.dota_player_match_analysis.killed_by_raw IS 
      'Raw killed_by object from OpenDota API (documented field). Stored for fallback when deaths_log is not available.';
  END IF;
END $$;

-- ============================================================================
-- PART 5: Data Cleanup Commands (COMMENTED - DO NOT EXECUTE AUTOMATICALLY)
-- ============================================================================

-- ============================================================================
-- WARNING: The following commands are COMMENTED OUT.
-- They should ONLY be executed manually after:
-- 1. Verifying that the rebuild script works correctly
-- 2. Creating a backup of the database
-- 3. Testing in a development environment first
-- ============================================================================

-- To rebuild all analysis data from scratch:
-- 
-- Step 1: Clear existing analysis tables (OPTIONAL - only if you want fresh data)
-- TRUNCATE TABLE public.dota_player_match_analysis;
-- TRUNCATE TABLE public.dota_player_death_events;
--
-- Step 2: Rebuild using the rebuild script:
-- node scripts/rebuild-dota-analysis.ts
-- OR
-- Call POST /api/admin/dota/rebuild-analysis with list of match IDs
--
-- Step 3: Verify data in Supabase:
-- SELECT COUNT(*) FROM dota_player_match_analysis;
-- SELECT COUNT(*) FROM dota_player_death_events;
--
-- ============================================================================

-- ============================================================================
-- PART 6: Verification Queries (for manual check)
-- ============================================================================

-- Uncomment to verify schema after migration:
-- 
-- SELECT 
--   table_name, 
--   column_name, 
--   data_type, 
--   column_default,
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' 
--   AND table_name IN ('matches_digest', 'dota_player_match_analysis', 'dota_player_death_events')
-- ORDER BY table_name, ordinal_position;
--
-- SELECT 
--   indexname, 
--   tablename, 
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' 
--   AND tablename IN ('matches_digest', 'dota_player_match_analysis', 'dota_player_death_events')
-- ORDER BY tablename, indexname;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

