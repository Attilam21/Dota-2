-- Align matches_digest schema (add columns if missing, non-destructive)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'match_id'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS match_id bigint;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'player_account_id'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS player_account_id bigint;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'hero_id'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS hero_id integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'kills'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS kills integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'deaths'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS deaths integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'assists'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS assists integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS duration_seconds integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS start_time timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'radiant_win'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS radiant_win boolean;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'party_size'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS party_size integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches_digest' AND column_name = 'result'
  ) THEN
    ALTER TABLE public.matches_digest ADD COLUMN IF NOT EXISTS result text;
  END IF;
END $$;

-- Align player_stats_agg schema (add columns if missing, non-destructive)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_stats_agg' AND column_name = 'player_id'
  ) THEN
    ALTER TABLE public.player_stats_agg ADD COLUMN IF NOT EXISTS player_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_stats_agg' AND column_name = 'total_matches'
  ) THEN
    ALTER TABLE public.player_stats_agg ADD COLUMN IF NOT EXISTS total_matches integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_stats_agg' AND column_name = 'total_wins'
  ) THEN
    ALTER TABLE public.player_stats_agg ADD COLUMN IF NOT EXISTS total_wins integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_stats_agg' AND column_name = 'total_losses'
  ) THEN
    ALTER TABLE public.player_stats_agg ADD COLUMN IF NOT EXISTS total_losses integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_stats_agg' AND column_name = 'winrate'
  ) THEN
    ALTER TABLE public.player_stats_agg ADD COLUMN IF NOT EXISTS winrate numeric;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_stats_agg' AND column_name = 'avg_kda'
  ) THEN
    ALTER TABLE public.player_stats_agg ADD COLUMN IF NOT EXISTS avg_kda numeric;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_stats_agg' AND column_name = 'avg_duration_sec'
  ) THEN
    ALTER TABLE public.player_stats_agg ADD COLUMN IF NOT EXISTS avg_duration_sec integer;
  END IF;
END $$;


