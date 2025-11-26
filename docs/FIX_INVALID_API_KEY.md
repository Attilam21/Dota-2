# 🔧 Fix: "Invalid API key" Error

## 🔍 Problema

Errore quando provi a fare login:
- ❌ "Invalid API key" (messaggio UI)
- ❌ `401 Unauthorized` nella console
- ❌ Le variabili d'ambiente sono configurate in Vercel

## 🔍 Possibili Cause

### 1. Formato API Key Non Supportato
**Problema:**
- Le nuove API keys di Supabase (`sb_publishable_...`, `sb_secret_...`) potrebbero non essere supportate dalla versione di `@supabase/ssr` che stai usando
- Il client Supabase potrebbe aspettarsi ancora il formato JWT vecchio

**Verifica:**
- Controlla la versione di `@supabase/ssr` in `package.json`
- Le nuove keys potrebbero richiedere una versione più recente

### 2. Variabile d'Ambiente Non Caricata
**Problema:**
- La variabile `NEXT_PUBLIC_SUPABASE_ANON_KEY` potrebbe non essere caricata correttamente
- Potrebbe essere necessario fare redeploy dopo aver aggiunto/modificato le variabili

**Verifica:**
- Controlla che la variabile sia presente in Vercel
- Verifica che lo scope sia "All Environments"
- Fai redeploy dopo ogni modifica

### 3. Chiave Errata o Incompleta
**Problema:**
- La chiave potrebbe essere stata copiata in modo incompleto
- Potrebbero esserci spazi o caratteri extra

**Verifica:**
- Copia la chiave esatta da Supabase Dashboard
- Verifica che non ci siano spazi all'inizio o alla fine
- Verifica che la chiave sia completa

## ✅ Soluzioni

### Soluzione 1: Verifica Versione @supabase/ssr

Controlla `package.json`:
```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.0" // Deve essere >= 0.5.0 per supportare nuove keys
  }
}
```

Se la versione è vecchia, aggiorna:
```bash
npm install @supabase/ssr@latest
```

### Soluzione 2: Usa Formato Vecchio (Temporaneo)

Se le nuove keys non funzionano, puoi:
1. Vai su Supabase Dashboard → Settings → API (non API Keys!)
2. Trova la sezione "Project API keys"
3. Usa la chiave JWT vecchia (se ancora disponibile)

**Nota:** Questo è un workaround temporaneo. Le nuove keys dovrebbero funzionare.

### Soluzione 3: Verifica Configurazione Vercel

1. **Vai su Vercel Dashboard** → Settings → Environment Variables
2. **Verifica** che `NEXT_PUBLIC_SUPABASE_ANON_KEY` sia:
   - Presente
   - Valore completo (inizia con `sb_publishable_...`)
   - Scope: "All Environments"
3. **Redeploy** il progetto

### Soluzione 4: Aggiungi Logging per Debug

Aggiungi logging temporaneo per vedere cosa viene caricato:

```typescript
// In lib/supabase/client.ts
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Supabase Client] URL:', supabaseUrl);
  console.log('[Supabase Client] Key present:', !!supabaseAnonKey);
  console.log('[Supabase Client] Key starts with:', supabaseAnonKey?.substring(0, 20));

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
```

## 🎯 Prossimi Step

1. **Verifica** versione `@supabase/ssr`
2. **Aggiorna** se necessario
3. **Redeploy** dopo aggiornamento
4. **Testa** login di nuovo
5. Se ancora non funziona, **usa logging** per vedere cosa viene caricato

## 📝 Note

- Le nuove API keys di Supabase (`sb_publishable_`, `sb_secret_`) sono supportate dalle versioni recenti di `@supabase/ssr`
- Se stai usando una versione vecchia, potrebbe essere necessario aggiornare
- Il formato JWT vecchio funziona ancora, ma le nuove keys sono più sicure

