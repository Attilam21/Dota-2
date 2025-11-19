-- Update matches_digest: add missing columns without altering existing data
-- Only ADD COLUMN IF NOT EXISTS statements as requested

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS hero_id int4;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS kills int4;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS deaths int4;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS assists int4;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS duration_seconds int4;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS start_time timestamptz;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS result text;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS lane text;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS role text;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS kda numeric;

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.matches_digest
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


