-- SCRIPT PER CONFERMARE MANUALMENTE UN UTENTE ESISTENTE
-- Usa questo se hai disabilitato email confirmation DOPO aver creato l'utente
-- oppure se vuoi confermare manualmente un utente per test

-- SOSTITUISCI 'USER_EMAIL' con l'email dell'utente da confermare
-- Esempio: 'attiliomazzetti@gmail.com'

-- NOTA: confirmed_at è una colonna generata, non può essere aggiornata manualmente
-- Aggiorniamo solo email_confirmed_at, confirmed_at si aggiornerà automaticamente
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'USER_EMAIL';

-- Verifica che l'utente sia stato confermato
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'USER_EMAIL';

