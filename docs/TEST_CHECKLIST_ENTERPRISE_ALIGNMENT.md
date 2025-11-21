# Checklist Test - Enterprise Schema Alignment

**Data:** 2025-01-21  
**Obiettivo:** Validare allineamento schema Supabase e funzionalità route analysis

---

## 1. TEST CREAZIONE ANALISI

### 1.1 Test Analisi con `deaths_log` Disponibile
- [ ] Aprire analisi avanzata per match con morti: `/dota/matches/{matchId}/players/{accountId}`
- [ ] Verificare in Supabase che `dota_player_death_events` contenga righe
- [ ] Verificare che `dota_player_match_analysis` sia popolato
- [ ] Verificare che grafici dashboard mostrino dati (non zero)
- [ ] Verificare che `killer_hero_id` e `killer_role_position` siano popolati (se disponibili)

**Match di test suggerito:**
- Match ID: `7792959229`
- Account ID: `86745912`

**Query Supabase per verifica:**
```sql
SELECT COUNT(*) FROM dota_player_death_events 
WHERE match_id = 7792959229 AND account_id = 86745912;

SELECT * FROM dota_player_match_analysis 
WHERE match_id = 7792959229 AND account_id = 86745912;
```

---

### 1.2 Test Analisi con `deaths_log` NON Disponibile (Fallback)
- [ ] Trovare match dove `deaths_log` è vuoto ma player ha morti
- [ ] Aprire analisi avanzata per quel match
- [ ] Verificare che eventi siano creati usando fallback strategy (`killed_by`)
- [ ] Verificare che `killer_hero_id` sia popolato da `killed_by` object
- [ ] Verificare che timing morti sia stimato (non preciso ma presente)
- [ ] Verificare che grafici mostrino dati (anche se stimati)

**Query Supabase per verifica:**
```sql
SELECT 
  time_seconds, 
  killer_hero_id, 
  killer_role_position,
  phase
FROM dota_player_death_events 
WHERE match_id = {matchId} AND account_id = {accountId}
ORDER BY time_seconds;
```

---

## 2. TEST FALLBACK `killed_by`

### 2.1 Verifica Logica Fallback
- [ ] Aprire console browser durante analisi
- [ ] Verificare log: `"Using fallback strategy (killed_by + estimation)"`
- [ ] Verificare che numero eventi creati corrisponda a `player.deaths`
- [ ] Verificare che `deathsByRole` sia popolato correttamente

---

## 3. TEST RLS / PERMESSI

### 3.1 Test SELECT (Anon Key)
- [ ] Verificare che query SELECT funzioni con anon key
- [ ] Testare query da frontend React component
- [ ] Verificare che dati siano leggibili senza errori

**Query test:**
```sql
-- Eseguita con anon key (dovrebbe funzionare)
SELECT * FROM dota_player_match_analysis LIMIT 10;
SELECT * FROM dota_player_death_events LIMIT 10;
```

---

### 3.2 Test INSERT/UPDATE (Service Role)
- [ ] Verificare che route analysis salvi correttamente
- [ ] Verificare che INSERT funzioni solo con service_role
- [ ] Verificare che UPDATE funzioni solo con service_role

**Test manuale:**
- Aprire analisi avanzata per match nuovo
- Verificare in Supabase che righe siano create
- Verificare che non ci siano errori in console

---

## 4. TEST SCRIPT REBUILD

### 4.1 Test Route Admin Rebuild
- [ ] Chiamare `POST /api/admin/dota/rebuild-analysis` con lista match
- [ ] Verificare che analisi vengano ricalcolate
- [ ] Verificare che tabelle Supabase siano aggiornate
- [ ] Verificare che errori siano gestiti correttamente

**Request di test:**
```json
{
  "matches": [
    { "matchId": 7792959229, "accountId": 86745912 },
    { "matchId": 7792959230, "accountId": 86745912 }
  ]
}
```

---

### 4.2 Test Script Node Rebuild
- [ ] Creare file JSON con lista match
- [ ] Eseguire: `pnpm tsx scripts/rebuild-dota-analysis.ts matches.json`
- [ ] Verificare che script processi tutti i match
- [ ] Verificare che log mostri progresso ed errori

---

## 5. TEST VALIDAZIONE DATI

### 5.1 Verifica Campi Obbligatori
- [ ] Verificare che `dota_player_match_analysis.role_position` non sia NULL
- [ ] Verificare che `dota_player_death_events.time_seconds` non sia NULL
- [ ] Verificare che `dota_player_death_events.phase` non sia NULL
- [ ] Verificare che campi numerici abbiano default 0 (non NULL)

**Query verifica:**
```sql
-- Verificare che non ci siano NULL in campi obbligatori
SELECT COUNT(*) FROM dota_player_match_analysis 
WHERE role_position IS NULL;

SELECT COUNT(*) FROM dota_player_death_events 
WHERE time_seconds IS NULL OR phase IS NULL;
```

---

### 5.2 Verifica Campi Opzionali
- [ ] Verificare che `killer_hero_id` possa essere NULL (OK se non disponibile)
- [ ] Verificare che `pos_x`, `pos_y` siano sempre NULL (come documentato)
- [ ] Verificare che `analysis_extra` sia `{}` (oggetto vuoto)

---

## 6. TEST PERFORMANCE

### 6.1 Test Analisi Match Grande
- [ ] Aprire analisi per match con molte morti (>10)
- [ ] Verificare che risposta arrivi in <5 secondi
- [ ] Verificare che Supabase INSERT sia efficiente

---

### 6.2 Test Rebuild Batch
- [ ] Eseguire rebuild per 10+ match
- [ ] Verificare che rate limiting funzioni (delay tra richieste)
- [ ] Verificare che non ci siano errori di timeout

---

## 7. TEST GRAFICI DASHBOARD

### 7.1 Verifica Grafici Non Zero
- [ ] Aprire dashboard dopo analisi
- [ ] Verificare che grafici "Death Distribution" mostrino dati
- [ ] Verificare che grafici "Death by Role" mostrino dati
- [ ] Verificare che "Death Cost" mostri valori > 0 (se ci sono morti)

---

### 7.2 Verifica Grafici con Dati Stimati
- [ ] Aprire match con fallback strategy (deaths_log vuoto)
- [ ] Verificare che grafici mostrino dati anche se stimati
- [ ] Verificare che UI mostri warning se dati sono stimati (se implementato)

---

## 8. TEST ERROR HANDLING

### 8.1 Test Match Non Esistente
- [ ] Aprire analisi per match ID inesistente
- [ ] Verificare che errore sia gestito correttamente
- [ ] Verificare che UI mostri messaggio errore chiaro

---

### 8.2 Test Player Non nel Match
- [ ] Aprire analisi per account ID non presente nel match
- [ ] Verificare che errore sia gestito correttamente
- [ ] Verificare che UI mostri messaggio errore chiaro

---

## 9. TEST MIGRAZIONE SQL

### 9.1 Verifica Schema Dopo Migrazione
- [ ] Eseguire migrazione: `supabase/migrations/20251121_align_dota2_schema.sql`
- [ ] Verificare che indici siano creati
- [ ] Verificare che commenti siano aggiornati
- [ ] Verificare che colonna `killed_by_raw` sia aggiunta (se implementata)

**Query verifica:**
```sql
-- Verificare indici
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('matches_digest', 'dota_player_match_analysis', 'dota_player_death_events')
ORDER BY tablename, indexname;

-- Verificare colonne
SELECT column_name, data_type, column_default 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'dota_player_match_analysis'
  AND column_name = 'killed_by_raw';
```

---

## 10. TEST RETROCOMPATIBILITÀ

### 10.1 Verifica Dati Esistenti
- [ ] Verificare che analisi esistenti continuino a funzionare
- [ ] Verificare che query esistenti non rompano
- [ ] Verificare che UI non mostri errori con dati vecchi

---

## RISULTATI ATTESI

### ✅ Successo Completo
- Tutti i test sopra passano
- Nessun errore in console
- Dati popolati correttamente in Supabase
- Grafici dashboard funzionanti

### ⚠️ Problemi Noti (Accettabili)
- `pos_x`, `pos_y` sempre NULL (come documentato)
- Timing morti stimato quando `deaths_log` non disponibile
- `killer_role_position` può essere NULL se ruolo non determinabile

---

**Fine Checklist**

