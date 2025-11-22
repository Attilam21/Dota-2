-- Migration: Create player_hero_stats table
-- Date: 2025-01-XX
-- Purpose: Statistiche per eroe per giocatore (aggregate da matches_digest)
-- Idempotent: All operations use IF NOT EXISTS / IF EXISTS checks

-- ============================================================================
-- PART 1: Create player_hero_stats table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.player_hero_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.fzth_players(id) ON DELETE CASCADE,
  hero_id integer NOT NULL,
  matches integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer, -- Calcolabile come matches - wins, nullable per compatibilità
  winrate numeric(5,2),
  kda_avg numeric(6,2),
  avg_duration_sec integer,
  last_played_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_hero_stats_player_hero_unique UNIQUE (player_id, hero_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_player_hero_stats_player_id 
  ON public.player_hero_stats(player_id);

CREATE INDEX IF NOT EXISTS idx_player_hero_stats_hero_id 
  ON public.player_hero_stats(hero_id);

CREATE INDEX IF NOT EXISTS idx_player_hero_stats_player_hero 
  ON public.player_hero_stats(player_id, hero_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_player_hero_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_player_hero_stats_updated_at ON public.player_hero_stats;

CREATE TRIGGER trigger_update_player_hero_stats_updated_at
  BEFORE UPDATE ON public.player_hero_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_player_hero_stats_updated_at();

-- Comments
COMMENT ON TABLE public.player_hero_stats IS 'Statistiche per eroe per giocatore (aggregate da matches_digest). Una riga per (player_id, hero_id).';
COMMENT ON COLUMN public.player_hero_stats.player_id IS 'FK a fzth_players.id (UUID interno)';
COMMENT ON COLUMN public.player_hero_stats.hero_id IS 'Hero ID Dota 2';
COMMENT ON COLUMN public.player_hero_stats.matches IS 'Numero di partite giocate con questo eroe';
COMMENT ON COLUMN public.player_hero_stats.wins IS 'Numero di vittorie con questo eroe';
COMMENT ON COLUMN public.player_hero_stats.losses IS 'Numero di sconfitte con questo eroe';
COMMENT ON COLUMN public.player_hero_stats.winrate IS 'Winrate percentuale con questo eroe (0-100)';
COMMENT ON COLUMN public.player_hero_stats.kda_avg IS 'KDA medio con questo eroe';
COMMENT ON COLUMN public.player_hero_stats.avg_duration_sec IS 'Durata media partite con questo eroe in secondi';
COMMENT ON COLUMN public.player_hero_stats.last_played_at IS 'Data/ora ultima partita giocata con questo eroe';

-- ============================================================================
-- PART 2: RLS Policies
-- ============================================================================

ALTER TABLE public.player_hero_stats ENABLE ROW LEVEL SECURITY;

-- SELECT policy for public (read access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_hero_stats'
    AND policyname = 'player_hero_stats_select_public'
  ) THEN
    CREATE POLICY "player_hero_stats_select_public"
    ON public.player_hero_stats
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- INSERT/UPDATE/DELETE policies for service_role (write access)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_hero_stats'
    AND policyname = 'player_hero_stats_insert_service_role'
  ) THEN
    CREATE POLICY "player_hero_stats_insert_service_role"
    ON public.player_hero_stats
    FOR INSERT
    TO service_role
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_hero_stats'
    AND policyname = 'player_hero_stats_update_service_role'
  ) THEN
    CREATE POLICY "player_hero_stats_update_service_role"
    ON public.player_hero_stats
    FOR UPDATE
    TO service_role
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_hero_stats'
    AND policyname = 'player_hero_stats_delete_service_role'
  ) THEN
    CREATE POLICY "player_hero_stats_delete_service_role"
    ON public.player_hero_stats
    FOR DELETE
    TO service_role
    USING (auth.role() = 'service_role');
  END IF;
END $$;

