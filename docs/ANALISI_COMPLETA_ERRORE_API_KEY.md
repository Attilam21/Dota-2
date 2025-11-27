# 🔍 Analisi Completa: Errore "No API key found in request"

## 📊 Situazione Attuale

**Errore osservato:**
- ❌ "No API key found in request"
- ❌ "No `apikey` request header or url param was found"
- ❌ Errore 400 su `/auth/v1/token?grant_type=password`

**Stato verificato:**
- ✅ Chiavi corrispondono tra Supabase e Vercel
- ✅ Chiavi complete (non troncate)
- ✅ Variabili d'ambiente configurate in Vercel
- ✅ Versione librerie corrette (`@supabase/ssr@0.5.2`, `@supabase/supabase-js@2.48.0`)

## 🔍 Possibili Cause

### Causa 1: Nuove API Keys Non Supportate dal Client (PIÙ PROBABILE)

**Problema:**
- Le nuove API keys (`sb_publishable_...`, `sb_secret_...`) sono un formato nuovo
- Il client Supabase potrebbe non inviare correttamente queste keys nell'header
- Il client potrebbe aspettarsi ancora il formato JWT vecchio (`eyJhbGci...`)

**Come verificare:**
- Controlla i log di rete nel browser
- Verifica se l'header `apikey` viene inviato
- Verifica il formato della chiave nell'header

**Soluzione:**
- Usa temporaneamente la chiave JWT vecchia (se disponibile)
- Oppure aggiorna a versioni più recenti delle librerie (quando disponibili)

### Causa 2: Header API Key Non Inviato Correttamente

**Problema:**
- Il client Supabase potrebbe non inviare l'header `apikey` con le nuove keys
- Potrebbe usare un formato diverso per le nuove keys

**Come verificare:**
- Apri Network tab nel browser
- Controlla la richiesta a `/auth/v1/token`
- Verifica se c'è l'header `apikey` o `Authorization`

**Soluzione:**
- Potrebbe essere necessario configurare esplicitamente l'header
- O usare un formato diverso per le nuove keys

### Causa 3: Variabile d'Ambiente Non Caricata a Runtime

**Problema:**
- La variabile `NEXT_PUBLIC_SUPABASE_ANON_KEY` potrebbe non essere disponibile a runtime
- Potrebbe essere `undefined` quando il client viene creato

**Come verificare:**
- Aggiungi logging per vedere se la variabile è definita
- Controlla se il valore viene letto correttamente

**Soluzione:**
- Verifica che la variabile sia presente in Vercel
- Verifica che sia selezionata per "All Environments"
- Fai redeploy dopo ogni modifica

### Causa 4: Problema con Build/Runtime di Vercel

**Problema:**
- Vercel potrebbe non caricare correttamente le variabili `NEXT_PUBLIC_*`
- Potrebbe esserci un problema con il build process

**Come verificare:**
- Controlla i log di build di Vercel
- Verifica se ci sono errori durante il build
- Controlla se le variabili sono disponibili a runtime

**Soluzione:**
- Pulisci la cache di Vercel
- Fai redeploy completo
- Verifica che le variabili siano nel formato corretto

### Causa 5: Configurazione Supabase Data API

**Problema:**
- Le nuove API keys potrebbero richiedere configurazione speciale in Supabase
- Potrebbe mancare qualche impostazione nel dashboard

**Come verificare:**
- Vai su Supabase Dashboard → Settings → Data API
- Verifica che "Enable Data API" sia attivo
- Verifica che gli schemi siano esposti correttamente

**Soluzione:**
- Abilita tutte le impostazioni necessarie
- Verifica che non ci siano restrizioni sulle nuove keys

### Causa 6: Cache del Browser

**Problema:**
- Il browser potrebbe avere cache di vecchie richieste
- Potrebbe usare vecchie configurazioni

**Come verificare:**
- Fai hard refresh (`Ctrl+Shift+R`)
- Pulisci cache e cookie
- Prova in modalità incognito

**Soluzione:**
- Pulisci cache del browser
- Prova in modalità incognito

## 🎯 Priorità delle Cause

1. **ALTA**: Nuove API keys non supportate correttamente dal client
2. **ALTA**: Header API key non inviato correttamente
3. **MEDIA**: Variabile d'ambiente non caricata a runtime
4. **MEDIA**: Problema con build/runtime Vercel
5. **BASSA**: Configurazione Supabase Data API
6. **BASSA**: Cache del browser

## 📝 Come Verificare Ogni Causa

### Verifica 1: Controlla Header nella Richiesta

1. Apri Network tab nel browser
2. Prova a fare login
3. Clicca sulla richiesta a `/auth/v1/token`
4. Controlla la tab "Headers"
5. Cerca l'header `apikey` o `Authorization`
6. Verifica se è presente e qual è il valore

### Verifica 2: Controlla Variabile a Runtime

Aggiungi logging temporaneo in `lib/supabase/client.ts`:

```typescript
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Supabase Client] URL:', supabaseUrl);
  console.log('[Supabase Client] Key present:', !!supabaseAnonKey);
  console.log('[Supabase Client] Key value:', supabaseAnonKey?.substring(0, 20));
  
  // ... resto del codice
}
```

### Verifica 3: Controlla Configurazione Supabase

1. Vai su Supabase Dashboard → Settings → Data API
2. Verifica:
   - "Enable Data API" è attivo ✅
   - "Exposed schemas" include `public` ✅
   - Non ci sono restrizioni

### Verifica 4: Controlla Chiave JWT Vecchia

1. Vai su Supabase Dashboard → Settings → **API** (non "API Keys"!)
2. Cerca se c'è ancora la sezione con chiave JWT vecchia
3. Se c'è, prova a usarla temporaneamente

## ✅ Soluzioni da Provare (in Ordine)

### Soluzione 1: Usa Chiave JWT Vecchia (Temporaneo)

Se disponibile, usa la chiave JWT vecchia per verificare se il problema è con le nuove keys.

### Soluzione 2: Aggiungi Logging

Aggiungi logging per vedere cosa viene inviato nelle richieste.

### Soluzione 3: Verifica Header Manualmente

Controlla manualmente nell'Network tab se l'header viene inviato.

### Soluzione 4: Contatta Supporto Supabase

Se nulla funziona, potrebbe essere un bug con le nuove API keys.

## 📊 Conclusione

Il problema più probabile è che **le nuove API keys non vengono inviate correttamente nell'header** dal client Supabase. Questo potrebbe essere:
- Un bug nelle librerie attuali
- Un problema di compatibilità
- Una configurazione mancante

**Raccomandazione:** Prova prima con la chiave JWT vecchia (se disponibile) per isolare il problema.

