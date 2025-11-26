-- ============================================
-- VERIFICA COLONNE AGGIUNTE A MATCHES_DIGEST
-- ============================================
-- Esegui questo script per verificare che tutte le colonne siano state aggiunte
-- ============================================

-- Verifica colonne matches_digest
SELECT 
  column_name as nome_colonna,
  data_type as tipo_dato,
  is_nullable as nullable,
  column_default as default_value
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches_digest'
  AND column_name IN (
    'user_id',
    'is_eligible_for_coaching',
    'included_in_coaching',
    'match_date'
  )
ORDER BY column_name;

-- Verifica colonna players_digest
SELECT 
  column_name as nome_colonna,
  data_type as tipo_dato,
  is_nullable as nullable,
  column_default as default_value
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'players_digest'
  AND column_name = 'user_id';

-- Verifica TUTTE le colonne di matches_digest (per vedere la struttura completa)
SELECT 
  column_name as nome_colonna,
  data_type as tipo_dato,
  is_nullable as nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches_digest'
ORDER BY ordinal_position;

