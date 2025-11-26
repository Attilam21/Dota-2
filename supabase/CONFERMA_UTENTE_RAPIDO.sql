-- SCRIPT RAPIDO - Sostituisci 'attiliomazzetti@gmail.com' con la tua email

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'attiliomazzetti@gmail.com';

-- Verifica
SELECT id, email, email_confirmed_at, confirmed_at
FROM auth.users
WHERE email = 'attiliomazzetti@gmail.com';

