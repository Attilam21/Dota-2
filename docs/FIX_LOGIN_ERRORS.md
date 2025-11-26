# 🔧 Fix Errori Login - 400 Bad Request

## 📊 Problema Identificato

**Errore:**
- `400 (Bad Request)` su `/auth/v1/token?grant_type=password`
- Messaggio generico "Invalid login credentials"
- Non si vede il vero errore

## 🔍 Cause Possibili

### 1. Email Confirmation Abilitata (PIÙ PROBABILE)
- Supabase potrebbe avere email confirmation abilitata
- L'utente deve confermare l'email prima di poter fare login
- Se prova a fare login senza conferma → **400 Bad Request**

### 2. Credenziali Errate
- Email o password non corrispondono
- Utente non esiste

### 3. Gestione Errori Insufficiente
- Messaggio di errore generico
- Non mostra il vero errore da Supabase

## ✅ Modifiche Implementate

### 1. LoginForm.tsx - Gestione Errori Migliorata

**Prima:**
```typescript
if (signInError) throw signInError;
// Messaggio generico
```

**Dopo:**
```typescript
if (signInError) {
  console.error('[LoginForm] Sign in error:', {
    message: signInError.message,
    status: signInError.status,
    name: signInError.name,
  });

  // Messaggi specifici per tipo di errore
  if (signInError.message.includes('Email not confirmed')) {
    setError('Email non confermata. Controlla la tua email...');
  } else if (signInError.message.includes('Invalid login credentials')) {
    setError('Email o password errate. Riprova.');
  } else {
    setError(signInError.message || 'Errore durante il login.');
  }
  return;
}
```

**Miglioramenti:**
- ✅ Logging dettagliato in console
- ✅ Messaggi di errore specifici
- ✅ Gestione caso email non confermata
- ✅ Gestione caso profilo mancante

### 2. RegisterForm.tsx - Gestione Email Confirmation

**Aggiunto:**
```typescript
if (authData.user && !authData.session) {
  // Email confirmation richiesta
  setError('Controlla la tua email per confermare l\'account...');
  return;
}
```

**Miglioramenti:**
- ✅ Rileva se email confirmation è richiesta
- ✅ Mostra messaggio chiaro all'utente
- ✅ Non fa redirect se email non confermata

## 🧪 Test

Dopo le modifiche:

1. **Prova login con email non confermata:**
   - Dovrebbe mostrare: "Email non confermata. Controlla la tua email..."

2. **Prova login con credenziali errate:**
   - Dovrebbe mostrare: "Email o password errate. Riprova."

3. **Controlla console:**
   - Dovrebbe mostrare log dettagliati dell'errore

## 📝 Prossimi Step

1. **Verificare in Supabase Dashboard:**
   - Authentication → Settings
   - Controlla se "Enable email confirmations" è attivo

2. **Se email confirmation è abilitata:**
   - **Opzione A**: Disabilita per sviluppo (più semplice)
   - **Opzione B**: Mantieni abilitata e gestisci il flusso completo

3. **Testare:**
   - Registrazione → Verifica email → Login
   - Login con credenziali errate
   - Login con email non confermata

## 🎯 Verifica Configurazione Supabase

Per verificare se email confirmation è abilitata:

1. Vai su Supabase Dashboard
2. Authentication → Settings
3. Controlla "Enable email confirmations"
4. Se è attivo, hai due opzioni:
   - **Disabilita** (per sviluppo/test)
   - **Mantieni abilitata** e gestisci il flusso completo

## ✅ Conclusione

Le modifiche migliorano:
- ✅ Visibilità degli errori (logging dettagliato)
- ✅ Messaggi di errore specifici per l'utente
- ✅ Gestione caso email non confermata
- ✅ Gestione caso profilo mancante

Ora dovresti vedere il vero errore nella console e messaggi più chiari per l'utente.

