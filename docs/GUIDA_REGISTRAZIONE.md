# 📝 Guida: Creazione Nuovo Account

## 🎯 Obiettivo

Creare un nuovo account utente per testare il login e verificare che tutto funzioni correttamente.

---

## 📋 Step-by-Step: Registrazione

### Step 1: Vai alla Pagina di Registrazione

1. Apri l'app in produzione: `https://dota-2-delta.vercel.app`
2. Clicca su **"Registrati"** (link in basso nella pagina di login)
3. Oppure vai direttamente a: `https://dota-2-delta.vercel.app/register`

### Step 2: Compila il Form

Compila i campi richiesti:

1. **Nickname:**
   - Inserisci il tuo nickname (es: `Attilio23`)
   - Questo sarà il tuo nome visualizzato nel dashboard

2. **Email:**
   - Inserisci la tua email (es: `attiliomazzetti@gmail.com`)
   - ⚠️ **IMPORTANTE**: Se email confirmation è abilitata, dovrai confermare l'email prima di poter fare login

3. **Password:**
   - Inserisci una password (minimo 6 caratteri)
   - Esempio: `Test123!` o `Password123`
   - ⚠️ **IMPORTANTE**: Ricorda questa password! Ti servirà per fare login

### Step 3: Clicca "Registrati"

1. Clicca sul pulsante **"Registrati"**
2. Attendi che la registrazione completi
3. Se email confirmation è **disabilitata**, verrai reindirizzato automaticamente all'onboarding
4. Se email confirmation è **abilitata**, vedrai un messaggio che ti chiede di controllare l'email

---

## 🔍 Cosa Succede Durante la Registrazione

### 1. Creazione Utente in Supabase Auth
- L'utente viene creato in `auth.users`
- Il nickname viene salvato nei metadati utente (`raw_user_meta_data`)

### 2. Trigger `handle_new_user()`
- Il trigger PostgreSQL crea automaticamente un record in `user_profile`
- Il profilo viene creato con:
  - `id`: stesso ID dell'utente
  - `nickname`: preso dai metadati
  - `onboarding_status`: `'profile_pending'`

### 3. Redirect all'Onboarding
- Se tutto va bene, verrai reindirizzato a `/onboarding/profile`
- Da lì completerai il profilo e importerai le prime partite

---

## ✅ Verifica Registrazione Riuscita

### Verifica 1: Controlla Console Browser

Dopo aver cliccato "Registrati", controlla la console del browser:

- ✅ Dovresti vedere: `[RegisterForm] Attempting registration for: [email]`
- ✅ Dovresti vedere: `[RegisterForm] Sign up response: { user: ..., session: ... }`
- ❌ Se vedi errori, controlla il messaggio di errore

### Verifica 2: Controlla Supabase Dashboard

1. Vai su **Supabase Dashboard** → **Authentication** → **Users**
2. Cerca l'utente con l'email che hai usato
3. Verifica:
   - ✅ L'utente esiste?
   - ✅ `email_confirmed_at` è impostato? (se email confirmation è disabilitata)
   - ✅ `raw_user_meta_data` contiene `nickname`?

### Verifica 3: Controlla Profilo Utente

1. Vai su **Supabase Dashboard** → **Table Editor** → **user_profile**
2. Cerca l'utente con l'ID corrispondente
3. Verifica:
   - ✅ Il profilo esiste?
   - ✅ `nickname` è corretto?
   - ✅ `onboarding_status` è `'profile_pending'`?

---

## ⚠️ Problemi Comuni

### Problema 1: "Email già registrata"

**Causa**: L'email è già presente nel database

**Soluzione**:
- Usa un'altra email
- Oppure elimina l'utente esistente da Supabase Dashboard → Authentication → Users

### Problema 2: "Email non confermata"

**Causa**: Email confirmation è abilitata e non hai confermato l'email

**Soluzione**:
- Controlla la tua email per il link di conferma
- Oppure disabilita email confirmation temporaneamente:
  1. Vai su Supabase Dashboard → Authentication → Settings
  2. Disabilita "Enable email confirmations"
  3. Oppure conferma manualmente l'utente con SQL:

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'TUA_EMAIL@example.com';
```

### Problema 3: "Errore nella creazione del profilo"

**Causa**: Il trigger `handle_new_user()` potrebbe non essere attivo

**Soluzione**:
1. Verifica che il trigger esista in Supabase Dashboard → Database → Triggers
2. Se non esiste, esegui lo script SQL `supabase/UPDATE_TRIGGER_METADATI.sql`

### Problema 4: Redirect non funziona

**Causa**: Potrebbe esserci un problema con il routing

**Soluzione**:
- Controlla la console del browser per errori
- Verifica che il profilo sia stato creato correttamente
- Prova a navigare manualmente a `/onboarding/profile`

---

## 🎯 Dopo la Registrazione

Una volta registrato con successo:

1. **Completa l'Onboarding:**
   - Step 1: Profilo (ruolo, server, Steam ID, ecc.)
   - Step 2: Avatar (scegli un avatar)
   - Step 3: Importa partite (inserisci 10-20 match IDs)

2. **Accedi al Dashboard:**
   - Dopo aver completato l'onboarding, verrai reindirizzato a `/dashboard/panoramica`
   - Da lì potrai vedere le tue statistiche e partite

---

## 📝 Note Importanti

- ✅ **Ricorda la password**: Ti servirà per fare login in futuro
- ✅ **Email confirmation**: Se è abilitata, devi confermare l'email prima di poter fare login
- ✅ **Nickname**: Puoi cambiarlo successivamente nel profilo
- ✅ **Onboarding**: Completa tutti e 3 gli step per accedere al dashboard completo

---

## 🆘 Se Qualcosa Non Funziona

1. **Controlla la console del browser** per errori
2. **Controlla i log di Vercel** per errori server-side
3. **Verifica in Supabase Dashboard** che l'utente e il profilo siano stati creati
4. **Controlla che il trigger `handle_new_user()` sia attivo**

---

## 🎉 Conclusione

Una volta completata la registrazione, dovresti essere in grado di:
- ✅ Fare login con le credenziali create
- ✅ Accedere all'onboarding
- ✅ Completare il profilo
- ✅ Importare partite
- ✅ Accedere al dashboard

Buona registrazione! 🚀

