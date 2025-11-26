# 🚫 Disabilita Email Confirmation in Supabase

## 📋 Istruzioni Step-by-Step

### Metodo 1: Dashboard Supabase (CONSIGLIATO)

1. **Vai su Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Seleziona il tuo progetto

2. **Vai su Authentication**
   - Menu laterale → **Authentication**

3. **Vai su Settings**
   - Tab **Settings** (non "Users" o "Policies")

4. **Trova "Enable email confirmations"**
   - Scrolla fino a trovare questa opzione
   - Dovrebbe essere nella sezione "Email Auth"

5. **Disabilita**
   - Toggle OFF (spento)
   - Clicca **Save** o **Update**

6. **Verifica**
   - Prova a registrare un nuovo utente
   - Dovrebbe poter fare login immediatamente

### Metodo 2: SQL (Alternativo)

Se non trovi l'opzione nel dashboard, puoi verificare/modificare via SQL:

```sql
-- Verifica configurazione attuale
SELECT * FROM auth.config WHERE name = 'enable_signup';

-- Nota: La modifica via SQL potrebbe non essere supportata
-- Usa sempre il Dashboard quando possibile
```

## ✅ Dopo la Disabilitazione

**Comportamento:**
- ✅ Gli utenti possono fare login immediatamente dopo la registrazione
- ✅ Non serve confermare l'email
- ✅ `authData.session` sarà presente dopo `signUp()`
- ✅ Perfetto per sviluppo e test

**Codice:**
Il codice attuale in `RegisterForm.tsx` gestisce già entrambi i casi:
- Se `authData.session` esiste → login automatico
- Se non esiste → mostra messaggio email confirmation

## 🔄 Per Riabilitare in Produzione

Quando sei pronto per produzione:

1. **Vai su Supabase Dashboard**
2. **Authentication → Settings**
3. **Abilita "Enable email confirmations"**
4. **Configura SMTP** (Settings → Auth → SMTP Settings)
5. **Personalizza email templates** (Settings → Auth → Email Templates)

## ⚠️ Note

- La disabilitazione è **solo per sviluppo/test**
- In produzione, considera di riabilitarla per sicurezza
- Se disabilitata, chiunque con email/password può accedere (anche se email non esiste)

