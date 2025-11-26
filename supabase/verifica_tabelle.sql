-- ============================================
-- SCRIPT VERIFICA TABELLE SUPABASE
-- ============================================
-- Esegui questo script per verificare che tutte le tabelle siano state create correttamente
-- ============================================

-- 1. VERIFICA TABELLE PRINCIPALI
SELECT 
  'TABELLE PRINCIPALI' as categoria,
  table_name as nome_tabella,
  CASE 
    WHEN table_name IN (
      'user_profile',
      'matches_digest',
      'players_digest',
      'player_match_metrics',
      'coaching_tasks',
      'coaching_task_progress',
      'user_statistics'
    ) THEN '✅ RICHIESTA'
    ELSE '⚠️ EXTRA'
  END as stato
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_profile',
    'matches_digest',
    'players_digest',
    'player_match_metrics',
    'coaching_tasks',
    'coaching_task_progress',
    'user_statistics',
    'raw_matches'
  )
ORDER BY 
  CASE 
    WHEN table_name IN (
      'user_profile',
      'matches_digest',
      'players_digest',
      'player_match_metrics',
      'coaching_tasks',
      'coaching_task_progress',
      'user_statistics'
    ) THEN 0
    ELSE 1
  END,
  table_name;

-- 2. VERIFICA COLONNE AGGIUNTE A MATCHES_DIGEST
SELECT 
  'COLONNE MATCHES_DIGEST' as categoria,
  column_name as nome_colonna,
  data_type as tipo_dato,
  is_nullable as nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches_digest'
  AND column_name IN ('user_id', 'is_eligible_for_coaching', 'included_in_coaching', 'match_date')
ORDER BY column_name;

-- 3. VERIFICA COLONNE AGGIUNTE A PLAYERS_DIGEST
SELECT 
  'COLONNE PLAYERS_DIGEST' as categoria,
  column_name as nome_colonna,
  data_type as tipo_dato,
  is_nullable as nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'players_digest'
  AND column_name = 'user_id';

-- 4. VERIFICA TRIGGER
SELECT 
  'TRIGGER' as categoria,
  trigger_name as nome_trigger,
  event_object_table as tabella,
  event_manipulation as evento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_auth_user_created',
    'set_match_date_trigger',
    'update_user_profile_updated_at',
    'update_user_statistics_updated_at',
    'update_coaching_tasks_updated_at'
  )
ORDER BY event_object_table, trigger_name;

-- 5. VERIFICA FUNZIONI
SELECT 
  'FUNZIONI' as categoria,
  routine_name as nome_funzione,
  routine_type as tipo
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'update_updated_at_column',
    'set_match_date_from_start_time'
  )
ORDER BY routine_name;

-- 6. VERIFICA RLS POLICIES
SELECT 
  'RLS POLICIES' as categoria,
  tablename as tabella,
  policyname as nome_policy,
  cmd as comando
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profile',
    'matches_digest',
    'players_digest',
    'player_match_metrics',
    'coaching_tasks',
    'coaching_task_progress',
    'user_statistics'
  )
ORDER BY tablename, policyname;

-- 7. VERIFICA INDICI
SELECT 
  'INDICI' as categoria,
  tablename as tabella,
  indexname as nome_indice
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profile',
    'matches_digest',
    'players_digest',
    'player_match_metrics',
    'coaching_tasks',
    'coaching_task_progress',
    'user_statistics'
  )
ORDER BY tablename, indexname;

-- 8. VERIFICA MATERIALIZED VIEW
SELECT 
  'MATERIALIZED VIEWS' as categoria,
  matviewname as nome_view
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname = 'user_match_trend';

-- ============================================
-- RIEPILOGO
-- ============================================
-- Conta tabelle create
SELECT 
  'RIEPILOGO' as categoria,
  'Tabelle create' as elemento,
  COUNT(*)::text as valore
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_profile',
    'matches_digest',
    'players_digest',
    'player_match_metrics',
    'coaching_tasks',
    'coaching_task_progress',
    'user_statistics'
  );

-- Conta trigger attivi
SELECT 
  'RIEPILOGO' as categoria,
  'Trigger attivi' as elemento,
  COUNT(*)::text as valore
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_auth_user_created',
    'set_match_date_trigger',
    'update_user_profile_updated_at',
    'update_user_statistics_updated_at',
    'update_coaching_tasks_updated_at'
  );

-- Conta funzioni create
SELECT 
  'RIEPILOGO' as categoria,
  'Funzioni create' as elemento,
  COUNT(*)::text as valore
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'update_updated_at_column',
    'set_match_date_from_start_time'
  );

