# ✅ Checklist Test Registrazione e Login

## 📋 Prima di Testare

### 1. ✅ Email Confirmation Disabilitata
- [x] Vai su Supabase Dashboard → Authentication → Settings
- [x] "Enable email confirmations" è OFF (disabilitato)
- [x] Salva le modifiche

### 2. ✅ Trigger SQL Aggiornato
**IMPORTANTE:** Applica lo script SQL per il trigger:

1. Vai su Supabase Dashboard → SQL Editor
2. Apri il file `supabase/UPDATE_TRIGGER_METADATI.sql`
3. Copia e incolla tutto il contenuto
4. Esegui lo script

**Cosa fa:**
- Aggiorna il trigger `handle_new_user()` per leggere il nickname dai metadati
- Crea automaticamente `user_profile` con nickname durante la registrazione

### 3. ✅ RLS Policies Corrette
- [x] Le RLS policies per `user_profile` sono configurate correttamente
- [x] Script `supabase/FIX_RLS_COMPLETE.sql` è stato eseguito (se necessario)

## 🧪 Test da Eseguire

### Test 1: Registrazione Nuovo Utente
1. Vai su `/register`
2. Compila form:
   - Nickname: "TestUser"
   - Email: "test@example.com" (usa email valida)
   - Password: "password123"
3. Clicca "Registrati"
4. **Risultato atteso:**
   - ✅ Nessun errore
   - ✅ Redirect automatico a `/onboarding/profile`
   - ✅ Nessun messaggio "controlla email"

### Test 2: Verifica Profilo Creato
1. Vai su Supabase Dashboard → Table Editor → `user_profile`
2. Cerca l'utente appena registrato
3. **Verifica:**
   - ✅ `id` corrisponde a `auth.users`
   - ✅ `nickname` è "TestUser"
   - ✅ `onboarding_status` è "profile_pending"

### Test 3: Login
1. Vai su `/login`
2. Inserisci:
   - Email: "test@example.com"
   - Password: "password123"
3. Clicca "Accedi"
4. **Risultato atteso:**
   - ✅ Nessun errore 400
   - ✅ Login riuscito
   - ✅ Redirect a `/onboarding/profile` (o dashboard se onboarding completo)

### Test 4: Login con Credenziali Errate
1. Vai su `/login`
2. Inserisci:
   - Email: "test@example.com"
   - Password: "passwordERRATA"
3. Clicca "Accedi"
4. **Risultato atteso:**
   - ✅ Messaggio: "Email o password errate. Riprova."
   - ✅ Nessun redirect

### Test 5: Registrazione Email Già Esistente
1. Vai su `/register`
2. Usa la stessa email del Test 1
3. Clicca "Registrati"
4. **Risultato atteso:**
   - ✅ Messaggio di errore appropriato
   - ✅ Nessun crash

## 🔍 Cosa Controllare

### Console Browser
- Apri Developer Tools → Console
- Durante i test, controlla:
  - ✅ Nessun errore 400/401/403
  - ✅ Log dettagliati se ci sono errori
  - ✅ Nessun errore di rete

### Network Tab
- Apri Developer Tools → Network
- Filtra per "Fetch/XHR"
- Controlla:
  - ✅ `/auth/v1/token` ritorna 200 (non 400)
  - ✅ Nessun errore 401/403

### Supabase Dashboard
- Authentication → Users
- Verifica:
  - ✅ Utente creato correttamente
  - ✅ Email confermata (se email confirmation è disabilitata, dovrebbe essere automatica)

- Table Editor → `user_profile`
- Verifica:
  - ✅ Profilo creato automaticamente
  - ✅ Nickname presente
  - ✅ `onboarding_status` corretto

## 🐛 Se Qualcosa Non Funziona

### Errore 400 su Login
- Verifica che email confirmation sia disabilitata
- Controlla console per errore dettagliato
- Verifica che l'utente esista in `auth.users`

### Profilo Non Creato
- Verifica che il trigger `handle_new_user()` sia attivo
- Controlla che lo script `UPDATE_TRIGGER_METADATI.sql` sia stato eseguito
- Verifica i log di Supabase per errori del trigger

### Errore 401/403
- Verifica RLS policies
- Controlla che l'utente sia autenticato
- Verifica che `auth.uid()` corrisponda all'ID utente

## ✅ Test Completati

- [ ] Test 1: Registrazione
- [ ] Test 2: Verifica Profilo
- [ ] Test 3: Login
- [ ] Test 4: Login Credenziali Errate
- [ ] Test 5: Email Già Esistente

## 📝 Note

- Se tutto funziona, puoi procedere con i test dell'onboarding
- Se ci sono problemi, controlla i log e la console
- Il codice è già configurato per gestire tutti i casi

