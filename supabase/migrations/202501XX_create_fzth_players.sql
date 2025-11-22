-- Migration: Create fzth_players table
-- Date: 2025-01-XX
-- Purpose: Anagrafica centrale giocatori FZTH (mappa dota_account_id → uuid interno)
-- Idempotent: All operations use IF NOT EXISTS / IF EXISTS checks

-- ============================================================================
-- PART 1: Create fzth_players table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fzth_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dota_account_id bigint NOT NULL UNIQUE,
  nickname text NOT NULL,
  rank_tier text,
  region text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fzth_players_dota_account_id 
  ON public.fzth_players(dota_account_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_fzth_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fzth_players_updated_at ON public.fzth_players;

CREATE TRIGGER trigger_update_fzth_players_updated_at
  BEFORE UPDATE ON public.fzth_players
  FOR EACH ROW
  EXECUTE FUNCTION update_fzth_players_updated_at();

-- Comments
COMMENT ON TABLE public.fzth_players IS 'Anagrafica centrale giocatori FZTH. Mappa dota_account_id (Steam32) a UUID interno.';
COMMENT ON COLUMN public.fzth_players.id IS 'UUID interno del giocatore (PK)';
COMMENT ON COLUMN public.fzth_players.dota_account_id IS 'Dota 2 account ID (Steam32) - UNIQUE, riferimento per OpenDota API';
COMMENT ON COLUMN public.fzth_players.nickname IS 'Nickname del giocatore (da OpenDota profile o default)';
COMMENT ON COLUMN public.fzth_players.rank_tier IS 'Rank tier del giocatore (es. "Ancient 3", "Divine 1")';
COMMENT ON COLUMN public.fzth_players.region IS 'Regione del giocatore (es. "EU West", "US East")';

-- ============================================================================
-- PART 2: RLS Policies
-- ============================================================================

ALTER TABLE public.fzth_players ENABLE ROW LEVEL SECURITY;

-- SELECT policy for public (read access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fzth_players'
    AND policyname = 'fzth_players_select_public'
  ) THEN
    CREATE POLICY "fzth_players_select_public"
    ON public.fzth_players
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- INSERT/UPDATE/DELETE policies for service_role (write access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fzth_players'
    AND policyname = 'fzth_players_insert_service_role'
  ) THEN
    CREATE POLICY "fzth_players_insert_service_role"
    ON public.fzth_players
    FOR INSERT
    TO service_role
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fzth_players'
    AND policyname = 'fzth_players_update_service_role'
  ) THEN
    CREATE POLICY "fzth_players_update_service_role"
    ON public.fzth_players
    FOR UPDATE
    TO service_role
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fzth_players'
    AND policyname = 'fzth_players_delete_service_role'
  ) THEN
    CREATE POLICY "fzth_players_delete_service_role"
    ON public.fzth_players
    FOR DELETE
    TO service_role
    USING (auth.role() = 'service_role');
  END IF;
END $$;

