-- Migration: Create player_progression table
-- Date: 2025-01-XX
-- Purpose: Progressione FZTH score/level per giocatore nel tempo
-- Idempotent: All operations use IF NOT EXISTS / IF EXISTS checks

-- ============================================================================
-- PART 1: Create player_progression table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.player_progression (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.fzth_players(id) ON DELETE CASCADE,
  current_level integer NOT NULL DEFAULT 1,
  total_xp integer NOT NULL DEFAULT 0,
  fzth_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_progression_player_id_unique UNIQUE (player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_player_progression_player_id 
  ON public.player_progression(player_id);

CREATE INDEX IF NOT EXISTS idx_player_progression_level 
  ON public.player_progression(current_level);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_player_progression_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_player_progression_updated_at ON public.player_progression;

CREATE TRIGGER trigger_update_player_progression_updated_at
  BEFORE UPDATE ON public.player_progression
  FOR EACH ROW
  EXECUTE FUNCTION update_player_progression_updated_at();

-- Comments
COMMENT ON TABLE public.player_progression IS 'Progressione FZTH score/level per giocatore. Una riga per giocatore.';
COMMENT ON COLUMN public.player_progression.player_id IS 'FK a fzth_players.id (UUID interno)';
COMMENT ON COLUMN public.player_progression.current_level IS 'Livello FZTH corrente (1+)';
COMMENT ON COLUMN public.player_progression.total_xp IS 'XP totale accumulata';
COMMENT ON COLUMN public.player_progression.fzth_score IS 'FZTH score corrente (usato per calcolare livello)';

-- ============================================================================
-- PART 2: RLS Policies
-- ============================================================================

ALTER TABLE public.player_progression ENABLE ROW LEVEL SECURITY;

-- SELECT policy for public (read access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_progression'
    AND policyname = 'player_progression_select_public'
  ) THEN
    CREATE POLICY "player_progression_select_public"
    ON public.player_progression
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- INSERT/UPDATE/DELETE policies for service_role (write access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_progression'
    AND policyname = 'player_progression_insert_service_role'
  ) THEN
    CREATE POLICY "player_progression_insert_service_role"
    ON public.player_progression
    FOR INSERT
    TO service_role
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_progression'
    AND policyname = 'player_progression_update_service_role'
  ) THEN
    CREATE POLICY "player_progression_update_service_role"
    ON public.player_progression
    FOR UPDATE
    TO service_role
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_progression'
    AND policyname = 'player_progression_delete_service_role'
  ) THEN
    CREATE POLICY "player_progression_delete_service_role"
    ON public.player_progression
    FOR DELETE
    TO service_role
    USING (auth.role() = 'service_role');
  END IF;
END $$;

