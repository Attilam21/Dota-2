# 🔐 Problema: Invalid Login Credentials

## ✅ Buone Notizie!

**Il problema delle API keys è RISOLTO!** 🎉

Dalla console vedo che:
- ✅ La richiesta arriva a Supabase (non c'è più "No API key found")
- ✅ L'header `apikey` viene inviato correttamente
- ✅ Supabase risponde (status 400 invece di 401/403)

## ❌ Nuovo Problema: Credenziali Non Valide

**Errore attuale:**
```
AuthApiError: Invalid login credentials
status: 400
message: "Invalid login credentials"
```

Questo significa che:
- ❌ L'email `attiliomazzetti@gmail.com` non esiste nel database
- ❌ O la password è errata
- ❌ O l'utente non è stato confermato (se email confirmation è abilitata)

---

## 🔍 Come Verificare

### Opzione 1: Verifica Utente in Supabase

1. Vai su **Supabase Dashboard** → **Authentication** → **Users**
2. Cerca l'utente con email `attiliomazzetti@gmail.com`
3. Verifica:
   - ✅ L'utente esiste?
   - ✅ `email_confirmed_at` è impostato? (se email confirmation è abilitata)
   - ✅ L'utente è attivo?

### Opzione 2: Reset Password

Se l'utente esiste ma la password è errata:

1. Vai su **Supabase Dashboard** → **Authentication** → **Users**
2. Trova l'utente `attiliomazzetti@gmail.com`
3. Clicca sui **tre puntini** (⋮) → **Reset Password**
4. Oppure usa il flusso di reset password nell'app

### Opzione 3: Crea Nuovo Utente

Se l'utente non esiste:

1. Vai sulla pagina di **Registrazione** (`/register`)
2. Crea un nuovo account con:
   - Email: `attiliomazzetti@gmail.com`
   - Password: una password che ricordi
   - Nickname: il tuo nickname

### Opzione 4: Conferma Email Manualmente (Se Necessario)

Se email confirmation è abilitata e l'utente non ha confermato:

1. Vai su **Supabase Dashboard** → **Authentication** → **Users**
2. Trova l'utente `attiliomazzetti@gmail.com`
3. Clicca sull'utente per aprire i dettagli
4. Verifica `email_confirmed_at`
5. Se è `null`, puoi:
   - Disabilitare email confirmation temporaneamente (per test)
   - Oppure confermare manualmente l'utente con SQL:

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'attiliomazzetti@gmail.com';
```

---

## 🎯 Soluzione Rapida per Test

### 1. Crea Nuovo Utente (Raccomandato)

1. Vai su `/register`
2. Registra un nuovo account con:
   - Email: `attiliomazzetti@gmail.com` (o un'altra email)
   - Password: qualcosa che ricordi (es: `Test123!`)
   - Nickname: il tuo nickname
3. Se email confirmation è disabilitata, dovresti essere loggato automaticamente
4. Se email confirmation è abilitata, controlla l'email o conferma manualmente

### 2. Reset Password Utente Esistente

Se l'utente esiste ma non ricordi la password:

1. Vai su **Supabase Dashboard** → **Authentication** → **Users**
2. Trova l'utente
3. Clicca **Reset Password**
4. Oppure usa il flusso di reset password nell'app (se implementato)

### 3. Verifica Email Confirmation

Se email confirmation è abilitata:

1. Vai su **Supabase Dashboard** → **Authentication** → **Settings**
2. Verifica se "Enable email confirmations" è attivo
3. Se sì, l'utente deve confermare l'email prima di poter fare login
4. Per test, puoi disabilitarlo temporaneamente

---

## 📝 Checklist Debug

- [ ] L'utente esiste in Supabase Dashboard → Authentication → Users?
- [ ] `email_confirmed_at` è impostato (se email confirmation è abilitata)?
- [ ] La password è corretta?
- [ ] Email confirmation è disabilitata (per test)?
- [ ] Hai provato a creare un nuovo utente?

---

## 🎉 Conclusione

**Il problema delle API keys è RISOLTO!** ✅

Ora il problema è semplicemente che:
- L'utente non esiste, O
- La password è errata, O
- L'email non è confermata

**Soluzione più veloce**: Crea un nuovo utente tramite `/register` con una password che ricordi.

---

## 🔗 Riferimenti

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase User Management](https://supabase.com/docs/guides/auth/managing-users)

