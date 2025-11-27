-- ============================================
-- FIX: players_digest Schema - Ensure JSONB columns
-- ============================================
-- 
-- This migration ensures that all columns in players_digest
-- that should store JSON data are of type JSONB, not INTEGER.
--
-- Error fixed: "invalid input syntax for type integer: "{npc_dota_hero_mars":6138,...}"
--
-- This error occurs when complex JSON objects from OpenDota (like kills_per_hero,
-- damage_targets, etc.) are accidentally being inserted into INTEGER columns.
--
-- ============================================

BEGIN;

-- Step 1: Verify current schema
-- Check if there are any INTEGER columns that might be receiving JSON objects
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE 'Checking players_digest schema for potential type mismatches...';
    
    FOR col_record IN
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'players_digest'
          AND data_type = 'integer'
        ORDER BY column_name
    LOOP
        RAISE NOTICE 'Found INTEGER column: %', col_record.column_name;
    END LOOP;
END $$;

-- Step 2: Ensure items column is JSONB (should already be, but verify)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'players_digest'
          AND column_name = 'items'
          AND data_type != 'jsonb'
    ) THEN
        ALTER TABLE public.players_digest
        ALTER COLUMN items TYPE JSONB USING items::jsonb;
        
        RAISE NOTICE 'Changed items column from % to JSONB', (
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'players_digest'
              AND column_name = 'items'
        );
    ELSE
        RAISE NOTICE 'items column is already JSONB';
    END IF;
END $$;

-- Step 3: Ensure position_metrics column is JSONB (should already be, but verify)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'players_digest'
          AND column_name = 'position_metrics'
          AND data_type != 'jsonb'
    ) THEN
        ALTER TABLE public.players_digest
        ALTER COLUMN position_metrics TYPE JSONB USING position_metrics::jsonb;
        
        RAISE NOTICE 'Changed position_metrics column from % to JSONB', (
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'players_digest'
              AND column_name = 'position_metrics'
        );
    ELSE
        RAISE NOTICE 'position_metrics column is already JSONB';
    END IF;
END $$;

-- Step 4: Add additional JSONB columns for complex OpenDota stats (if needed)
-- These columns can store complex objects like kills_per_hero, damage_targets, etc.
DO $$
BEGIN
    -- Add kills_per_hero column if it doesn't exist (for future use)
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'players_digest'
          AND column_name = 'kills_per_hero'
    ) THEN
        ALTER TABLE public.players_digest
        ADD COLUMN kills_per_hero JSONB;
        
        RAISE NOTICE 'Added kills_per_hero JSONB column';
    ELSE
        -- If it exists but is not JSONB, convert it
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'players_digest'
              AND column_name = 'kills_per_hero'
              AND data_type != 'jsonb'
        ) THEN
            ALTER TABLE public.players_digest
            ALTER COLUMN kills_per_hero TYPE JSONB USING kills_per_hero::jsonb;
            
            RAISE NOTICE 'Converted kills_per_hero to JSONB';
        ELSE
            RAISE NOTICE 'kills_per_hero column already exists as JSONB';
        END IF;
    END IF;

    -- Add damage_targets column if it doesn't exist (for future use)
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'players_digest'
          AND column_name = 'damage_targets'
    ) THEN
        ALTER TABLE public.players_digest
        ADD COLUMN damage_targets JSONB;
        
        RAISE NOTICE 'Added damage_targets JSONB column';
    ELSE
        -- If it exists but is not JSONB, convert it
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'players_digest'
              AND column_name = 'damage_targets'
              AND data_type != 'jsonb'
        ) THEN
            ALTER TABLE public.players_digest
            ALTER COLUMN damage_targets TYPE JSONB USING damage_targets::jsonb;
            
            RAISE NOTICE 'Converted damage_targets to JSONB';
        ELSE
            RAISE NOTICE 'damage_targets column already exists as JSONB';
        END IF;
    END IF;
END $$;

-- Step 5: Verify final schema
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE 'Final players_digest schema:';
    
    FOR col_record IN
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'players_digest'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (nullable: %)', 
            col_record.column_name, 
            col_record.data_type,
            col_record.is_nullable;
    END LOOP;
END $$;

COMMIT;

-- ============================================
-- NOTES:
-- ============================================
-- 
-- 1. This migration ensures that JSONB columns are correctly typed
-- 2. It adds optional columns for complex OpenDota stats (kills_per_hero, damage_targets)
-- 3. The TypeScript code in sanitizePlayerDigest() ensures only valid types are sent
-- 4. If you see errors about INTEGER columns receiving JSON, check:
--    - That all JSONB columns are correctly typed
--    - That the sanitizePlayerDigest function is being called
--    - That no extra fields are being passed in the upsert payload
--
-- ============================================
