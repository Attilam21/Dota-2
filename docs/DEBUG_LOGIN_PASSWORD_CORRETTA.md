# 🔍 Debug: Login Fallisce con Password Corretta

## 🔍 Problema

La password è corretta ma il login continua a fallire con:
- ❌ "Email o password errate. Riprova."
- ❌ `400 Bad Request` su `/auth/v1/token`

## 🔍 Possibili Cause

### 1. Password Non Corrisponde (Anche Se Pensi di Ricordarla)
**Problema:**
- Potresti aver fatto un typo durante la registrazione
- La password potrebbe essere diversa da quella che pensi

**Soluzione:**
- **Elimina e ricrea l'utente** con una password che conosci al 100%
- Usa una password semplice per i test (es: `password123`)

### 2. Problema con il Profilo
**Problema:**
- Il profilo potrebbe non esistere
- RLS potrebbe bloccare l'accesso al profilo

**Verifica:**
```sql
-- Esegui in Supabase SQL Editor
SELECT * FROM public.user_profile 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'attiliomazzetti@gmail.com'
);
```

### 3. Problema con RLS Policies
**Problema:**
- Le RLS policies potrebbero bloccare l'accesso

**Verifica:**
- Controlla che le RLS policies per `user_profile` siano corrette
- Esegui `supabase/FIX_RLS_COMPLETE.sql` se necessario

### 4. Cache/Sessione Vecchia
**Problema:**
- Il browser potrebbe avere dati cached

**Soluzione:**
- Fai **hard refresh**: `Ctrl+Shift+R`
- Prova in **modalità incognito**
- Pulisci i cookie del sito

## ✅ Soluzione Rapida (CONSIGLIATA)

### Elimina e Ricrea Utente con Password Nota

1. **Vai su Supabase Dashboard → Authentication → Users**
2. **Trova** `attiliomazzetti@gmail.com`
3. **Elimina** l'utente (tre puntini → Delete user)
4. **Vai su** `/register`
5. **Registrati** con:
   - Email: `attiliomazzetti@gmail.com`
   - Password: `password123` (o una password che ricordi)
   - Nickname: `Attilio`
6. **Prova a fare login** con la stessa password

## 🔍 Debug Aggiuntivo

Ho aggiunto logging dettagliato in `LoginForm.tsx`:
- Log di tentativo login
- Log di successo con dettagli utente
- Log dettagliato di errori profilo
- Log di creazione profilo

**Controlla la console del browser** per vedere:
- Se il login va a buon fine
- Se c'è un problema con il profilo
- Dettagli completi degli errori

## 📝 Script di Verifica

Ho creato `supabase/VERIFICA_UTENTE_COMPLETO.sql` che verifica:
1. Utente in `auth.users`
2. Profilo in `user_profile`
3. Dettagli completi

**Esegui lo script** per vedere tutti i dettagli dell'utente.

## 🎯 Prossimi Step

1. **Esegui** `supabase/VERIFICA_UTENTE_COMPLETO.sql` per vedere lo stato completo
2. **Elimina e ricrea** l'utente con password nota
3. **Controlla la console** del browser per vedere i log dettagliati
4. **Prova a fare login** con la nuova password

## ⚠️ Nota Importante

Se continui ad avere problemi dopo aver eliminato e ricreato l'utente:
- Verifica che email confirmation sia disabilitata
- Controlla che il trigger `handle_new_user()` sia attivo
- Verifica che le RLS policies siano corrette

