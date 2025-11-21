# OpenDota Data Capability Audit - Enterprise Report

**Data di generazione:** 2025-01-21  
**Versione OpenDota API:** 28.0.0  
**Analisi basata su:** https://api.opendota.com/api (OpenAPI 3.0.3)

---

## Executive Summary

Questo documento fornisce una mappatura completa delle capacità dati dell'API OpenDota, confrontata con l'implementazione attuale del progetto FZTH Dota 2 Dashboard. L'obiettivo è identificare:

- **Cosa è disponibile** ufficialmente nelle API
- **Cosa stiamo usando** nel nostro codice
- **Cosa manca** o è non documentato
- **Cosa possiamo integrare** subito vs. cosa richiede match parsed

**Risultato chiave:** Il campo `deaths_log` utilizzato nel nostro codice **NON è documentato** nello spec OpenAPI ufficiale, mentre `kills_log` è presente ma con struttura diversa (`key` invece di `hero_id`).

---

## 1. DATA INVENTORY COMPLETO (Full Data Map)

### 1.1 Categorizzazione Endpoint

#### **Players** (16 endpoint)
| Endpoint | Metodo | Descrizione | Campi Principali |
|----------|--------|-------------|------------------|
| `/players/{account_id}` | GET | Player data | `rank_tier`, `leaderboard_rank`, `computed_mmr`, `profile` |
| `/players/{account_id}/wl` | GET | Win/Loss count | `win`, `lose` |
| `/players/{account_id}/recentMatches` | GET | Recent matches (limited) | Array di `PlayerRecentMatchesResponse` |
| `/players/{account_id}/matches` | GET | Full match history | Array di `PlayerMatchesResponse` |
| `/players/{account_id}/heroes` | GET | Heroes played | `hero_id`, `games`, `win`, `with_games`, `against_games` |
| `/players/{account_id}/peers` | GET | Players played with | `account_id`, `games`, `win`, `with_gpm_sum`, `with_xpm_sum` |
| `/players/{account_id}/pros` | GET | Pro players played with | Simile a peers ma per pro players |
| `/players/{account_id}/totals` | GET | Totals in stats | `field`, `n`, `sum` |
| `/players/{account_id}/counts` | GET | Counts in categories | `leaver_status`, `game_mode`, `lobby_type`, `lane_role`, `region`, `patch` |
| `/players/{account_id}/histograms/{field}` | GET | Distribution of matches in a single stat | Array di oggetti |
| `/players/{account_id}/wardmap` | GET | Wards placed in matches | `obs`, `sen` (objects) |
| `/players/{account_id}/wordcloud` | GET | Words said/read in matches | `my_word_counts`, `all_word_counts` |
| `/players/{account_id}/ratings` | GET | Player rating history | `account_id`, `match_id`, `solo_competitive_rank`, `competitive_rank`, `time` |
| `/players/{account_id}/rankings` | GET | Player hero rankings | `hero_id`, `score`, `percent_rank`, `card` |
| `/players/{account_id}/refresh` | POST | Refresh player match history | N/A (action) |

**Utilizzati nel nostro codice:**
- ✅ `/players/{account_id}/recentMatches` (via `opendotaAdapter.getRecentMatches`)
- ✅ `/players/{account_id}/peers` (via `kpiService.getPeersKPI`)

**Non utilizzati ma disponibili:**
- `/players/{account_id}/matches` (full history con filtri avanzati)
- `/players/{account_id}/heroes` (aggregati per eroe)
- `/players/{account_id}/totals` (totali statistiche)
- `/players/{account_id}/wardmap` (mappa ward placement)

---

#### **Matches** (1 endpoint principale)
| Endpoint | Metodo | Descrizione | Campi Principali |
|----------|--------|-------------|------------------|
| `/matches/{match_id}` | GET | Match data completo | `MatchResponse` con array `players[]` |

**Struttura MatchResponse:**
- `match_id`, `duration`, `start_time`, `radiant_win`
- `radiant_gold_adv[]`, `radiant_xp_adv[]` (array per minuto)
- `players[]` (array di oggetti player con 100+ campi)
- `teamfights[]` (nullable, solo per match parsed)
- `objectives[]`, `picks_bans[]`, `chat[]`

**Utilizzato nel nostro codice:**
- ✅ `/matches/{match_id}` (via `opendotaAdapter.getMatchDetail` e route `/analysis`)

---

#### **Heroes** (6 endpoint)
| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/heroes` | GET | Get hero data |
| `/heroStats` | GET | Get stats about hero performance |
| `/heroes/{hero_id}/matches` | GET | Get recent matches with a hero |
| `/heroes/{hero_id}/matchups` | GET | Get results against other heroes |
| `/heroes/{hero_id}/durations` | GET | Hero performance over match durations |
| `/heroes/{hero_id}/itemPopularity` | GET | Item popularity by game phase |

**Non utilizzati nel nostro codice** (potenziale integrazione futura)

---

#### **Benchmarks & Analytics** (4 endpoint)
| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/benchmarks` | GET | Benchmarks of average stat values for a hero |
| `/rankings` | GET | Top players by hero |
| `/scenarios/itemTimings` | GET | Win rates for item timings |
| `/scenarios/laneRoles` | GET | Win rates for heroes in lane roles |

---

#### **Pro Players & Teams** (8 endpoint)
| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/topPlayers` | GET | List of highly ranked players |
| `/proPlayers` | GET | List of pro players |
| `/proMatches` | GET | List of pro matches |
| `/teams` | GET | Team data |
| `/teams/{team_id}` | GET | Data for a team |
| `/teams/{team_id}/matches` | GET | Matches for a team |
| `/teams/{team_id}/players` | GET | Players who played for a team |
| `/teams/{team_id}/heroes` | GET | Heroes for a team |

---

#### **Metadata & Utilities** (7 endpoint)
| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/metadata` | GET | Site metadata |
| `/distributions` | GET | Distributions of MMR data |
| `/search` | GET | Search players by personaname |
| `/schema` | GET | Get database schema |
| `/constants/{resource}` | GET | Static game data (heroes, items, etc.) |
| `/health` | GET | Service health data |
| `/explorer` | GET | Submit arbitrary SQL queries |

---

#### **Parsed Matches & Request** (3 endpoint)
| Endpoint | Metodo | Descrizione | Note |
|----------|--------|-------------|------|
| `/parsedMatches` | GET | List of parsed match IDs | Solo match già parsati |
| `/request/{match_id}` | POST | Submit parse request | Richiede parsing (10 calls per rate limit) |
| `/request/{jobId}` | GET | Get parse request state | Verifica stato parsing |

**IMPORTANTE:** I match devono essere **parsati** per avere dati avanzati come `teamfights`, `deaths_log` completo, `position data`.

---

### 1.2 Struttura Dettagliata: MatchResponse.players[]

Lo spec OpenAPI definisce **100+ campi** per ogni player in un match. Ecco i campi rilevanti per la nostra analisi:

#### **Campi Base (Sempre Disponibili)**
| Campo | Tipo | Nullable | Descrizione |
|-------|------|----------|-------------|
| `account_id` | integer | No | Player account ID |
| `player_slot` | integer | Yes | Slot (0-127 Radiant, 128-255 Dire) |
| `hero_id` | integer | No | Hero ID |
| `kills` | integer | No | Number of kills |
| `deaths` | integer | No | Number of deaths |
| `assists` | integer | No | Number of assists |
| `last_hits` | integer | No | Number of last hits |
| `denies` | integer | No | Number of denies |
| `gold_per_min` | integer | No | Gold Per Minute |
| `xp_per_min` | integer | No | Experience Per Minute |
| `level` | integer | No | Level at end of game |
| `hero_damage` | integer | No | Hero Damage Dealt |
| `tower_damage` | integer | No | Total tower damage |
| `hero_healing` | integer | No | Hero Healing Done |
| `lane` | integer | Yes | Lane (1=safe, 2=mid, 3=off, 4=jungle) |
| `lane_role` | integer | Yes | Lane role (1=core, 2=support) |
| `is_roaming` | boolean | Yes | Whether player roamed |

#### **Campi Timeline (Sempre Disponibili)**
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `gold_t[]` | array<integer> | Total gold at each minute |
| `xp_t[]` | array<integer> | Experience at each minute |
| `lh_t[]` | array<integer> | Last hits at each minute |
| `dn_t[]` | array<integer> | Denies at each minute |

#### **Campi Log (Disponibili, Struttura Documentata)**
| Campo | Tipo | Struttura | Disponibilità |
|-------|------|-----------|---------------|
| `kills_log[]` | array | `{time: integer, key: string}` | ✅ Documentato nello spec |
| `buyback_log[]` | array | `{time: integer, slot: integer}` | ✅ Documentato |
| `purchase_log[]` | array | `{time: integer, key: string, charges: integer}` | ✅ Documentato |
| `runes_log[]` | array | `{time: integer, key: integer}` | ✅ Documentato |
| `obs_log[]` | array | Objects | ✅ Documentato |
| `sen_log[]` | array | Objects | ✅ Documentato |

#### **Campi Aggregati (Sempre Disponibili)**
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `killed_by` | object | Object containing information about who killed the player |
| `killed` | object | Object containing information about what units the player killed |
| `damage_targets` | object | Damage dealt to other heroes |
| `damage_taken` | object | Damage taken from heroes |
| `ability_uses` | object | How many times abilities were used |
| `item_uses` | object | How many times items were used |

#### **Campi Avanzati (Solo Match Parsed)**
| Campo | Tipo | Disponibilità | Note |
|-------|------|---------------|------|
| `teamfights` | array | Solo parsed | Array di teamfight objects |
| `lane_pos` | object | Solo parsed | Lane position data |
| `life_state` | object | Solo parsed | Life state data |
| `connection_log[]` | array | Solo parsed | Disconnections/reconnections |

#### **⚠️ CAMPO CRITICO: `deaths_log`**

**STATO:** ❌ **NON DOCUMENTATO** nello spec OpenAPI ufficiale

**Nel nostro codice:**
```typescript
deaths_log?: Array<{ time: number; by?: { hero_id?: number } }>
```

**Nello spec OpenAPI:**
- ❌ Campo `deaths_log` **non esiste** nella definizione `MatchResponse.players[]`
- ✅ Campo `killed_by` esiste come **object** (non array), descritto come "Object containing information about who killed the player"

**Conclusione:** `deaths_log` potrebbe essere:
1. Un campo non documentato ma presente in alcuni match parsati
2. Un campo legacy rimosso
3. Un campo disponibile solo in versioni specifiche dell'API

**Raccomandazione:** Usare `killed_by` object per ottenere informazioni sui killer, oppure richiedere parsing del match.

---

## 2. DATA CONTRACT MATRIX

| Categoria | Endpoint | Campo | Tipo | Disponibile Sempre | Disponibile Solo Parsed | Nullable | Integrabile Subito | Note Enterprise |
|-----------|----------|-------|------|-------------------|-------------------------|----------|-------------------|-----------------|
| **Match** | `/matches/{match_id}` | `match_id` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Match** | `/matches/{match_id}` | `duration` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Match** | `/matches/{match_id}` | `radiant_win` | boolean | ✅ | ❌ | Yes | ✅ | Sempre disponibile |
| **Match** | `/matches/{match_id}` | `radiant_gold_adv[]` | array<number> | ✅ | ❌ | ❌ | ✅ | Array per minuto |
| **Match** | `/matches/{match_id}` | `radiant_xp_adv[]` | array<number> | ✅ | ❌ | ❌ | ✅ | Array per minuto |
| **Match** | `/matches/{match_id}` | `teamfights[]` | array | ❌ | ✅ | Yes | ❌ | Richiede parsing |
| **Player** | `players[]` | `account_id` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `kills` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `deaths` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `assists` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `gold_per_min` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `xp_per_min` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `last_hits` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `denies` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `level` | integer | ✅ | ❌ | ❌ | ✅ | Level finale |
| **Player** | `players[]` | `hero_damage` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `tower_damage` | integer | ✅ | ❌ | ❌ | ✅ | Sempre disponibile |
| **Player** | `players[]` | `lane` | integer | ✅ | ❌ | Yes | ✅ | 1=safe, 2=mid, 3=off, 4=jungle |
| **Player** | `players[]` | `lane_role` | integer | ✅ | ❌ | Yes | ✅ | 1=core, 2=support |
| **Player** | `players[]` | `kills_log[]` | array | ✅ | ❌ | Yes | ✅ | `{time: integer, key: string}` |
| **Player** | `players[]` | `deaths_log[]` | array | ❓ | ❓ | ❓ | ❌ | **NON DOCUMENTATO** |
| **Player** | `players[]` | `killed_by` | object | ✅ | ❌ | ❌ | ✅ | Object (non array) |
| **Player** | `players[]` | `gold_t[]` | array<integer> | ✅ | ❌ | ❌ | ✅ | Gold per minuto |
| **Player** | `players[]` | `xp_t[]` | array<integer> | ✅ | ❌ | ❌ | ✅ | XP per minuto |
| **Player** | `players[]` | `lh_t[]` | array<integer> | ✅ | ❌ | ❌ | ✅ | Last hits per minuto |
| **Player** | `players[]` | `buyback_log[]` | array | ✅ | ❌ | Yes | ✅ | `{time: integer, slot: integer}` |
| **Player** | `players[]` | `purchase_log[]` | array | ✅ | ❌ | Yes | ✅ | Item purchase timeline |
| **Player** | `players[]` | `lane_pos` | object | ❌ | ✅ | ❌ | ❌ | Richiede parsing |
| **Player** | `players[]` | `life_state` | object | ❌ | ✅ | ❌ | ❌ | Richiede parsing |

---

## 3. GAP ANALYSIS – SPEC vs CODICE ATTUALE

### 3.1 Campi Usati nel Codice ma NON nella Spec

#### **🔴 CRITICO: `deaths_log`**

**File:** `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts`

**Codice attuale:**
```typescript
deaths_log?: Array<{ time: number; by?: { hero_id?: number } }>
```

**Problema:**
- Campo **non documentato** nello spec OpenAPI
- Il codice assume struttura `{time, by: {hero_id}}`
- Nello spec esiste `killed_by` come **object** (non array temporale)

**Impatto:**
- Se `deaths_log` non esiste, `dota_player_death_events` rimane vuoto
- Le analisi di "death by role" e "death cost" non funzionano

**Soluzione proposta:**
1. Usare `killed_by` object per ottenere killer info
2. Stimare timing morti da `deaths` count e `duration`
3. Richiedere parsing match per dati completi

---

#### **🟡 DISCREPANZA: `kills_log`**

**Codice attuale:**
```typescript
kills_log?: Array<{ time: number }>
```

**Spec OpenAPI:**
```json
"kills_log": {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "time": {"type": "integer"},
      "key": {"type": "string", "description": "Hero killed"}
    }
  }
}
```

**Problema:**
- Il codice non usa `key` (hero ID del kill)
- Perdiamo informazione su quale eroe è stato ucciso

**Soluzione:** Aggiungere `key` al tipo TypeScript e utilizzarlo per analisi avanzate.

---

### 3.2 Campi nella Spec ma NON Usati nel Codice

#### **Campi Timeline Disponibili:**
- ✅ `gold_t[]` - Gold per minuto (usato indirettamente)
- ✅ `xp_t[]` - XP per minuto (usato indirettamente)
- ✅ `lh_t[]` - Last hits per minuto (non usato)
- ✅ `dn_t[]` - Denies per minuto (non usato)

**Potenziale:** Creare grafici di progressione più dettagliati.

---

#### **Campi Log Disponibili:**
- ✅ `buyback_log[]` - Timeline buyback (non usato)
- ✅ `purchase_log[]` - Timeline acquisti item (non usato)
- ✅ `runes_log[]` - Timeline rune pickup (non usato)
- ✅ `obs_log[]` - Observer ward placement (non usato)
- ✅ `sen_log[]` - Sentry ward placement (non usato)

**Potenziale:** Analisi avanzate su item build, warding, resource management.

---

#### **Campi Aggregati Disponibili:**
- ✅ `killed_by` - Object con info killer (non usato, preferiamo `deaths_log`)
- ✅ `damage_targets` - Damage per target (non usato)
- ✅ `damage_taken` - Damage ricevuto per source (non usato)
- ✅ `ability_uses` - Uso abilità (non usato)
- ✅ `item_uses` - Uso item (non usato)

**Potenziale:** Analisi damage breakdown, ability efficiency, item usage.

---

### 3.3 Campi "Fantasma" (Usati ma Potenzialmente Non Disponibili)

| Campo | Uso nel Codice | Disponibilità Reale | Rischi |
|-------|----------------|---------------------|--------|
| `deaths_log[]` | ✅ Usato per death events | ❓ Non documentato | ⚠️ Potrebbe essere sempre vuoto |
| `deaths_log[].by.hero_id` | ✅ Usato per killer role | ❓ Non documentato | ⚠️ Potrebbe essere sempre undefined |
| `player.level` | ✅ Usato per stima level at death | ✅ Documentato | ✅ Sicuro |

---

### 3.4 Campi che Restano Sempre NULL

**Analisi basata su `DATA_CONTRACT_DOTA2.md`:**

| Campo Tabella | Fonte OpenDota | Stato |
|---------------|----------------|-------|
| `pos_x`, `pos_y` in `dota_player_death_events` | `lane_pos` (solo parsed) | ❌ Sempre NULL (non usiamo parsed) |
| `killer_role_position` | `deaths_log[].by.hero_id` → role mapping | ❓ Potrebbe essere NULL se `deaths_log` non esiste |

---

## 4. SHORT LIST KPI – REALISTICAMENTE DISPONIBILI OGGI

### 4.1 KPI Nativamente Disponibili (Garantiti) ✅

**Base Stats:**
- ✅ KDA (kills, deaths, assists)
- ✅ GPM (gold_per_min)
- ✅ XPM (xp_per_min)
- ✅ Last Hits (last_hits)
- ✅ Denies (denies)
- ✅ Hero Damage (hero_damage)
- ✅ Tower Damage (tower_damage)
- ✅ Hero Healing (hero_healing)
- ✅ Level finale (level)

**Timeline:**
- ✅ Gold progression (`gold_t[]`)
- ✅ XP progression (`xp_t[]`)
- ✅ Last hits progression (`lh_t[]`)
- ✅ Denies progression (`dn_t[]`)

**Match Context:**
- ✅ Lane (lane: 1-4)
- ✅ Lane Role (lane_role: 1-2)
- ✅ Is Roaming (is_roaming: boolean)
- ✅ Match Duration (duration)
- ✅ Win/Loss (radiant_win + player_slot)

**Aggregati:**
- ✅ Kill distribution per fase (da `kills_log[]` con `time`)
- ✅ Buyback count (da `buyback_log[]`)
- ✅ Item purchase timeline (da `purchase_log[]`)

---

### 4.2 KPI Disponibili SOLO per Match Parsed ⚠️

**Death Analysis:**
- ⚠️ Death log completo (`deaths_log[]` - se esiste solo in parsed)
- ⚠️ Death position (`lane_pos` - solo parsed)
- ⚠️ Life state timeline (`life_state` - solo parsed)

**Teamfight Data:**
- ⚠️ Teamfight participation (`teamfights[]` - solo parsed)
- ⚠️ Teamfight damage breakdown

**Position Data:**
- ⚠️ Lane position over time (`lane_pos` - solo parsed)
- ⚠️ Map position at death (non disponibile anche in parsed)

---

### 4.3 KPI Assenti o Non Affidabili ❌

**Death Timing:**
- ❌ `deaths_log[]` - **NON documentato** nello spec
- ❌ Death position (x, y) - Non disponibile in OpenDota

**Alternative Disponibili:**
- ✅ `killed_by` object - Contiene info killer ma non timing
- ✅ `deaths` count - Totale morti (senza timing)

---

### 4.4 KPI Ricavabili tramite Calcolo 🧮

**Death Analysis (Stimati):**
- 🧮 Death timing stimato: Dividere `duration` per `deaths` (approssimativo)
- 🧮 Death cost stimato: `downtime_seconds * (gpm/60)` + `(xpm/60)`
- 🧮 Death by role: Da `killed_by` object (se disponibile) o da match context

**Early/Mid/Late Distribution:**
- 🧮 Kill distribution: Da `kills_log[]` con `time` (✅ disponibile)
- 🧮 Death distribution: Da `deaths` count e stima timing (approssimativo)

**Progression Curves:**
- 🧮 Gold curve: Da `gold_t[]` (✅ disponibile)
- 🧮 XP curve: Da `xp_t[]` (✅ disponibile)
- 🧮 CS curve: Da `lh_t[]` (✅ disponibile)

**Advanced Metrics:**
- 🧮 Farm efficiency: `(last_hits + denies) / duration_minutes`
- 🧮 Kill participation: `(kills + assists) / team_kills`
- 🧮 Damage per minute: `hero_damage / duration_minutes`
- 🧮 Tower damage per minute: `tower_damage / duration_minutes`

---

## 5. RACCOMANDAZIONE ARCHITETTURALE

### 5.1 Cosa Possiamo Integrare SUBITO ✅

**Endpoint Aggiuntivi:**
1. ✅ `/players/{account_id}/heroes` - Per Hero Pool analysis
2. ✅ `/players/{account_id}/totals` - Per statistiche aggregate
3. ✅ `/players/{account_id}/wardmap` - Per warding analysis
4. ✅ `/benchmarks?hero_id=X` - Per confronto performance

**Campi Aggiuntivi da Match:**
1. ✅ `gold_t[]`, `xp_t[]`, `lh_t[]`, `dn_t[]` - Per grafici progressione
2. ✅ `buyback_log[]` - Per analisi buyback
3. ✅ `purchase_log[]` - Per item build timeline
4. ✅ `killed_by` object - Per death analysis (alternativa a `deaths_log`)
5. ✅ `damage_targets`, `damage_taken` - Per damage breakdown

**KPI Aggiuntivi:**
1. ✅ Farm efficiency (CS/min)
2. ✅ Damage per minute
3. ✅ Tower damage per minute
4. ✅ Buyback efficiency
5. ✅ Item timing analysis

---

### 5.2 Cosa Possiamo Integrare SOLO SE i Match sono Parsed ⚠️

**Requisito:** Match deve essere parsato (POST `/request/{match_id}`)

**Dati Disponibili:**
1. ⚠️ `teamfights[]` - Teamfight participation
2. ⚠️ `lane_pos` - Lane position over time
3. ⚠️ `life_state` - Life state timeline
4. ⚠️ `deaths_log[]` completo (se esiste solo in parsed)

**Workflow Proposto:**
1. Verificare se match è parsato: `/parsedMatches?less_than_match_id=X`
2. Se non parsato, richiedere parsing: POST `/request/{match_id}`
3. Polling stato: GET `/request/{jobId}`
4. Una volta parsato, richiamare `/matches/{match_id}` per dati completi

**Costo:** 10 API calls per rate limit per ogni parse request.

---

### 5.3 Cosa Va Rimosso o Nascosto ❌

**Campi Non Documentati:**
1. ❌ `deaths_log[]` - **Rimuovere** o **markare come non garantito**
2. ❌ `deaths_log[].by.hero_id` - **Rimuovere** o usare `killed_by` object

**Fallback Necessario:**
- Se `deaths_log` non esiste, usare `killed_by` object
- Se `killed_by` non ha timing, stimare da `deaths` count
- Mostrare warning in UI: "Death timing è stimato, non preciso"

---

### 5.4 Cosa Deve Essere Popolato Lato Supabase 💾

**Dati da Cacheare:**
1. ✅ Match basic data (`matches_digest`) - Già implementato
2. ✅ Player match analysis (`dota_player_match_analysis`) - Già implementato
3. ⚠️ Death events (`dota_player_death_events`) - **Problema:** Dipende da `deaths_log` non documentato

**Strategia:**
1. Salvare sempre `killed_by` object in `analysis_extra` (jsonb)
2. Se `deaths_log` esiste, popolare `dota_player_death_events`
3. Se non esiste, lasciare vuoto e usare `killed_by` per analisi aggregate

---

### 5.5 Endpoint da Introdurre nel Nostro Backend 🔧

**Endpoint Proposti:**

1. **`/api/dota/matches/{matchId}/parse-status`**
   - Verifica se match è parsato
   - Ritorna: `{isParsed: boolean, jobId?: string}`

2. **`/api/dota/matches/{matchId}/request-parse`**
   - Richiede parsing match
   - Ritorna: `{jobId: string, status: string}`

3. **`/api/dota/matches/{matchId}/players/{accountId}/timeline`**
   - Estrae timeline completa da `gold_t[]`, `xp_t[]`, `lh_t[]`
   - Ritorna: Array di `{minute: number, gold: number, xp: number, lh: number}`

4. **`/api/dota/matches/{matchId}/players/{accountId}/items`**
   - Estrae item build da `purchase_log[]`
   - Ritorna: Timeline acquisti con timing

5. **`/api/dota/matches/{matchId}/players/{accountId}/deaths-alternative`**
   - Usa `killed_by` object invece di `deaths_log`
   - Ritorna: Death analysis basato su dati disponibili

---

## 6. PIANO DI AZIONE IMMEDIATO

### Fase 1: Fix Critici (Priorità Alta) 🔴

1. **Rimuovere dipendenza da `deaths_log` non documentato**
   - Implementare fallback usando `killed_by` object
   - Aggiungere warning in UI se dati sono stimati
   - Aggiornare `dota_player_death_events` per gestire NULL

2. **Correggere tipo `kills_log`**
   - Aggiungere campo `key` al tipo TypeScript
   - Utilizzare `key` per analisi hero kills

3. **Aggiungere validazione campi**
   - Verificare esistenza campi prima di usarli
   - Log warning se campi opzionali mancanti

---

### Fase 2: Estensioni Immediate (Priorità Media) 🟡

1. **Integrare endpoint aggiuntivi**
   - `/players/{account_id}/heroes` per Hero Pool
   - `/players/{account_id}/totals` per statistiche
   - `/benchmarks` per confronto performance

2. **Utilizzare timeline arrays**
   - `gold_t[]`, `xp_t[]`, `lh_t[]` per grafici progressione
   - `purchase_log[]` per item build analysis

3. **Aggiungere KPI calcolati**
   - Farm efficiency
   - Damage per minute
   - Item timing analysis

---

### Fase 3: Parsed Match Support (Priorità Bassa) 🟢

1. **Implementare parse request workflow**
   - Endpoint per richiedere parsing
   - Polling stato parsing
   - Cache match parsed status

2. **Utilizzare dati parsed quando disponibili**
   - `teamfights[]` per teamfight analysis
   - `lane_pos` per position analysis
   - `deaths_log[]` completo (se esiste)

---

## 7. CONCLUSIONI

### Riepilogo Gap Critici

1. ❌ **`deaths_log` non documentato** - Richiede fix immediato
2. ⚠️ **`kills_log` struttura incompleta** - Manca campo `key`
3. ✅ **Campi base sempre disponibili** - KDA, GPM, XPM, etc.
4. ⚠️ **Dati avanzati solo parsed** - Richiede workflow parsing

### Raccomandazione Finale

**Approccio Ibrido:**
1. Usare **solo campi documentati** per funzionalità core
2. Implementare **fallback** per campi non garantiti
3. Aggiungere **supporto parsed** come feature avanzata opzionale
4. **Documentare** chiaramente limitazioni in UI

**Priorità:**
1. 🔴 Fix `deaths_log` dependency
2. 🟡 Estendere con endpoint aggiuntivi
3. 🟢 Aggiungere supporto parsed match

---

**Documento generato automaticamente da analisi OpenAPI spec v28.0.0**  
**Ultimo aggiornamento:** 2025-01-21

