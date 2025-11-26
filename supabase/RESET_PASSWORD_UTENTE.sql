-- SCRIPT PER RESETTARE LA PASSWORD DI UN UTENTE
-- ATTENZIONE: Questo script NON cambia la password direttamente
-- Devi usare il dashboard di Supabase per inviare email di reset password
-- oppure eliminare e ricreare l'utente

-- Verifica utente esistente
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'attiliomazzetti@gmail.com';

-- NOTA: Per resettare la password:
-- 1. Vai su Supabase Dashboard → Authentication → Users
-- 2. Trova l'utente
-- 3. Clicca "Send password reset email"
-- 
-- OPPURE elimina e ricrea l'utente:
-- DELETE FROM auth.users WHERE email = 'attiliomazzetti@gmail.com';
-- Poi registrati di nuovo su /register

