# 🔧 Fix: Utente Esistente con Email Non Confermata

## 🔍 Problema

Stai vedendo l'errore "Email non confermata" anche se hai disabilitato email confirmation. Questo succede perché:

1. **L'utente è stato creato PRIMA di disabilitare email confirmation**
2. **Email confirmation è ancora abilitata** (verifica nel dashboard)
3. **L'utente esiste ma non è stato confermato**

## ✅ Soluzioni

### Soluzione 1: Confermare Manualmente l'Utente (RAPIDA)

**Se l'utente esiste già e vuoi confermarlo manualmente:**

1. Vai su Supabase Dashboard → SQL Editor
2. Apri il file `supabase/CONFERMA_UTENTE_MANUALE.sql`
3. Sostituisci `'USER_EMAIL'` con la tua email (es: `'attiliomazzetti@gmail.com'`)
4. Esegui lo script

**Cosa fa:**
- Imposta `email_confirmed_at` e `confirmed_at` a NOW()
- L'utente può ora fare login

### Soluzione 2: Eliminare e Ricreare l'Utente

**Se preferisci ricreare l'utente da zero:**

1. Vai su Supabase Dashboard → Authentication → Users
2. Trova l'utente con email `attiliomazzetti@gmail.com`
3. Clicca sui tre puntini → **Delete user**
4. Conferma l'eliminazione
5. Vai su `/register` e registrati di nuovo
6. Ora dovrebbe funzionare senza problemi

### Soluzione 3: Verificare Email Confirmation

**Assicurati che email confirmation sia disabilitata:**

1. Vai su Supabase Dashboard → Authentication → Settings
2. Verifica che "Enable email confirmations" sia **OFF** (disabilitato)
3. Se è ON, disabilitalo e salva
4. Prova a fare login di nuovo

## 🎯 Raccomandazione

**Per test veloci:**
- Usa **Soluzione 1** (conferma manuale) se l'utente esiste già
- Oppure **Soluzione 2** (elimina e ricrea) se preferisci partire da zero

**Per nuovi utenti:**
- Assicurati che email confirmation sia disabilitata
- I nuovi utenti potranno fare login immediatamente

## 📝 Script SQL

Ho creato `supabase/CONFERMA_UTENTE_MANUALE.sql` che puoi usare per confermare manualmente qualsiasi utente.

**Esempio:**
```sql
-- NOTA: confirmed_at è una colonna generata, si aggiorna automaticamente
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'attiliomazzetti@gmail.com';
```

## ✅ Dopo la Conferma

1. Prova a fare login di nuovo
2. Dovresti poter accedere senza errori
3. Se funziona, puoi procedere con i test dell'onboarding

