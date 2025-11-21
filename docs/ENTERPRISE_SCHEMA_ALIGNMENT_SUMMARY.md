# Enterprise Schema Alignment - Sintesi Modifiche

**Data:** 2025-01-21  
**Obiettivo:** Allineare schema Supabase Dota 2 alla spec OpenDota ufficiale senza cancellare dati esistenti

---

## 1. MODIFICHE SCHEMA (Migrazione SQL)

### 1.1 Tabelle Esistenti - Nessuna Modifica Strutturale
- ✅ `matches_digest` - Schema già allineato, solo aggiunta default values
- ✅ `dota_player_match_analysis` - Schema già allineato, solo aggiunta default values
- ✅ `dota_player_death_events` - Schema già allineato, solo aggiunta default values

### 1.2 Miglioramenti Schema
1. **Default Values per Campi Numerici:**
   - Tutti i campi `integer NOT NULL DEFAULT 0` ora hanno default esplicito
   - Previene NULL in campi obbligatori

2. **Indici Aggiuntivi:**
   - Indice composito su `(match_id, account_id, time_seconds)` per query death events
   - Indice su `phase` per filtri per fase

3. **Commenti Aggiornati:**
   - Documentazione chiara su campi opzionali vs obbligatori
   - Note su campi sempre NULL (pos_x, pos_y)

---

## 2. MODIFICHE ROUTE API

### 2.1 `/api/dota/matches/[matchId]/players/[accountId]/analysis`

**Problema Identificato:**
- ❌ Usa `deaths_log[]` che **NON è documentato** nello spec OpenAPI
- ⚠️ Se `deaths_log` non esiste, `dota_player_death_events` rimane vuoto

**Soluzione Implementata:**
1. **Fallback Strategy:**
   - Prima: Prova a usare `deaths_log[]` se disponibile (per retrocompatibilità)
   - Poi: Usa `killed_by` object (documentato) per ottenere killer info
   - Infine: Stima timing morti da `deaths` count e `duration` se necessario

2. **Logica Death Events:**
   - Se `deaths_log` esiste: usa come prima (timing preciso)
   - Se non esiste: crea eventi stimati basati su `deaths` count
   - Usa `killed_by` object per killer info quando disponibile

3. **Miglioramenti:**
   - Aggiunto campo `key` a `kills_log` (hero ID ucciso)
   - Migliorata gestione errori con logging dettagliato
   - Validazione campi prima di salvare in Supabase

---

## 3. SCRIPT REBUILD DATI

### 3.1 Route Admin: `/api/admin/dota/rebuild-analysis`

**Funzionalità:**
- Accetta lista di `matchId` + `accountId`
- Ricalcola analisi per ogni match+player
- Aggiorna tabelle Supabase con nuovi dati

**Sicurezza:**
- Richiede autenticazione admin (da implementare)
- Rate limiting per evitare overload OpenDota

### 3.2 Script Node: `scripts/rebuild-dota-analysis.ts`

**Funzionalità:**
- Legge match IDs da file CSV o array
- Processa in batch con delay tra richieste
- Log dettagliato di progresso ed errori

---

## 4. CHECKLIST TEST MANUALI

### 4.1 Test Creazione Analisi
- [ ] Aprire analisi avanzata per match con morti
- [ ] Verificare in Supabase che `dota_player_death_events` contenga righe
- [ ] Verificare che `dota_player_match_analysis` sia popolato
- [ ] Verificare che grafici dashboard mostrino dati (non zero)

### 4.2 Test Fallback `killed_by`
- [ ] Testare match dove `deaths_log` non esiste
- [ ] Verificare che eventi siano creati usando `killed_by`
- [ ] Verificare che `killer_hero_id` e `killer_role_position` siano popolati

### 3.3 Test RLS / Permessi
- [ ] Verificare che SELECT funzioni con anon key
- [ ] Verificare che INSERT/UPDATE funzionino solo con service_role
- [ ] Verificare che route analysis salvi correttamente

---

## 5. FILE MODIFICATI

1. ✅ `supabase/migrations/20251121_align_dota2_schema.sql` (NUOVO)
2. ✅ `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts` (MODIFICATO)
3. ✅ `src/app/api/admin/dota/rebuild-analysis/route.ts` (NUOVO)
4. ✅ `scripts/rebuild-dota-analysis.ts` (NUOVO)

---

## 6. NOTE IMPORTANTI

### 6.1 Comandi SQL NON Eseguiti (Solo Commenti)
Nel file migrazione sono presenti come commenti:
```sql
-- TRUNCATE TABLE public.dota_player_match_analysis;
-- TRUNCATE TABLE public.dota_player_death_events;
```

**Quando usarli:**
- Solo se si vuole **ricostruire completamente** i dati analitici
- Dopo aver verificato che lo script rebuild funziona correttamente
- **NON eseguire in produzione** senza backup

### 6.2 Compatibilità Retroattiva
- ✅ Dati esistenti rimangono intatti
- ✅ Nuove analisi usano logica migliorata
- ✅ Vecchie analisi possono essere ricostruite con script rebuild

---

**Fine Sintesi**

