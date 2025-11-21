-- Migration: Implement RLS strategy for matches_digest
-- Date: 2025-11-21
-- Strategy: anon/public = SELECT only, service_role = full write access via backend handlers
-- Idempotent: All operations use IF EXISTS/IF NOT EXISTS

-- Step 1: Drop existing generic policy if present (idempotent)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.role_routine_grants 
    WHERE routine_schema = 'public' AND routine_name LIKE '%matches_digest%'
  ) THEN
    -- Safe cleanup approach: check and drop by name
    IF EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'matches_digest' 
      AND policyname = 'Enable read access for all users'
    ) THEN
      DROP POLICY IF EXISTS "Enable read access for all users" ON public.matches_digest;
    END IF;
  END IF;
END $$;

-- Step 2: Enable RLS on matches_digest (idempotent)
ALTER TABLE public.matches_digest ENABLE ROW LEVEL SECURITY;

-- Step 3: Create SELECT policy for public/anon users (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'matches_digest' 
    AND policyname = 'matches_digest_select_public'
  ) THEN
    CREATE POLICY "matches_digest_select_public" 
    ON public.matches_digest 
    FOR SELECT 
    TO public 
    USING (true);
  END IF;
END $$;

-- Step 4: Create write policies for service_role (INSERT, UPDATE, DELETE) - idempotent
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'matches_digest' 
    AND policyname = 'matches_digest_insert_service_role'
  ) THEN
    CREATE POLICY "matches_digest_insert_service_role" 
    ON public.matches_digest 
    FOR INSERT 
    TO service_role 
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'matches_digest' 
    AND policyname = 'matches_digest_update_service_role'
  ) THEN
    CREATE POLICY "matches_digest_update_service_role" 
    ON public.matches_digest 
    FOR UPDATE 
    TO service_role 
    USING (auth.role() = 'service_role') 
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'matches_digest' 
    AND policyname = 'matches_digest_delete_service_role'
  ) THEN
    CREATE POLICY "matches_digest_delete_service_role" 
    ON public.matches_digest 
    FOR DELETE 
    TO service_role 
    USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Verification: List all policies created for matches_digest
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'matches_digest';