-- ============================================
-- FIX RLS POLICIES PER USER_PROFILE
-- ============================================
-- Esegui questo script se hai problemi con l'update del profilo (errore 403)
-- ============================================

-- Rimuovi policy esistenti
DROP POLICY IF EXISTS "Users can view own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profile;

-- Ricrea policy con WITH CHECK per UPDATE
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

-- Verifica che RLS sia abilitato
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICA
-- ============================================
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

