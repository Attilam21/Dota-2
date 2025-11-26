-- SCRIPT PER VERIFICARE COMPLETAMENTE UN UTENTE
-- Esegui questo per vedere tutti i dettagli dell'utente

-- 1. Verifica utente in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'attiliomazzetti@gmail.com';

-- 2. Verifica profilo in user_profile
SELECT 
  id,
  nickname,
  onboarding_status,
  created_at,
  updated_at
FROM public.user_profile
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'attiliomazzetti@gmail.com'
);

-- 3. Verifica se ci sono problemi con RLS
-- (Questo controlla se l'utente può vedere il proprio profilo)
-- Esegui questo come l'utente stesso (non come admin)

