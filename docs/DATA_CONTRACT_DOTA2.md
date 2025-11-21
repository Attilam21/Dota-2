# CONTRATTO DATI - TABELLE DOTA 2

**Data:** 2025-12-01  
**Versione:** 1.0  
**Scopo:** Documentazione contrattuale completa delle tabelle Dota 2 con mapping dati, stato implementazione, e regole di valorizzazione

---

## 1. `matches_digest`

**Descrizione:** Tabella principale per il digest delle partite Dota 2. Contiene dati aggregati per ogni match+player.

**Migrazioni:** `0001_create_matches_digest.sql`, `20251201_create_dota_analysis_tables.sql` (estensioni)

### 1.1 Colonne Base (0001_create_matches_digest.sql)

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `id` | `uuid` | Identificatore univoco interno | Generato (gen_random_uuid) | OBBLIGATORIO | ✅ Valorizzato |
| `player_account_id` | `bigint` | Account ID Dota 2 (Steam32) | OpenDota `players[].account_id` | OBBLIGATORIO | ✅ Valorizzato |
| `match_id` | `bigint` | OpenDota match ID | OpenDota `match_id` | OBBLIGATORIO | ✅ Valorizzato |
| `hero_id` | `integer` | Hero ID Dota 2 | OpenDota `players[].hero_id` | OBBLIGATORIO | ✅ Valorizzato |
| `kills` | `integer` | Numero di kill del player | OpenDota `players[].kills` | OBBLIGATORIO | ✅ Valorizzato |
| `deaths` | `integer` | Numero di morti del player | OpenDota `players[].deaths` | OBBLIGATORIO | ✅ Valorizzato |
| `assists` | `integer` | Numero di assist del player | OpenDota `players[].assists` | OBBLIGATORIO | ✅ Valorizzato |
| `duration_seconds` | `integer` | Durata partita in secondi | OpenDota `duration` | OBBLIGATORIO | ✅ Valorizzato |
| `start_time` | `timestamptz` | Timestamp inizio partita (UTC) | OpenDota `start_time` (convertito) | OBBLIGATORIO | ✅ Valorizzato |
| `result` | `text` | Risultato: 'win' o 'lose' | Calcolato da `radiant_win` + `player_slot` | OBBLIGATORIO | ✅ Valorizzato |
| `lane` | `text` | Corsia giocata (es. "safe", "mid", "off") | OpenDota `players[].lane` | OPZIONALE | ⚠️ **SEMPRE NULL** |
| `role` | `text` | Ruolo testuale (es. "core", "support") | OpenDota `players[].role` | OPZIONALE | ⚠️ **SEMPRE NULL** |
| `kda` | `numeric` | KDA calcolato: (kills + assists) / max(1, deaths) | Calcolato | OPZIONALE | ⚠️ **SEMPRE NULL** |
| `created_at` | `timestamptz` | Timestamp creazione record | Default NOW() | OBBLIGATORIO | ✅ Valorizzato |
| `updated_at` | `timestamptz` | Timestamp ultimo aggiornamento | Default NOW() | OBBLIGATORIO | ✅ Valorizzato |

**Note colonne NULL:**
- `lane`: OpenDota fornisce `players[].lane` (0-4), ma non mappato nel codice
- `role`: OpenDota fornisce `players[].role` (0-4), ma non mappato nel codice
- `kda`: Calcolo presente in `opendotaAdapter` ma non salvato in `matches_digest`

**Proposte valorizzazione:**
- `lane`: Mappare da OpenDota `players[].lane` (0=safe, 1=mid, 2=off, 3=jungle, 4=roaming) → testo
- `role`: Mappare da OpenDota `players[].role` (0=safe, 1=mid, 2=off, 3=jungle, 4=roaming) → testo
- `kda`: Calcolare e salvare: `(kills + assists) / Math.max(1, deaths)`

---

### 1.2 Colonne Estese (20251201_create_dota_analysis_tables.sql)

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `role_position` | `integer` | Posizione ruolo Dota 2 (1-5): 1=Safe, 2=Mid, 3=Off, 4=Soft Support, 5=Hard Support | Calcolato da OpenDota `players[].role` | OPZIONALE | ⚠️ **SEMPRE NULL** |
| `gold_per_min` | `integer` | Gold per minuto (GPM) | OpenDota `players[].gold_per_min` | OPZIONALE | ⚠️ **SEMPRE NULL** |
| `xp_per_min` | `integer` | Experience per minuto (XPM) | OpenDota `players[].xp_per_min` | OPZIONALE | ⚠️ **SEMPRE NULL** |
| `last_hits` | `integer` | Numero di last hits | OpenDota `players[].last_hits` | OPZIONALE | ⚠️ **SEMPRE NULL** |
| `denies` | `integer` | Numero di denies | OpenDota `players[].denies` | OPZIONALE | ⚠️ **SEMPRE NULL** |

**Note colonne NULL:**
- Tutte le colonne estese sono sempre NULL perché:
  - `sync-player` route è disabilitata (non popola più `matches_digest`)
  - Dashboard legge direttamente da OpenDota via `opendotaAdapter`
  - Le colonne sono state aggiunte ma non c'è codice che le popola

**Proposte valorizzazione:**
- `role_position`: Mappare da OpenDota `players[].role` (0→1, 1→2, 2→3, 4→4, default→1)
- `gold_per_min`: Mappare direttamente da OpenDota `players[].gold_per_min`
- `xp_per_min`: Mappare direttamente da OpenDota `players[].xp_per_min`
- `last_hits`: Mappare direttamente da OpenDota `players[].last_hits`
- `denies`: Mappare direttamente da OpenDota `players[].denies`

**Nota:** Se `sync-player` viene riabilitato, queste colonne dovrebbero essere popolate durante la sincronizzazione.

---

## 2. `dota_player_match_analysis`

**Descrizione:** Tabella di sintesi per analisi avanzata match+player. Una riga per ogni match+player con distribuzione kill/death per fase, costo morti, e death by role.

**Migrazione:** `20251201_create_dota_analysis_tables.sql`

### 2.1 Colonne Identificative

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `id` | `uuid` | Identificatore univoco interno | Generato (gen_random_uuid) | OBBLIGATORIO | ✅ Valorizzato |
| `match_id` | `bigint` | OpenDota match ID | Parametro route API | OBBLIGATORIO | ✅ Valorizzato |
| `account_id` | `bigint` | Account ID Dota 2 (Steam32) | Parametro route API | OBBLIGATORIO | ✅ Valorizzato |
| `role_position` | `integer` | Posizione ruolo (1-5) | Calcolato da OpenDota `players[].role` | OBBLIGATORIO | ✅ Valorizzato |

**Mapping `role_position`:**
- OpenDota `players[].role`: 0 → Pos 1, 1 → Pos 2, 2 → Pos 3, 4 → Pos 4, default → Pos 1

---

### 2.2 Colonne Kill Distribution

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `kills_early` | `integer` | Numero kill in early game (0-10 min) | Calcolato da OpenDota `players[].kills_log[]` | OBBLIGATORIO | ✅ Valorizzato |
| `kills_mid` | `integer` | Numero kill in mid game (10-30 min) | Calcolato da OpenDota `players[].kills_log[]` | OBBLIGATORIO | ✅ Valorizzato |
| `kills_late` | `integer` | Numero kill in late game (30+ min) | Calcolato da OpenDota `players[].kills_log[]` | OBBLIGATORIO | ✅ Valorizzato |
| `kill_pct_early` | `numeric` | Percentuale kill early (0-100) | Calcolato: `(kills_early / total_kills) * 100` | OBBLIGATORIO | ✅ Valorizzato |
| `kill_pct_mid` | `numeric` | Percentuale kill mid (0-100) | Calcolato: `(kills_mid / total_kills) * 100` | OBBLIGATORIO | ✅ Valorizzato |
| `kill_pct_late` | `numeric` | Percentuale kill late (0-100) | Calcolato: `(kills_late / total_kills) * 100` | OBBLIGATORIO | ✅ Valorizzato |

**Logica calcolo:**
- Fase determinata da `getGamePhase(timeSeconds)`: early ≤600s, mid ≤1800s, late >1800s
- Percentuali calcolate solo se `total_kills > 0`, altrimenti 0

---

### 2.3 Colonne Death Distribution

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `deaths_early` | `integer` | Numero morti in early game (0-10 min) | Calcolato da OpenDota `players[].deaths_log[]` | OBBLIGATORIO | ✅ Valorizzato |
| `deaths_mid` | `integer` | Numero morti in mid game (10-30 min) | Calcolato da OpenDota `players[].deaths_log[]` | OBBLIGATORIO | ✅ Valorizzato |
| `deaths_late` | `integer` | Numero morti in late game (30+ min) | Calcolato da OpenDota `players[].deaths_log[]` | OBBLIGATORIO | ✅ Valorizzato |
| `death_pct_early` | `numeric` | Percentuale morti early (0-100) | Calcolato: `(deaths_early / total_deaths) * 100` | OBBLIGATORIO | ✅ Valorizzato |
| `death_pct_mid` | `numeric` | Percentuale morti mid (0-100) | Calcolato: `(deaths_mid / total_deaths) * 100` | OBBLIGATORIO | ✅ Valorizzato |
| `death_pct_late` | `numeric` | Percentuale morti late (0-100) | Calcolato: `(deaths_late / total_deaths) * 100` | OBBLIGATORIO | ✅ Valorizzato |

**Logica calcolo:**
- Stessa logica di fase di `kills_*`
- Percentuali calcolate solo se `total_deaths > 0`, altrimenti 0

---

### 2.4 Colonne Death Cost Summary

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `total_gold_lost` | `integer` | Totale gold perso per tutte le morti | Somma di `dota_player_death_events.gold_lost` | OBBLIGATORIO | ✅ Valorizzato |
| `total_xp_lost` | `integer` | Totale XP perso per tutte le morti | Somma di `dota_player_death_events.xp_lost` | OBBLIGATORIO | ✅ Valorizzato |
| `total_cs_lost` | `integer` | Totale CS perso per tutte le morti | Somma di `dota_player_death_events.cs_lost` | OBBLIGATORIO | ✅ Valorizzato |

**Logica calcolo:**
- Per ogni morte in `deaths_log[]`:
  - `downtime_seconds = calculateRespawnTime(level_at_death)` (5 + level * 2)
  - `gold_lost = (downtime_seconds * gpm) / 60`
  - `xp_lost = (downtime_seconds * xpm) / 60`
  - `cs_lost = (downtime_seconds * cs_per_min) / 60`
- `total_*_lost` = somma di tutti gli eventi

---

### 2.5 Colonne Death by Role

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `death_pct_pos1` | `numeric` | % morti causate da Pos1 (Safe Lane Carry) | Calcolato da `deaths_log[].by.hero_id` + ruolo killer | OBBLIGATORIO | ✅ Valorizzato (parziale) |
| `death_pct_pos2` | `numeric` | % morti causate da Pos2 (Mid) | Calcolato da `deaths_log[].by.hero_id` + ruolo killer | OBBLIGATORIO | ✅ Valorizzato (parziale) |
| `death_pct_pos3` | `numeric` | % morti causate da Pos3 (Offlane) | Calcolato da `deaths_log[].by.hero_id` + ruolo killer | OBBLIGATORIO | ✅ Valorizzato (parziale) |
| `death_pct_pos4` | `numeric` | % morti causate da Pos4 (Soft Support) | Calcolato da `deaths_log[].by.hero_id` + ruolo killer | OBBLIGATORIO | ✅ Valorizzato (parziale) |
| `death_pct_pos5` | `numeric` | % morti causate da Pos5 (Hard Support) | Calcolato da `deaths_log[].by.hero_id` + ruolo killer | OBBLIGATORIO | ✅ Valorizzato (parziale) |

**Logica calcolo:**
- Se `deaths_log[].by.hero_id` esiste:
  - Trova player con quel `hero_id` nel match
  - Estrai `role` di quel player
  - Mappa ruolo → `killer_role_position` (1-5)
  - Incrementa contatore per quella posizione
- Percentuale: `(deaths_by_posX / total_deaths) * 100`

**Limitazioni attuali:**
- ⚠️ Funziona solo se OpenDota fornisce `deaths_log[].by.hero_id`
- ⚠️ Se `by.hero_id` manca, `killer_role_position` è NULL e la morte non conta per nessuna posizione
- ⚠️ Mapping ruolo killer può essere impreciso (stesso mapping semplificato usato per player)

---

### 2.6 Colonne Extra

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `analysis_extra` | `jsonb` | Dati extra analisi (heatmap, metriche aggiuntive) | Calcolato/esteso | OPZIONALE | ⚠️ **SEMPRE {}** |
| `created_at` | `timestamptz` | Timestamp creazione record | Default NOW() | OBBLIGATORIO | ✅ Valorizzato |
| `updated_at` | `timestamptz` | Timestamp ultimo aggiornamento | Trigger automatico | OBBLIGATORIO | ✅ Valorizzato |

**Note `analysis_extra`:**
- Attualmente sempre `{}` (oggetto vuoto)
- Proposto per future estensioni: heatmap data, metriche avanzate, analisi timeline

**Proposte valorizzazione:**
- Heatmap: Se OpenDota fornisce posizioni morte, salvare array `[{time, x, y}]`
- Metriche avanzate: KDA per fase, spike di performance, ecc.

---

## 3. `dota_player_death_events`

**Descrizione:** Tabella dettagliata per ogni singolo evento di morte del player in un match. Una riga per ogni morte.

**Migrazione:** `20251201_create_dota_analysis_tables.sql`

### 3.1 Colonne Identificative

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `id` | `uuid` | Identificatore univoco interno | Generato (gen_random_uuid) | OBBLIGATORIO | ✅ Valorizzato |
| `match_id` | `bigint` | OpenDota match ID | Parametro route API | OBBLIGATORIO | ✅ Valorizzato |
| `account_id` | `bigint` | Account ID Dota 2 (Steam32) | Parametro route API | OBBLIGATORIO | ✅ Valorizzato |
| `time_seconds` | `integer` | Secondo di morte nel match (0 = inizio) | OpenDota `deaths_log[].time` | OBBLIGATORIO | ✅ Valorizzato |
| `phase` | `text` | Fase gioco: 'early', 'mid', 'late' | Calcolato da `time_seconds` via `getGamePhase()` | OBBLIGATORIO | ✅ Valorizzato |

---

### 3.2 Colonne Death Details

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `level_at_death` | `integer` | Livello player al momento della morte (1-30) | Stimato: `Math.floor((time / duration) * 30)` | OBBLIGATORIO | ✅ Valorizzato (stimato) |
| `downtime_seconds` | `integer` | Tempo di respawn stimato in secondi | Calcolato: `5 + level_at_death * 2` | OBBLIGATORIO | ✅ Valorizzato |

**Note `level_at_death`:**
- ⚠️ **STIMATO**: Non usa dati reali di OpenDota (se disponibili)
- Logica attuale: progressione lineare da 1 a 30 basata su `time / duration`
- **Miglioramento proposto:** Usare `players[].xp_t` (timeline XP) se disponibile per livello reale

**Note `downtime_seconds`:**
- Formula semplificata: base 5s + 2s per livello
- Formula reale Dota 2 è più complessa (dipende anche da buyback, ecc.)

---

### 3.3 Colonne Death Cost

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `gold_lost` | `integer` | Gold perso durante downtime | Calcolato: `(downtime_seconds * gpm) / 60` | OBBLIGATORIO | ✅ Valorizzato |
| `xp_lost` | `integer` | XP perso durante downtime | Calcolato: `(downtime_seconds * xpm) / 60` | OBBLIGATORIO | ✅ Valorizzato |
| `cs_lost` | `integer` | CS perso durante downtime | Calcolato: `(downtime_seconds * cs_per_min) / 60` | OBBLIGATORIO | ✅ Valorizzato |

**Logica calcolo:**
- `gpm`, `xpm` da OpenDota `players[].gold_per_min`, `xp_per_min`
- `cs_per_min` calcolato: `last_hits / (duration_minutes)`
- Costo = tasso al minuto * (downtime in minuti)

---

### 3.4 Colonne Killer Information

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `killer_hero_id` | `integer` | Hero ID del killer | OpenDota `deaths_log[].by.hero_id` | OPZIONALE | ✅ Valorizzato (se disponibile) |
| `killer_role_position` | `integer` | Posizione ruolo killer (1-5) | Calcolato da ruolo player con `killer_hero_id` | OPZIONALE | ✅ Valorizzato (se disponibile) |

**Logica:**
- Se `deaths_log[].by.hero_id` esiste:
  - Trova player nel match con quel `hero_id`
  - Estrai `role` di quel player
  - Mappa a `killer_role_position` (1-5)
- Se `by.hero_id` manca → entrambi NULL

**Limitazioni:**
- ⚠️ Dipende da disponibilità `deaths_log[].by.hero_id` in OpenDota
- ⚠️ Mapping ruolo può essere impreciso (stesso problema di `death_pct_pos*`)

---

### 3.5 Colonne Position (Heatmap)

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `pos_x` | `numeric` | Coordinata X sulla mappa alla morte | OpenDota (se disponibile) | OPZIONALE | ⚠️ **SEMPRE NULL** |
| `pos_y` | `numeric` | Coordinata Y sulla mappa alla morte | OpenDota (se disponibile) | OPZIONALE | ⚠️ **SEMPRE NULL** |
| `created_at` | `timestamptz` | Timestamp creazione record | Default NOW() | OBBLIGATORIO | ✅ Valorizzato |

**Note `pos_x`, `pos_y`:**
- ⚠️ **NON IMPLEMENTATO**: Sempre NULL
- OpenDota non fornisce direttamente coordinate morte in `deaths_log`
- Potrebbe essere disponibile in endpoint avanzati o timeline dettagliata

**Proposte valorizzazione:**
- **Opzione 1:** Usare endpoint OpenDota `/matches/{match_id}/timeline` se disponibile
- **Opzione 2:** Estrarre da replay parsing (complessità alta)
- **Opzione 3:** Nota "non utilizzata, implementazione futura" - rimuovere colonne se non pianificato

---

## 4. `dota_tasks`

**Descrizione:** Tabella per i Task di coaching Dota 2 generati automaticamente dai KPI.

**Migrazione:** `20251125_create_dota_tasks.sql`

### 4.1 Colonne Identificative

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `id` | `uuid` | Identificatore univoco interno | Generato (gen_random_uuid) | OBBLIGATORIO | ✅ Valorizzato |
| `player_id` | `text` | Account ID Dota 2 (Steam32) come testo | Parametro API `playerId` | OBBLIGATORIO | ✅ Valorizzato |
| `type` | `text` | Tipo task (es. "REDUCE_EARLY_DEATHS", "INCREASE_KP") | Da `DotaTaskType` enum | OBBLIGATORIO | ✅ Valorizzato |
| `title` | `text` | Titolo task (es. "Riduci le morti early game") | Da `TASK_DEFINITIONS[type].title` | OBBLIGATORIO | ✅ Valorizzato |
| `description` | `text` | Descrizione dettagliata task | Da `TASK_DEFINITIONS[type].description` | OBBLIGATORIO | ✅ Valorizzato |

---

### 4.2 Colonne Status

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `status` | `text` | Stato: 'open', 'completed', 'failed' | Calcolato da `evaluateTaskStatus()` | OBBLIGATORIO | ✅ Valorizzato |
| `created_at` | `timestamptz` | Timestamp creazione task | Default NOW() | OBBLIGATORIO | ✅ Valorizzato |
| `updated_at` | `timestamptz` | Timestamp ultimo aggiornamento | Trigger automatico | OBBLIGATORIO | ✅ Valorizzato |
| `resolved_at` | `timestamptz` | Timestamp risoluzione (completato/fallito) | Impostato quando status cambia | OPZIONALE | ✅ Valorizzato (se status != 'open') |

**Logica status:**
- `open`: Task appena creato o ancora in corso
- `completed`: KPI attuali soddisfano condizioni target
- `failed`: KPI attuali peggiorati rispetto a originali (es. early deaths aumentate)

---

### 4.3 Colonne KPI Payload

| Colonna | Tipo | Descrizione | Sorgente Dato | Stato | Valorizzazione |
|---------|------|-------------|---------------|-------|----------------|
| `kpi_payload` | `jsonb` | Snapshot KPI al momento creazione task | Da `TaskEvaluationKPIs` (overview, momentum, heroPool, styleOfPlay) | OBBLIGATORIO | ✅ Valorizzato |
| `params` | `jsonb` | Parametri task (soglie, target) | Da `TASK_DEFINITIONS[type].suggestedThresholds` | OBBLIGATORIO | ✅ Valorizzato |

**Struttura `kpi_payload`:**
```json
{
  "earlyDeathsAvg": 4.2,
  "fightParticipation": 65.5,
  "winrateRecent": 45.0,
  ...
}
```

**Struttura `params`:**
```json
{
  "earlyDeathsAvg": 1.5,
  "winrateRecent": 50.0,
  ...
}
```

**Logica:**
- `kpi_payload`: Valori KPI al momento della creazione (baseline)
- `params`: Target/soglie da raggiungere per completare il task
- Usati da `evaluateTaskStatus()` per confrontare KPI attuali vs baseline vs target

---

## 5. RIEPILOGO STATO IMPLEMENTAZIONE

### 5.1 Colonne Sempre Valorizzate ✅

**matches_digest:**
- Tutte le colonne base (id, player_account_id, match_id, hero_id, kills, deaths, assists, duration_seconds, start_time, result, created_at, updated_at)

**dota_player_match_analysis:**
- Tutte le colonne tranne `analysis_extra` (sempre {})

**dota_player_death_events:**
- Tutte le colonne tranne `pos_x`, `pos_y` (sempre NULL)

**dota_tasks:**
- Tutte le colonne valorizzate correttamente

---

### 5.2 Colonne Sempre NULL ⚠️

**matches_digest:**
- `lane` (text) - OpenDota fornisce ma non mappato
- `role` (text) - OpenDota fornisce ma non mappato
- `kda` (numeric) - Calcolabile ma non salvato
- `role_position` (integer) - Aggiunta ma non popolata
- `gold_per_min` (integer) - Aggiunta ma non popolata
- `xp_per_min` (integer) - Aggiunta ma non popolata
- `last_hits` (integer) - Aggiunta ma non popolata
- `denies` (integer) - Aggiunta ma non popolata

**dota_player_death_events:**
- `pos_x` (numeric) - Non disponibile da OpenDota standard
- `pos_y` (numeric) - Non disponibile da OpenDota standard

**dota_player_match_analysis:**
- `analysis_extra` (jsonb) - Sempre `{}`, riservato per future estensioni

---

### 5.3 Colonne Parzialmente Valorizzate ⚠️

**dota_player_match_analysis:**
- `death_pct_pos1..pos5` - Valorizzate solo se OpenDota fornisce `deaths_log[].by.hero_id`

**dota_player_death_events:**
- `killer_hero_id` - Valorizzato solo se OpenDota fornisce `deaths_log[].by.hero_id`
- `killer_role_position` - Valorizzato solo se `killer_hero_id` è disponibile

---

## 6. RACCOMANDAZIONI

### 6.1 Colonne da Valorizzare (Priorità Alta)

1. **matches_digest.kda**
   - **Azione:** Calcolare e salvare durante sync/import
   - **Formula:** `(kills + assists) / Math.max(1, deaths)`
   - **Beneficio:** Evita ricalcolo in query

2. **matches_digest.role_position**
   - **Azione:** Mappare da OpenDota `players[].role` durante sync
   - **Beneficio:** Consistenza con `dota_player_match_analysis.role_position`

3. **matches_digest.gold_per_min, xp_per_min, last_hits, denies**
   - **Azione:** Popolare durante sync se route riabilitata
   - **Beneficio:** Dati disponibili senza chiamare OpenDota

### 6.2 Colonne da Documentare o Rimuovere (Priorità Media)

1. **matches_digest.lane, role**
   - **Azione:** Decidere se mappare da OpenDota o rimuovere
   - **Nota:** `role_position` è più preciso (1-5 vs testo)

2. **dota_player_death_events.pos_x, pos_y**
   - **Azione:** Documentare come "non utilizzata, implementazione futura" o rimuovere
   - **Nota:** Richiede endpoint avanzati OpenDota o replay parsing

### 6.3 Colonne da Migliorare (Priorità Bassa)

1. **dota_player_death_events.level_at_death**
   - **Azione:** Usare timeline XP reale se disponibile da OpenDota
   - **Nota:** Attualmente stimato linearmente

2. **dota_player_death_events.downtime_seconds**
   - **Azione:** Usare formula Dota 2 reale (più complessa)
   - **Nota:** Attualmente formula semplificata

---

## 7. MAPPING OPENDOTA → TABELLE

### 7.1 Endpoint OpenDota Utilizzati

**`/matches/{match_id}`:**
- `match_id` → `matches_digest.match_id`, `dota_player_match_analysis.match_id`
- `duration` → `matches_digest.duration_seconds`
- `start_time` → `matches_digest.start_time`
- `radiant_win` → `matches_digest.result` (calcolato)
- `players[]` → varie colonne

**`players[].*`:**
- `account_id` → `matches_digest.player_account_id`, `dota_player_match_analysis.account_id`
- `hero_id` → `matches_digest.hero_id`
- `kills` → `matches_digest.kills`
- `deaths` → `matches_digest.deaths`
- `assists` → `matches_digest.assists`
- `gold_per_min` → `matches_digest.gold_per_min` (non popolato)
- `xp_per_min` → `matches_digest.xp_per_min` (non popolato)
- `last_hits` → `matches_digest.last_hits` (non popolato)
- `denies` → `matches_digest.denies` (non popolato)
- `role` → `matches_digest.role_position` (non popolato), `dota_player_match_analysis.role_position`
- `lane` → `matches_digest.lane` (non popolato)
- `kills_log[]` → `dota_player_match_analysis.kills_early/mid/late`
- `deaths_log[]` → `dota_player_death_events.*`, `dota_player_match_analysis.deaths_early/mid/late`
- `deaths_log[].time` → `dota_player_death_events.time_seconds`
- `deaths_log[].by.hero_id` → `dota_player_death_events.killer_hero_id` (se disponibile)

---

## 8. VINCOLI E REGOLE

### 8.1 Unicità

- `matches_digest`: `UNIQUE (player_account_id, match_id)`
- `dota_player_match_analysis`: `UNIQUE (match_id, account_id)`
- `dota_player_death_events`: Nessun vincolo unico (multiple morti per match+player)
- `dota_tasks`: Nessun vincolo unico (multiple task per player)

### 8.2 Check Constraints

- `matches_digest.result`: `CHECK (result IN ('win', 'lose'))`
- `matches_digest.role_position`: `CHECK (role_position >= 1 AND role_position <= 5)`
- `dota_player_match_analysis.role_position`: `CHECK (role_position >= 1 AND role_position <= 5)`
- `dota_player_death_events.phase`: `CHECK (phase IN ('early', 'mid', 'late'))`
- `dota_player_death_events.level_at_death`: `CHECK (level_at_death >= 1 AND level_at_death <= 30)`
- `dota_tasks.status`: `CHECK (status IN ('open', 'completed', 'failed'))`

### 8.3 Default Values

- `matches_digest.created_at`, `updated_at`: `NOW()`
- `dota_player_match_analysis.created_at`, `updated_at`: `NOW()`
- `dota_player_death_events.created_at`: `NOW()`
- `dota_tasks.created_at`, `updated_at`: `NOW()`
- `dota_tasks.status`: `'open'`
- `dota_tasks.kpi_payload`, `params`: `'{}'::jsonb`

---

**Fine Contratto Dati**

