-- Ensure uniqueness for (player_account_id, match_id) to support UPSERT on ON CONFLICT

-- Optional deduplication: remove older duplicates keeping one arbitrary row
DELETE FROM public.matches_digest a
USING public.matches_digest b
WHERE a.ctid < b.ctid
  AND a.player_account_id = b.player_account_id
  AND a.match_id = b.match_id;

-- Create UNIQUE index (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS matches_digest_player_match_uidx
  ON public.matches_digest (player_account_id, match_id);


