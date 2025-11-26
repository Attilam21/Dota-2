-- ============================================
-- FIX COMPLETO RLS POLICIES PER USER_PROFILE
-- ============================================
-- Esegui questo script per risolvere errori 401/403 su user_profile
-- ============================================

-- 1. Verifica che RLS sia abilitato
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- 2. Rimuovi tutte le policy esistenti
DROP POLICY IF EXISTS "Users can view own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profile;

-- 3. Ricrea policy con WITH CHECK esplicito
CREATE POLICY "Users can view own profile"
  ON user_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Verifica che il trigger handle_new_user() esista e funzioni
-- (Questo dovrebbe essere già creato dallo script setup_complete_clean.sql)

-- 5. Verifica le policy create
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_profile'
ORDER BY policyname;

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Se continui ad avere errori 401/403:
-- 1. Verifica che NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY siano configurate su Vercel
-- 2. Verifica che l'utente sia autenticato correttamente (controlla i cookie)
-- 3. Verifica che il trigger handle_new_user() sia attivo su auth.users
-- ============================================

