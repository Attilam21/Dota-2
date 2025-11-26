# 🔍 Analisi Errori Login - 400 Bad Request

## 📊 Problema Identificato

**Errore osservato:**
- `400 (Bad Request)` su `/auth/v1/token?grant_type=password`
- Messaggio UI: "Invalid login credentials"
- L'utente non riesce a fare login

## 🔍 Possibili Cause

### 1. Email Confirmation Abilitata (PIÙ PROBABILE)
**Problema:**
- Supabase potrebbe avere **email confirmation abilitata**
- Dopo la registrazione, l'utente deve confermare l'email prima di poter fare login
- Se l'utente prova a fare login senza aver confermato l'email → **400 Bad Request**

**Verifica:**
- Vai su Supabase Dashboard → Authentication → Settings
- Controlla se "Enable email confirmations" è attivo

**Soluzione:**
- **Opzione A**: Disabilita email confirmation (per sviluppo)
- **Opzione B**: Mantieni abilitata e gestisci il flusso di conferma email
- **Opzione C**: Usa `emailRedirectTo` durante signUp per redirect automatico

### 2. Credenziali Errate
**Problema:**
- Email o password non corrispondono a un utente esistente
- L'utente potrebbe non esistere ancora

**Verifica:**
- Controlla in Supabase Dashboard → Authentication → Users
- Verifica se l'utente esiste e se l'email è confermata

### 3. Problema con Gestione Errori
**Problema:**
- Il messaggio di errore generico "Invalid login credentials" non mostra il vero errore
- Potrebbe essere un errore più specifico (email non confermata, account disabilitato, ecc.)

**Soluzione:**
- Migliorare la gestione degli errori in `LoginForm.tsx`
- Mostrare messaggi di errore più specifici

### 4. Problema con Configurazione Supabase
**Problema:**
- Variabili d'ambiente mancanti o errate
- URL o chiavi API non corrette

**Verifica:**
- Controlla `NEXT_PUBLIC_SUPABASE_URL`
- Controlla `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔧 Soluzioni da Implementare

### Soluzione 1: Migliorare Gestione Errori Login
Aggiungere logging dettagliato e messaggi di errore specifici:

```typescript
const { data, error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (signInError) {
  console.error('[LoginForm] Sign in error:', signInError);
  
  // Messaggi di errore specifici
  if (signInError.message.includes('email')) {
    setError('Email non confermata. Controlla la tua email per il link di conferma.');
  } else if (signInError.message.includes('password')) {
    setError('Password errata. Riprova.');
  } else {
    setError(signInError.message || 'Errore durante il login');
  }
  return;
}
```

### Soluzione 2: Gestire Email Confirmation in Registrazione
Se email confirmation è abilitata, mostrare messaggio dopo registrazione:

```typescript
const { data: authData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { nickname },
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});

if (authData.user && !authData.session) {
  // Email confirmation richiesta
  setError('Controlla la tua email per confermare l\'account prima di fare login.');
  return;
}
```

### Soluzione 3: Verificare Configurazione Supabase
Creare script di verifica per controllare:
- Se email confirmation è abilitata
- Se l'utente esiste
- Se l'email è confermata

## 📝 Prossimi Step

1. **Verificare** se email confirmation è abilitata in Supabase
2. **Migliorare** gestione errori in `LoginForm.tsx`
3. **Aggiungere** logging dettagliato per debug
4. **Gestire** caso email non confermata
5. **Testare** con utente esistente e confermato

## 🎯 Priorità

1. **ALTA**: Verificare email confirmation in Supabase Dashboard
2. **ALTA**: Migliorare gestione errori per vedere il vero errore
3. **MEDIA**: Gestire flusso email confirmation se abilitata
4. **BASSA**: Aggiungere script di verifica configurazione

