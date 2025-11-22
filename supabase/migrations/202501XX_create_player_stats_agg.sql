-- Migration: Create player_stats_agg table
-- Date: 2025-01-XX
-- Purpose: Statistiche aggregate per giocatore (calcolate da matches_digest)
-- Idempotent: All operations use IF NOT EXISTS / IF EXISTS checks

-- ============================================================================
-- PART 1: Create player_stats_agg table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.player_stats_agg (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.fzth_players(id) ON DELETE CASCADE,
  total_matches integer NOT NULL DEFAULT 0,
  total_wins integer NOT NULL DEFAULT 0,
  total_losses integer NOT NULL DEFAULT 0,
  winrate numeric(5,2),
  avg_kda numeric(6,2),
  avg_duration_sec integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_stats_agg_player_id_unique UNIQUE (player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_player_stats_agg_player_id 
  ON public.player_stats_agg(player_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_player_stats_agg_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_player_stats_agg_updated_at ON public.player_stats_agg;

CREATE TRIGGER trigger_update_player_stats_agg_updated_at
  BEFORE UPDATE ON public.player_stats_agg
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_agg_updated_at();

-- Comments
COMMENT ON TABLE public.player_stats_agg IS 'Statistiche aggregate per giocatore (calcolate da matches_digest). Una riga per giocatore.';
COMMENT ON COLUMN public.player_stats_agg.player_id IS 'FK a fzth_players.id (UUID interno)';
COMMENT ON COLUMN public.player_stats_agg.total_matches IS 'Numero totale di partite giocate';
COMMENT ON COLUMN public.player_stats_agg.total_wins IS 'Numero totale di vittorie';
COMMENT ON COLUMN public.player_stats_agg.total_losses IS 'Numero totale di sconfitte';
COMMENT ON COLUMN public.player_stats_agg.winrate IS 'Winrate percentuale (0-100)';
COMMENT ON COLUMN public.player_stats_agg.avg_kda IS 'KDA medio (calcolato: (kills + assists) / max(1, deaths))';
COMMENT ON COLUMN public.player_stats_agg.avg_duration_sec IS 'Durata media partite in secondi';

-- ============================================================================
-- PART 2: RLS Policies
-- ============================================================================

ALTER TABLE public.player_stats_agg ENABLE ROW LEVEL SECURITY;

-- SELECT policy for public (read access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_stats_agg'
    AND policyname = 'player_stats_agg_select_public'
  ) THEN
    CREATE POLICY "player_stats_agg_select_public"
    ON public.player_stats_agg
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- INSERT/UPDATE/DELETE policies for service_role (write access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_stats_agg'
    AND policyname = 'player_stats_agg_insert_service_role'
  ) THEN
    CREATE POLICY "player_stats_agg_insert_service_role"
    ON public.player_stats_agg
    FOR INSERT
    TO service_role
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_stats_agg'
    AND policyname = 'player_stats_agg_update_service_role'
  ) THEN
    CREATE POLICY "player_stats_agg_update_service_role"
    ON public.player_stats_agg
    FOR UPDATE
    TO service_role
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_stats_agg'
    AND policyname = 'player_stats_agg_delete_service_role'
  ) THEN
    CREATE POLICY "player_stats_agg_delete_service_role"
    ON public.player_stats_agg
    FOR DELETE
    TO service_role
    USING (auth.role() = 'service_role');
  END IF;
END $$;

