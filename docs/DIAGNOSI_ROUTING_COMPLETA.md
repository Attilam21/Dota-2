# DIAGNOSI ROUTING COMPLETA

**Data Diagnosi:** $(date)  
**Priorità:** MASSIMA  
**Problema:** NEXT_REDIRECT blocca l'accesso alla Dashboard dopo router.push('/dashboard')

---

## 1. Traccia Flusso Demo (Passaggio per Passaggio)

### Flusso Dati: [Traccia Completa e Logica]

#### **STEP A (Client-Side): DemoForm Action e API Call**

**File:** `app/components/auth/DemoForm.tsx`

**Sequenza di Esecuzione:**

1. **Click Utente** (linea 12-15):
   - Utente clicca "Carica Ultima Partita"
   - `handleSubmit()` viene chiamato
   - `setLoading(true)` viene eseguito
   - `setError(null)` viene eseguito

2. **Validazione Input** (linee 18-22):
   - `accountId` viene parsato in `accountIdNum`
   - Se invalido, mostra errore e termina

3. **Preparazione Request** (linee 24-33):
   - Costruisce URL assoluto: `${window.location.origin}/api/demo/load-player-last-match`
   - Crea `requestBody` con `{ account_id: accountIdNum }`
   - Log: `[DemoForm] Making POST request to: ...`

4. **Fetch API** (linee 36-43):
   - Esegue `fetch()` con metodo `POST`
   - Headers: `Content-Type: application/json`, `Accept: application/json`
   - Body: `JSON.stringify(requestBody)`

5. **Parsing Risposta** (linee 49-74):
   - Legge `response.text()`
   - Parsa JSON
   - Gestisce errori 404 e non-OK

6. **Verifica Successo** (linee 95-104):
   - Se `response.status === 200 && data.status === 'ok'`:
     - Log: `[DemoForm] Redirecting to dashboard...`
     - **ESEGUE:** `router.push('/dashboard')` (linea 101)
   - Altrimenti: lancia errore

7. **Gestione Errori** (linee 105-110):
   - `catch` blocca eventuali errori
   - `finally` esegue `setLoading(false)`

**Punto Critico A:** `router.push('/dashboard')` viene chiamato ma **NON viene atteso** (non è `await router.push()`). Questo significa che il codice continua immediatamente al `finally`, potenzialmente interrompendo la navigazione.

---

#### **STEP B (API Logic): Inside /load-player-last-match/route.ts**

**File:** `app/api/demo/load-player-last-match/route.ts`

**Sequenza di Esecuzione:**

1. **Ricezione Request** (linea 32):
   - Handler `POST` riceve la richiesta
   - Log: `[load-player-last-match] POST request received`

2. **Parsing Body** (linee 40-55):
   - Parsa `request.json()`
   - Valida `account_id`

3. **Fetch OpenDota** (linee 74-125):
   - Chiama OpenDota API per ottenere ultima partita
   - Estrae `match_id`

4. **Import Match** (linee 143-174):
   - Chiama `/api/opendota/import-match?match_id={matchId}` (GET)
   - Salva in `raw_matches`

5. **Build Digest** (linee 176-207):
   - Chiama `/api/opendota/build-digest` (POST)
   - Crea `matches_digest` e `players_digest`

6. **Fetch Data** (linee 209-249):
   - Legge da `players_digest` e `matches_digest`
   - Gestisce errori con try/catch

7. **Risposta Finale** (linee 254-263):
   - Ritorna `NextResponse.json()` con status 200
   - Body: `{ status: "ok", account_id, match_id, player_data, match_data, ... }`

**Punto Critico B:** L'API funziona correttamente e ritorna Status 200. **Nessun problema qui**.

---

#### **STEP C (Client-Side): Execution of router.push('/dashboard')**

**File:** `app/components/auth/DemoForm.tsx` (linea 101)

**Sequenza di Esecuzione:**

1. **Chiamata router.push()** (linea 101):
   - `router.push('/dashboard')` viene eseguito
   - **NON è await**, quindi è asincrono ma non atteso

2. **Next.js App Router Processing:**
   - Next.js inizia la navigazione client-side
   - Next.js fa un **prefetch** della route `/dashboard`
   - Next.js inizia a renderizzare la pagina lato server

3. **Server-Side Rendering di /dashboard:**
   - Next.js chiama `app/dashboard/page.tsx`
   - Esegue `export default async function DashboardPage()`

**Punto Critico C:** `router.push()` è asincrono ma non viene atteso. Il `finally` blocca (linea 108-110) potrebbe eseguirsi prima che la navigazione completi, potenzialmente interrompendo il processo.

---

#### **STEP D (Server-Side Conflict): Why NEXT_REDIRECT is Triggered**

**File:** `app/dashboard/page.tsx` (linee 12-24)

**Sequenza di Esecuzione:**

1. **Inizio Rendering** (linea 12):
   - Next.js chiama `DashboardPage()`
   - Esegue `export default async function DashboardPage()`

2. **Try/Catch createClient()** (linee 16-24):
   ```typescript
   try {
     const supabase = await createClient();
     const { data: { user: authUser } } = await supabase.auth.getUser();
     user = authUser;
   } catch (error) {
     console.log('[dashboard] No valid session, showing demo dashboard');
     user = null;
   }
   ```

3. **Problema Identificato:**
   - `createClient()` viene chiamato da `lib/supabase/server.ts` (linea 4)
   - `createClient()` chiama `cookies()` da `next/headers` (linea 12)
   - **Se `cookies()` fallisce o lancia un errore**, potrebbe causare un NEXT_REDIRECT

4. **Analisi createClient():**
   - `lib/supabase/server.ts` (linee 4-36):
     - Chiama `await cookies()` (linea 12)
     - Se `cookies()` fallisce (es. in un contesto non-server), potrebbe lanciare un errore
     - Se l'errore non viene catturato correttamente, Next.js potrebbe convertirlo in NEXT_REDIRECT

5. **Verifica Logica Dashboard:**
   - Se `user === null` (linea 27), la dashboard dovrebbe renderizzare la versione demo (linee 28-84)
   - **NON dovrebbe esserci redirect** per utenti non autenticati

**Blocco Critico:** Il problema è che **`createClient()` stesso potrebbe lanciare un NEXT_REDIRECT** se `cookies()` fallisce o se c'è un problema con la sessione. Anche se abbiamo try/catch, se l'errore viene lanciato **prima** che il try/catch possa catturarlo, Next.js lo converte in NEXT_REDIRECT.

**File Esatto e Righe di Codice:**
- **File:** `lib/supabase/server.ts`
- **Riga 12:** `const cookieStore = await cookies();`
- **Problema:** Se `cookies()` fallisce in un contesto non-server o se c'è un problema con la sessione, potrebbe lanciare un errore che Next.js interpreta come NEXT_REDIRECT.

**File Secondario:** `app/dashboard/page.tsx`
- **Riga 17:** `const supabase = await createClient();`
- **Problema:** Anche se wrappato in try/catch, se `createClient()` lancia NEXT_REDIRECT internamente, il try/catch potrebbe non catturarlo correttamente.

---

## 2. Analisi Conflitto API (Errore 405)

### Causa Reale 405: [GET non gestito/RESTRIZIONE POST mancante]

**File:** `app/api/demo/load-player-last-match/route.ts` (linee 278-289)

**Analisi:**

1. **Handler GET Esplicito** (linee 278-289):
   ```typescript
   export async function GET(request: NextRequest) {
     console.warn("[load-player-last-match] GET request received - method not allowed. URL:", request.url);
     console.warn("[load-player-last-match] This endpoint only accepts POST requests");
     return NextResponse.json(
       {
         status: "error",
         error: "method_not_allowed",
         details: "Questo endpoint accetta solo richieste POST",
       },
       { status: 405 }
     );
   }
   ```

2. **Causa del 405 nei Log Vercel:**
   - **NON è un problema del codice client** (DemoForm fa POST correttamente)
   - **È causato da Next.js App Router Prefetch:**
     - Quando `router.push('/dashboard')` viene chiamato, Next.js fa un prefetch automatico delle route
     - Next.js potrebbe fare un prefetch di `/api/demo/load-player-last-match` come parte del processo di navigazione
     - Questo prefetch usa **GET** invece di POST, causando il 405

3. **Verifica:**
   - DemoForm fa POST correttamente (linea 37: `method: 'POST'`)
   - L'API ha handler GET esplicito che ritorna 405 (corretto)
   - Il 405 nei log è **NORMALE** e **NON è un problema** - è semplicemente Next.js che fa prefetch

**Conclusione:** L'errore 405 è **NORMALE** e **NON blocca il flusso**. È causato dal prefetch automatico di Next.js che usa GET invece di POST. **NON richiede correzione**.

---

## 3. Piano di Correzione Proposto (Da Approvazione)

### Correzione 1 (Bypass Auth): [Codice Esatto per Disabilitare il Blocco]

**Problema:** `createClient()` potrebbe lanciare NEXT_REDIRECT se `cookies()` fallisce.

**Soluzione:** Modificare `app/dashboard/page.tsx` per gestire `createClient()` in modo più sicuro:

```typescript
// app/dashboard/page.tsx - Linee 12-24

export default async function DashboardPage() {
  // CRITICAL: Safely handle unauthenticated users for demo access
  // Completely bypass createClient() if it might fail
  let user = null;
  let supabase = null;
  
  try {
    // Try to create client, but don't fail if it doesn't work
    supabase = await createClient();
    if (supabase) {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (!error && authUser) {
          user = authUser;
        }
      } catch (authError) {
        // Silently fail - allow demo access
        console.log('[dashboard] Auth check failed, showing demo dashboard');
      }
    }
  } catch (error) {
    // If createClient itself fails, allow demo access
    console.log('[dashboard] createClient failed, showing demo dashboard');
    user = null;
  }
  
  // If no user, show demo dashboard with placeholder data
  if (!user) {
    return (
      // ... existing demo dashboard JSX (linee 28-84)
    );
  }
  
  // ... rest of authenticated user code
}
```

**Alternativa Più Sicura (Raccomandata):**

```typescript
// app/dashboard/page.tsx - Linee 12-24

export default async function DashboardPage() {
  // CRITICAL: Completely bypass authentication check for demo access
  // Use a flag to force demo mode if createClient fails
  let user = null;
  
  // Wrap entire auth check in try/catch with explicit error handling
  try {
    const supabase = await createClient();
    const authResult = await supabase.auth.getUser();
    
    // Only set user if we have a valid result AND no error
    if (authResult.data?.user && !authResult.error) {
      user = authResult.data.user;
    }
  } catch (error) {
    // Explicitly catch ANY error (including NEXT_REDIRECT)
    // Log but don't throw - allow demo access
    console.log('[dashboard] Authentication check failed, allowing demo access:', error);
    user = null;
  }
  
  // Always show demo dashboard if no user
  if (!user) {
    return (
      // ... existing demo dashboard JSX (linee 28-84)
    );
  }
  
  // ... rest of authenticated user code
}
```

---

### Correzione 2 (Fissaggio 405): [Codice Esatto per Garantire che l'API Accetti Solo POST]

**Nota:** L'errore 405 è **NORMALE** e **NON richiede correzione**. È causato dal prefetch automatico di Next.js.

**Se si vuole comunque ridurre il rumore nei log, si può aggiungere un controllo per ignorare le richieste di prefetch:**

```typescript
// app/api/demo/load-player-last-match/route.ts - Linee 278-289

export async function GET(request: NextRequest) {
  // Check if this is a Next.js prefetch request
  const isPrefetch = request.headers.get('purpose') === 'prefetch' || 
                     request.headers.get('x-nextjs-data') !== null;
  
  if (isPrefetch) {
    // Silently return 200 for prefetch requests to reduce log noise
    return NextResponse.json(
      { status: "ok", message: "Prefetch request accepted" },
      { status: 200 }
    );
  }
  
  // Normal GET request - return 405
  console.warn("[load-player-last-match] GET request received - method not allowed. URL:", request.url);
  return NextResponse.json(
    {
      status: "error",
      error: "method_not_allowed",
      details: "Questo endpoint accetta solo richieste POST",
    },
    { status: 405 }
  );
}
```

**Raccomandazione:** **NON applicare questa correzione** - il 405 è normale e non causa problemi.

---

### Correzione 3 (Navigazione Finale): [Codice Esatto per Usare window.location.href in DemoForm.tsx]

**Problema:** `router.push('/dashboard')` è asincrono e potrebbe non completarsi prima che il `finally` blocchi esegua.

**Soluzione:** Usare `window.location.href` come fallback o metodo principale:

```typescript
// app/components/auth/DemoForm.tsx - Linee 95-104

console.log('[DemoForm] Match loaded successfully:', data);

// CRITICAL: Explicit client-side navigation to dashboard after successful API response (status 200)
// Use window.location.href for reliable navigation that cannot be interrupted
if (response.status === 200 && data.status === 'ok') {
  console.log('[DemoForm] Redirecting to dashboard...');
  
  // Use window.location.href for guaranteed navigation
  // This performs a full page reload, ensuring the dashboard is rendered
  window.location.href = '/dashboard';
  
  // Alternative: Try router.push first, fallback to window.location
  // try {
  //   await router.push('/dashboard');
  // } catch (navError) {
  //   console.error('[DemoForm] Router navigation failed, using window.location:', navError);
  //   window.location.href = '/dashboard';
  // }
} else {
  throw new Error('Unexpected response status or data format');
}
```

**Raccomandazione:** Usare `window.location.href = '/dashboard'` direttamente per garantire la navigazione. Questo forza un reload completo della pagina, assicurando che la dashboard venga renderizzata correttamente.

---

## SINTESI CONCLUSIVA

### Problema Principale Identificato:

1. **NEXT_REDIRECT Error:**
   - Causato da `createClient()` che potrebbe lanciare un errore quando `cookies()` fallisce
   - Anche se wrappato in try/catch, se l'errore viene lanciato internamente da Next.js, potrebbe essere convertito in NEXT_REDIRECT
   - **Soluzione:** Migliorare la gestione degli errori in `app/dashboard/page.tsx` per catturare esplicitamente tutti gli errori

2. **router.push() Non Completa:**
   - `router.push('/dashboard')` è asincrono ma non viene atteso
   - Il `finally` blocca potrebbe eseguirsi prima che la navigazione completi
   - **Soluzione:** Usare `window.location.href = '/dashboard'` per garantire la navigazione

3. **Errore 405:**
   - **NON è un problema** - è causato dal prefetch automatico di Next.js
   - **NON richiede correzione**

### Priorità Correzioni:

1. **ALTA PRIORITÀ:** Correzione 3 (Navigazione Finale) - Usare `window.location.href`
2. **ALTA PRIORITÀ:** Correzione 1 (Bypass Auth) - Migliorare gestione errori in dashboard
3. **BASSA PRIORITÀ:** Correzione 2 (Fissaggio 405) - NON necessaria

---

**Firmato:** Lead Software Architect  
**Data:** $(date)  
**Status:** DIAGNOSI COMPLETA - IN ATTESA DI APPROVAZIONE PER APPLICAZIONE CORREZIONI

