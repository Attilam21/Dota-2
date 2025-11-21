# REPORT TECNICO - VERIFICA GLOBALE PROGETTO DOTA 2

**Data:** 2025-12-01  
**Versione:** 1.0  
**Scopo:** Audit sistematico di database, API, client Supabase, e flussi utente

---

## 1. MAPPA TABELLE ↔ CODICE

### 1.1 Tabelle Dota 2 Core

#### `matches_digest`
**Schema:** `0001_create_matches_digest.sql` + estensioni in `20251201_create_dota_analysis_tables.sql`

**Colonne principali:**
- `id`, `player_account_id`, `match_id`, `hero_id`, `kills`, `deaths`, `assists`
- `duration_seconds`, `start_time`, `result` ('win'|'lose')
- `lane`, `role`, `kda`
- **Aggiunte in 20251201:** `role_position`, `gold_per_min`, `xp_per_min`, `last_hits`, `denies`

**Uso nel codice:**
- ✅ **Lettura:** `src/app/api/matches/list/route.ts` (fallback dopo OpenDota)
- ✅ **Lettura:** `src/app/api/fzth/sync-player/route.ts` (sync disabilitato, ma codice presente)
- ✅ **Lettura:** `src/app/api/players/history/route.ts`
- ✅ **Lettura:** `src/app/api/teammates/summary/route.ts`
- ✅ **Lettura:** `src/app/api/players/list/route.ts`
- ✅ **Scrittura:** `src/app/api/fzth/sync-player/route.ts` (usando service_role)
- ✅ **Lettura:** `src/lib/fzth/recomputeStats.ts`

**RLS:** ✅ Abilitato in `20251121_matches_digest_rls_strategy.sql`
- SELECT: pubblico (anon)
- INSERT/UPDATE/DELETE: solo `service_role`

**Problemi identificati:**
- ⚠️ **Colonne non usate:** `lane`, `role` (testuali) potrebbero non essere popolate
- ⚠️ **Colonne nuove non verificate:** `role_position`, `gold_per_min`, `xp_per_min`, `last_hits`, `denies` aggiunte ma non verificate se popolate da sync
- ✅ **Client corretto:** `sync-player` usa `service_role` per INSERT/UPDATE

---

#### `dota_player_match_analysis`
**Schema:** `20251201_create_dota_analysis_tables.sql`

**Colonne principali:**
- `match_id`, `account_id`, `role_position`
- `kills_early/mid/late`, `kill_pct_early/mid/late`
- `deaths_early/mid/late`, `death_pct_early/mid/late`
- `total_gold_lost`, `total_xp_lost`, `total_cs_lost`
- `death_pct_pos1..pos5`
- `analysis_extra` (jsonb)

**Uso nel codice:**
- ✅ **Lettura:** `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts` (funzione `loadAnalysisFromSupabase`)
- ✅ **Scrittura:** `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts` (funzione `upsertMatchAnalysis`)

**RLS:** ✅ Abilitato
- SELECT: pubblico (anon)
- INSERT/UPDATE/DELETE: solo `service_role`

**Problemi identificati:**
- ✅ **Client corretto:** Usa `getAdminClient()` (service_role) per tutte le operazioni
- ⚠️ **Verifica necessaria:** Controllare che i valori non siano sempre zero in produzione

---

#### `dota_player_death_events`
**Schema:** `20251201_create_dota_analysis_tables.sql`

**Colonne principali:**
- `match_id`, `account_id`, `time_seconds`, `phase` ('early'|'mid'|'late')
- `level_at_death`, `downtime_seconds`
- `gold_lost`, `xp_lost`, `cs_lost`
- `killer_hero_id`, `killer_role_position`
- `pos_x`, `pos_y` (opzionali, non ancora popolati)

**Uso nel codice:**
- ✅ **Lettura:** `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts` (funzione `loadAnalysisFromSupabase`)
- ✅ **Scrittura:** `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts` (funzione `upsertDeathEvents`)

**RLS:** ✅ Abilitato
- SELECT: pubblico (anon)
- INSERT/UPDATE/DELETE: solo `service_role`

**Problemi identificati:**
- ✅ **Client corretto:** Usa `getAdminClient()` (service_role)
- ⚠️ **Colonne non popolate:** `pos_x`, `pos_y` sempre NULL (TODO nel codice)
- ✅ **Logica corretta:** DELETE + INSERT per idempotenza

---

#### `dota_tasks`
**Schema:** `20251125_create_dota_tasks.sql`

**Colonne principali:**
- `id`, `player_id` (text, account ID Dota 2)
- `type`, `title`, `description`
- `status` ('open'|'completed'|'failed')
- `kpi_payload` (jsonb), `params` (jsonb)
- `created_at`, `updated_at`, `resolved_at`

**Uso nel codice:**
- ✅ **Lettura:** `src/app/api/tasks/list/route.ts`
- ✅ **Scrittura:** `src/app/api/tasks/generate/route.ts` (INSERT)
- ✅ **Scrittura:** `src/app/api/tasks/evaluate/route.ts` (UPDATE)

**RLS:** ⚠️ **NON ABILITATO** - La migration `20251125_create_dota_tasks.sql` NON abilita RLS

**Problemi identificati:**
- ⚠️ **MEDIO:** Tutte le operazioni su `dota_tasks` usano `createServerClient(cookies())` (anon key)
- ⚠️ **RISCHIO SICUREZZA:** Se RLS viene abilitato in futuro senza policy per anon, le operazioni INSERT/UPDATE falliranno
- ✅ **Stato attuale:** Funziona perché RLS non è abilitato, ma non è una best practice
- 🔴 **RACCOMANDAZIONE:** Abilitare RLS e migrare a `getAdminClient()` per coerenza con altre tabelle Dota 2

---

### 1.2 Tabelle FZTH (non-Dota specifiche)

#### `fzth_players`
**Uso:** `src/app/api/fzth/profile/route.ts`, `src/app/api/fzth/sync-player/route.ts`
**Client:** Mix di `service_role` (in `profile`) e `createServerClient` (in `sync-player`)

#### `player_stats_agg`
**Uso:** `src/app/api/fzth/profile/route.ts` (fallback), `src/app/api/fzth/sync-player/route.ts`, `src/lib/fzth/recomputeStats.ts`
**Client:** Mix di `service_role` e `createServerClient`

#### `player_progression`, `fzth_levels`, `player_achievements`, `achievement_catalog`, `player_hero_stats`, `ai_insights`
**Uso:** Varie API FZTH
**Nota:** Non analizzate in dettaglio (fuori scope Dota 2 core)

---

## 2. PUNTI CRITICI RLS / SUPABASE CLIENT

### 2.1 Client Admin (Service Role) - ✅ CORRETTO

**File:** `src/lib/supabaseAdmin.ts`
- ✅ Usa `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Singleton pattern con `getAdminClient()`
- ✅ Usato correttamente in:
  - `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts` (tutte le operazioni)

### 2.2 Client Anon - ⚠️ RISCHI IDENTIFICATI

**File:** `src/utils/supabase.ts`
- Usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Punti a rischio RLS:**

#### ⚠️ **MEDIO: `dota_tasks`**
**File:** `src/app/api/tasks/list/route.ts`, `generate/route.ts`, `evaluate/route.ts`
- **Problema:** Tutte le operazioni usano `createServerClient(cookies())` (anon key)
- **Stato attuale:** Funziona perché RLS NON è abilitato sulla tabella
- **Rischio futuro:** Se RLS viene abilitato senza policy per anon, le operazioni falliranno
- **Azione richiesta:** Migrare a `getAdminClient()` per coerenza e sicurezza futura

#### ⚠️ **MEDIO: `matches_digest` (solo lettura)**
**File:** `src/app/api/matches/list/route.ts` (fallback)
- **Stato:** Solo SELECT, policy pubblica presente → ✅ OK

#### ⚠️ **MEDIO: Tabelle FZTH**
**File:** Varie API FZTH
- **Stato:** Mix di client anon e service_role
- **Azione richiesta:** Audit separato per FZTH (fuori scope Dota 2 core)

---

## 3. API DOTA 2: COPERTURA E RISCHI

### 3.1 API Core Dota 2

#### `/api/dota/matches/[matchId]/players/[accountId]/analysis`
**File:** `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts`

**Cosa fa:**
- Carica analisi da Supabase (se esiste)
- Se non esiste, calcola da OpenDota
- Salva in Supabase (`dota_player_match_analysis` + `dota_player_death_events`)

**Tabelle:**
- **Lettura:** `dota_player_match_analysis`, `dota_player_death_events`
- **Scrittura:** `dota_player_match_analysis` (upsert), `dota_player_death_events` (delete + insert)

**Componenti React che la chiamano:**
- ✅ `src/app/dota/matches/[matchId]/players/[accountId]/page.tsx`

**Gestione errori:**
- ✅ Try-catch completo
- ✅ Logging dettagliato (`console.error`)
- ⚠️ **Non-fatal:** Se salvataggio fallisce, ritorna comunque l'analisi (corretto per UX)

**Stato:** ✅ **FUNZIONANTE** - Usa client admin correttamente

---

### 3.2 API Supporto Dota 2 (non in `/api/dota/`)

#### `/api/matches/list`
**File:** `src/app/api/matches/list/route.ts`
- **Sorgente primaria:** OpenDota (via `opendotaAdapter`)
- **Fallback:** Supabase `matches_digest` (solo lettura)
- **Client:** `createServerClient` (anon) - ✅ OK per SELECT
- **Chiamata da:** `src/app/dashboard/matches/page.tsx`, `src/app/dashboard/page.tsx`

#### `/api/matches/detail`
**File:** `src/app/api/matches/detail/route.ts`
- **Sorgente:** OpenDota (via `opendotaAdapter`)
- **Nessuna scrittura Supabase**
- **Chiamata da:** `src/app/dashboard/matches/[matchId]/page.tsx`

#### `/api/tasks/list`, `/api/tasks/generate`, `/api/tasks/evaluate`
**File:** `src/app/api/tasks/*/route.ts`
- **Tabelle:** `dota_tasks`
- **Client:** ⚠️ `createServerClient` (anon) - **RISCHIO RLS**
- **Chiamata da:** `src/app/dashboard/coaching/page.tsx`

---

### 3.3 API Non Usate / Dead Code

#### `/api/sync/recent-matches`
**File:** `src/app/api/sync/recent-matches/route.ts`
- **Stato:** Disabilitato (ritorna sempre `{ ok: true, skipped: true }`)
- **Nota:** Mantenuto per compatibilità, ma non esegue sincronizzazione
- **Azione:** Considerare rimozione o documentazione esplicita

---

## 4. FLUSSO UTENTE: BUCHI E MANCANZE

### 4.1 Login / Selezione Account

**File:** `src/components/PlayerSelector.tsx` (presunto), `src/lib/playerId.ts`

**Stato:**
- ✅ Default player ID presente (`DEFAULT_PLAYER_ID = 86745912`)
- ✅ `getPlayerIdFromSearchParams` gestisce parametro mancante

**Problemi:**
- ⚠️ **Mancanza:** Nessuna validazione che il player ID sia valido (numero > 0)
- ⚠️ **Mancanza:** Nessun fallback se OpenDota non trova il player

---

### 4.2 Dashboard Panoramica

**File:** `src/app/dashboard/page.tsx`

**API chiamate:**
- `/api/matches/list?playerId=...&limit=20`
- `/api/kpi/player-overview?playerId=...&limit=20`
- `/api/kpi/style-of-play?playerId=...&limit=20`

**Gestione errori:**
- ✅ Loading state presente
- ✅ Error state presente
- ✅ Empty state presente ("Non sono ancora presenti partite")
- ⚠️ **Mancanza:** Se `playerId` è null/undefined, mostra solo SyncPlayerPanel (OK, ma potrebbe essere più esplicito)

**Problemi:**
- ✅ **OK:** Gestisce array vuoto (`rows.length === 0`)
- ⚠️ **Migliorabile:** Se KPI API fallisce, la pagina mostra dati parziali (non bloccante, ma potrebbe mostrare warning)

---

### 4.3 Performance & Stile di Gioco

**File:** `src/app/dashboard/performance/page.tsx` (presunto)

**Stato:** Non analizzato in dettaglio (fuori scope audit)

---

### 4.4 Elenco Partite

**File:** `src/app/dashboard/matches/page.tsx`

**API chiamata:**
- `/api/matches/list?playerId=...`

**Gestione errori:**
- ✅ Loading state
- ✅ Error state
- ⚠️ **Mancanza:** Empty state esplicito (mostra tabella vuota, ma potrebbe avere messaggio)

**Problemi:**
- ✅ **OK:** Gestisce `playerId` mancante (usa default)
- ⚠️ **Migliorabile:** Se `getHeroName(hero_id)` ritorna null, potrebbe rompere rendering

---

### 4.5 Match Detail Standard

**File:** `src/app/dashboard/matches/[matchId]/page.tsx`

**API chiamate:**
- `/api/matches/detail?matchId=...&playerId=...`
- `/api/kpi/match-advanced?matchId=...&playerId=...`

**Gestione errori:**
- ✅ Controllo parametri mancanti (`if (!matchId || !playerId)`)
- ✅ Loading/Error state
- ⚠️ **Mancanza:** Se `matchId` non è valido (non numero), potrebbe fallire silenziosamente

**Problemi:**
- ✅ **OK:** Link a "Analisi Avanzata FZTH" presente
- ⚠️ **Migliorabile:** Validazione `matchId` come numero

---

### 4.6 Analisi Avanzata FZTH

**File:** `src/app/dota/matches/[matchId]/players/[accountId]/page.tsx`

**API chiamata:**
- `/api/dota/matches/[matchId]/players/[accountId]/analysis`

**Gestione errori:**
- ✅ Controllo parametri mancanti
- ✅ Loading/Error/Empty state
- ✅ Messaggio errore chiaro

**Problemi:**
- ✅ **OK:** Tutti gli stati gestiti correttamente
- ⚠️ **Migliorabile:** Se match non esiste in OpenDota, errore generico (potrebbe essere più specifico)

---

### 4.7 Coaching & Task

**File:** `src/app/dashboard/coaching/page.tsx`

**API chiamate:**
- `/api/tasks/list?playerId=...`
- `/api/tasks/generate` (POST)
- `/api/tasks/evaluate` (POST)

**Gestione errori:**
- ✅ Gestione formato risposta (`{ tasks: [], error: null }`)
- ✅ Fallback per formato vecchio (array diretto)
- ✅ Error state con messaggio

**Problemi:**
- 🔴 **CRITICO:** Se RLS su `dota_tasks` blocca INSERT/UPDATE, le operazioni falliranno silenziosamente
- ⚠️ **Migliorabile:** Validazione che `playerId` sia valido prima di chiamare API

---

## 5. CHECK-LIST DI TEST CONSIGLIATI

### 5.1 Test Manuali (Priorità Alta)

1. **Test: Dashboard con player senza partite**
   - **Scenario:** Apri dashboard con player ID valido ma 0 partite in OpenDota
   - **Atteso:** UI mostra "Non sono ancora presenti partite" senza errori
   - **File:** `src/app/dashboard/page.tsx`

2. **Test: Analisi avanzata con 0 morti**
   - **Scenario:** Apri analisi per match dove player ha 0 morti
   - **Atteso:** Death Cost mostra 0, Death by Role mostra 0%, nessun errore
   - **File:** `src/app/dota/matches/[matchId]/players/[accountId]/page.tsx`

3. **Test: Match ID non valido**
   - **Scenario:** Apri `/dashboard/matches/INVALID?playerId=86745912`
   - **Atteso:** Errore chiaro, non crash
   - **File:** `src/app/dashboard/matches/[matchId]/page.tsx`

4. **Test: Player ID mancante**
   - **Scenario:** Apri dashboard senza `?playerId=...`
   - **Atteso:** Usa default player ID o mostra SyncPlayerPanel
   - **File:** Varie pagine dashboard

5. **Test: OpenDota API timeout**
   - **Scenario:** Simula timeout OpenDota (disconnettere rete o usare ID inesistente)
   - **Atteso:** Fallback a Supabase (se disponibile) o errore chiaro
   - **File:** `src/app/api/matches/list/route.ts`

6. **Test: Task generation con dati validi**
   - **Scenario:** Genera task per player con KPI validi
   - **Atteso:** Task creati in `dota_tasks`, UI mostra lista aggiornata
   - **File:** `src/app/api/tasks/generate/route.ts`, `src/app/dashboard/coaching/page.tsx`
   - **Nota:** RLS non abilitato attualmente, ma test valida funzionalità base

7. **Test: Analisi avanzata - verifica salvataggio Supabase**
   - **Scenario:** Apri analisi per match nuovo, verifica in Supabase
   - **Atteso:** Righe create in `dota_player_match_analysis` e `dota_player_death_events`
   - **File:** `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts`

8. **Test: Hero ID non valido**
   - **Scenario:** Match con `hero_id` che non esiste in mapping
   - **Atteso:** `getHeroName()` ritorna fallback, UI non crasha
   - **File:** Varie pagine che usano `getHeroName()`

---

### 5.2 Test Automatici (Scheletro)

#### Test 1: API Analysis - Salvataggio Supabase

```typescript
// test/api/dota-analysis.test.ts
import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route'

describe('Dota Analysis API', () => {
  it('should save analysis to Supabase', async () => {
    const matchId = 7792959229
    const accountId = 86745912
    
    const response = await GET(
      new Request(`http://localhost/api/dota/matches/${matchId}/players/${accountId}/analysis`),
      { params: { matchId: String(matchId), accountId: String(accountId) } }
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.matchId).toBe(matchId)
    expect(data.accountId).toBe(accountId)
    
    // Verifica in Supabase (usando client admin)
    const supabase = getAdminClient()
    const { data: analysis } = await supabase
      .from('dota_player_match_analysis')
      .select('*')
      .eq('match_id', matchId)
      .eq('account_id', accountId)
      .single()
    
    expect(analysis).toBeTruthy()
    expect(analysis.total_gold_lost).toBeGreaterThanOrEqual(0)
  })
})
```

#### Test 2: Task API - RLS Verification

```typescript
// test/api/tasks-rls.test.ts
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/tasks/generate/route'

describe('Tasks API - RLS', () => {
  it('should handle RLS errors gracefully', async () => {
    const response = await POST(
      new Request('http://localhost/api/tasks/generate', {
        method: 'POST',
        body: JSON.stringify({ playerId: '86745912' })
      })
    )
    
    const data = await response.json()
    // Se RLS blocca, dovrebbe ritornare errore chiaro, non crash
    if (data.error) {
      expect(data.error).toContain('task')
    } else {
      expect(data.tasks).toBeDefined()
    }
  })
})
```

---

## 6. AZIONI PRIORITARIE

### 🔴 **PRIORITÀ CRITICA**

1. **Migrare `dota_tasks` a client admin per coerenza**
   - **Azione:** Migrare tutte le operazioni su `dota_tasks` a usare `getAdminClient()`
   - **Motivo:** Coerenza con altre tabelle Dota 2, sicurezza futura se RLS viene abilitato
   - **File:** `src/app/api/tasks/list/route.ts`, `generate/route.ts`, `evaluate/route.ts`
   - **Rischio attuale:** Basso (RLS non abilitato), ma migliore praticare sicurezza preventiva

2. **Verificare salvataggio analisi in produzione**
   - **Azione:** Test manuale: apri analisi avanzata, verifica in Supabase che righe siano create
   - **File:** `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts`
   - **Rischio:** Dati non salvati = analisi sempre ricalcolate (performance)

---

### ⚠️ **PRIORITÀ ALTA**

3. **Aggiungere validazione parametri numerici**
   - **Azione:** Validare `matchId` e `playerId` come numeri validi in tutte le route
   - **File:** Varie route API
   - **Rischio:** Errori silenziosi con parametri invalidi

4. **Migliorare gestione errori OpenDota**
   - **Azione:** Distinguere tra "player non trovato", "match non trovato", "timeout"
   - **File:** `src/app/api/matches/detail/route.ts`, `src/app/api/dota/.../analysis/route.ts`
   - **Rischio:** UX confusa con errori generici

5. **Documentare colonne non popolate**
   - **Azione:** Aggiungere commenti/TODO per `pos_x`, `pos_y` in `dota_player_death_events`
   - **File:** `src/app/api/dota/.../analysis/route.ts`
   - **Rischio:** Confusione su feature incomplete

---

### 📋 **PRIORITÀ MEDIA**

6. **Rimuovere o documentare `/api/sync/recent-matches`**
   - **Azione:** Decidere se rimuovere o documentare esplicitamente come "deprecated"
   - **File:** `src/app/api/sync/recent-matches/route.ts`

7. **Aggiungere test automatici base**
   - **Azione:** Implementare scheletro test per API analysis e tasks
   - **File:** Nuovo `test/` directory

8. **Verificare popolamento colonne `matches_digest`**
   - **Azione:** Controllare se `role_position`, `gold_per_min`, ecc. sono popolate da sync
   - **File:** `src/app/api/fzth/sync-player/route.ts` (se ancora usato)

---

## 7. NOTE FINALI

### Punti di Forza
- ✅ Client admin usato correttamente per tabelle protette da RLS
- ✅ Gestione errori presente nella maggior parte delle route
- ✅ Fallback a Supabase quando OpenDota fallisce
- ✅ Empty state gestiti in UI

### Aree di Miglioramento
- ⚠️ RLS su `dota_tasks` non verificato
- ⚠️ Validazione parametri incompleta
- ⚠️ Alcune colonne database non verificate se popolate
- ⚠️ Test automatici mancanti

### Raccomandazioni
1. **Immediato:** Verificare RLS `dota_tasks` e fixare se necessario
2. **Breve termine:** Aggiungere validazione parametri e test base
3. **Lungo termine:** Implementare test E2E con Playwright per flussi critici

---

**Fine Report**

