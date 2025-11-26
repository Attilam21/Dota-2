-- Fix players_digest: Convert items column from INTEGER to JSONB
-- Error 22P02 indicates JSON object being inserted into INTEGER column
-- This migration fixes the items and position_metrics columns to be JSONB

BEGIN;

-- Check if items column exists and is not JSONB, then alter it
DO $$
BEGIN
  -- If items column exists but is not JSONB, convert it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'players_digest' 
    AND column_name = 'items'
    AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE public.players_digest 
    ALTER COLUMN items TYPE JSONB USING NULL;
  END IF;
  
  -- Ensure position_metrics is JSONB (if it exists and is not JSONB)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'players_digest' 
    AND column_name = 'position_metrics'
    AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE public.players_digest 
    ALTER COLUMN position_metrics TYPE JSONB USING NULL;
  END IF;
END $$;

-- If items column doesn't exist, add it as JSONB
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'players_digest' 
    AND column_name = 'items'
  ) THEN
    ALTER TABLE public.players_digest 
    ADD COLUMN items JSONB;
  END IF;
END $$;

-- If position_metrics column doesn't exist, add it as JSONB
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'players_digest' 
    AND column_name = 'position_metrics'
  ) THEN
    ALTER TABLE public.players_digest 
    ADD COLUMN position_metrics JSONB;
  END IF;
END $$;

COMMIT;

