# Schema Dati Analisi Dota 2 - Documentazione

## 1. Analisi Schema Supabase Esistente

### Tabelle Esistenti Rilevanti

#### 1.1 `matches_digest`
**Scopo**: Tabella principale per i dati digest dei match Dota 2.

**Colonne principali**:
- `id` (uuid, PK)
- `player_account_id` (bigint, NOT NULL) - Account ID Dota 2 (Steam32)
- `match_id` (bigint, NOT NULL) - OpenDota match ID
- `hero_id` (integer, NOT NULL)
- `kills`, `deaths`, `assists` (integer, NOT NULL)
- `duration_seconds` (integer, NOT NULL)
- `start_time` (timestamptz, NOT NULL)
- `result` (text, NOT NULL, CHECK: 'win' | 'lose')
- `lane` (text, nullable)
- `role` (text, nullable)
- `kda` (numeric, nullable)
- `created_at`, `updated_at` (timestamptz)

**Caratteristiche**:
- Unique constraint su `(player_account_id, match_id)`
- RLS abilitato con policy SELECT per public, INSERT/UPDATE/DELETE per service_role
- **Specifica per Dota 2**: usa `player_account_id` (bigint) invece di `player_id` (uuid)

#### 1.2 `player_stats_agg`
**Scopo**: Statistiche aggregate per player.

**Colonne principali**:
- `player_id` (uuid)
- `total_matches` (integer)
- `total_wins`, `total_losses` (integer)
- `winrate` (numeric)
- `avg_kda` (numeric)
- `avg_duration_sec` (integer)

**Caratteristiche**:
- Schema allineato con migrazione additiva
- **Multi-gioco potenziale**: non ha campo `game` esplicito, ma è usato per Dota 2

#### 1.3 `dota_tasks`
**Scopo**: Task di coaching generati automaticamente dai KPI.

**Colonne principali**:
- `id` (uuid, PK)
- `player_id` (text, NOT NULL) - Account ID Dota 2 come stringa
- `type` (text, NOT NULL)
- `title`, `description` (text, NOT NULL)
- `status` (text, NOT NULL, CHECK: 'open' | 'completed' | 'failed')
- `kpi_payload` (jsonb, NOT NULL, DEFAULT '{}')
- `params` (jsonb, NOT NULL, DEFAULT '{}')
- `created_at`, `updated_at` (timestamptz)
- `resolved_at` (timestamptz, nullable)

**Caratteristiche**:
- **Specifica per Dota 2**: nome tabella e uso di `player_id` come text (account ID)
- Indici su `player_id`, `status`, `type`, `created_at`

### Tabelle FZTH Esistenti (menzionate nel codice)
- `fzth_players` - Player FZTH
- `player_progression` - Progressione player
- `fzth_levels` - Livelli FZTH
- `player_achievements` - Achievement player
- `achievement_catalog` - Catalogo achievement
- `player_hero_stats` - Statistiche per eroe
- `ai_insights` - Insight AI

**Nota**: Queste tabelle non sono state analizzate in dettaglio ma sono presenti nel codice API.

### Convenzioni Schema Esistenti
1. **Naming**: snake_case per tabelle e colonne
2. **ID**: UUID per PK interne, bigint per ID esterni (OpenDota/Steam32)
3. **Timestamps**: `created_at`, `updated_at` con default `now()`
4. **RLS**: Abilitato con policy SELECT public, write service_role
5. **Multi-gioco**: Non esplicito, ma schema flessibile (campo `game` non presente)

## 2. Schema Dati per Analisi Dota 2

### Obiettivi KPI
1. Distribuzione kill per fase (Early/Mid/Late)
2. Distribuzione morti per fase (Early/Mid/Late)
3. Costo opportunità morti (gold/xp/cs persi)
4. Death by Role (percentuale morti causate da Pos1-5 avversari)
5. Heatmap morti (posizioni x,y sulla mappa, opzionale)

### Definizioni Fasi di Gioco
- **Early**: 0-10 minuti
- **Mid**: 10-30 minuti
- **Late**: 30+ minuti

### Definizioni Ruoli Dota 2
- **Pos 1**: Safe Lane Carry
- **Pos 2**: Mid
- **Pos 3**: Offlane
- **Pos 4**: Soft Support/Roamer
- **Pos 5**: Hard Support

## 3. Progettazione Tabelle

### 3.1 Estensione `matches_digest` (Additiva)
**Decisione**: Aggiungere colonne opzionali a `matches_digest` per dati base player/match Dota 2.

**Nuove colonne da aggiungere**:
- `role_position` (integer, nullable) - 1..5 per Pos1-5
- `gold_per_min` (integer, nullable) - GPM
- `xp_per_min` (integer, nullable) - XPM
- `last_hits` (integer, nullable)
- `denies` (integer, nullable)

**Motivazione**: Riutilizza tabella esistente, evita duplicazione, mantiene coerenza.

### 3.2 Nuova Tabella: `dota_player_death_events`
**Scopo**: Eventi di morte del player in un match.

**Colonne**:
- `id` (uuid, PK)
- `match_id` (bigint, NOT NULL) - FK logica a matches_digest.match_id
- `account_id` (bigint, NOT NULL) - FK logica a matches_digest.player_account_id
- `time_seconds` (integer, NOT NULL) - Secondo della morte nel match
- `phase` (text, NOT NULL, CHECK: 'early' | 'mid' | 'late')
- `level_at_death` (integer, NOT NULL)
- `downtime_seconds` (integer, NOT NULL) - Tempo di respawn stimato
- `gold_lost` (integer, NOT NULL) - Gold perso stimato
- `xp_lost` (integer, NOT NULL) - XP perso stimato
- `cs_lost` (integer, NOT NULL) - CS perso stimato
- `killer_hero_id` (integer, nullable) - Hero ID del killer
- `killer_role_position` (integer, nullable) - 1..5, ruolo del killer
- `pos_x` (numeric, nullable) - Posizione X sulla mappa (se disponibile)
- `pos_y` (numeric, nullable) - Posizione Y sulla mappa (se disponibile)
- `created_at` (timestamptz, NOT NULL, DEFAULT now())

**Indici**:
- `idx_dota_death_events_match_account` ON (match_id, account_id)
- `idx_dota_death_events_time` ON (match_id, account_id, time_seconds)

**Commenti**:
- Tabella per analisi dettagliate delle morti
- I campi `gold_lost`, `xp_lost`, `cs_lost` sono stimati basandosi su GPM/XPM/CS al momento della morte

### 3.3 Nuova Tabella: `dota_player_match_analysis`
**Scopo**: Sintesi analisi per match+player (una riga per match+player).

**Colonne**:
- `id` (uuid, PK)
- `match_id` (bigint, NOT NULL) - FK logica a matches_digest.match_id
- `account_id` (bigint, NOT NULL) - FK logica a matches_digest.player_account_id
- `role_position` (integer, NOT NULL) - 1..5
- `kills_early` (integer, NOT NULL, DEFAULT 0)
- `kills_mid` (integer, NOT NULL, DEFAULT 0)
- `kills_late` (integer, NOT NULL, DEFAULT 0)
- `kill_pct_early` (numeric, NOT NULL, DEFAULT 0) - Percentuale kill in early (0..100)
- `kill_pct_mid` (numeric, NOT NULL, DEFAULT 0)
- `kill_pct_late` (numeric, NOT NULL, DEFAULT 0)
- `deaths_early` (integer, NOT NULL, DEFAULT 0)
- `deaths_mid` (integer, NOT NULL, DEFAULT 0)
- `deaths_late` (integer, NOT NULL, DEFAULT 0)
- `death_pct_early` (numeric, NOT NULL, DEFAULT 0) - Percentuale morti in early (0..100)
- `death_pct_mid` (numeric, NOT NULL, DEFAULT 0)
- `death_pct_late` (numeric, NOT NULL, DEFAULT 0)
- `total_gold_lost` (integer, NOT NULL, DEFAULT 0) - Totale gold perso per morti
- `total_xp_lost` (integer, NOT NULL, DEFAULT 0) - Totale XP perso per morti
- `total_cs_lost` (integer, NOT NULL, DEFAULT 0) - Totale CS perso per morti
- `death_pct_pos1` (numeric, NOT NULL, DEFAULT 0) - Percentuale morti causate da Pos1 (0..100)
- `death_pct_pos2` (numeric, NOT NULL, DEFAULT 0)
- `death_pct_pos3` (numeric, NOT NULL, DEFAULT 0)
- `death_pct_pos4` (numeric, NOT NULL, DEFAULT 0)
- `death_pct_pos5` (numeric, NOT NULL, DEFAULT 0)
- `analysis_extra` (jsonb, nullable) - Dati accessori (es. heatmap data, dettagli aggiuntivi)
- `created_at` (timestamptz, NOT NULL, DEFAULT now())
- `updated_at` (timestamptz, NOT NULL, DEFAULT now())

**Unique constraint**: `(match_id, account_id)` - una riga per match+player

**Indici**:
- `idx_dota_match_analysis_match_account` ON (match_id, account_id)
- `idx_dota_match_analysis_account` ON (account_id)

**Commenti**:
- Tabella di sintesi per dashboard
- I valori percentuali sono calcolati rispetto al totale kill/death del match o del player
- `analysis_extra` può contenere dati opzionali come heatmap JSON

## 4. Relazioni tra Tabelle

```
matches_digest (match_id, player_account_id)
    ↓ (FK logica)
dota_player_match_analysis (match_id, account_id)
    ↓ (FK logica)
dota_player_death_events (match_id, account_id)
```

**Nota**: Le FK sono logiche (non enforced) perché `matches_digest` usa `bigint` per ID esterni. Le relazioni sono mantenute a livello applicativo.

## 5. Mapping a DotaPlayerMatchAnalysis (TypeScript)

L'interfaccia `DotaPlayerMatchAnalysis` mappa direttamente a `dota_player_match_analysis`:

- `matchId` → `match_id`
- `accountId` → `account_id`
- `rolePosition` → `role_position`
- `killDistribution` → `kills_early/mid/late` + `kill_pct_early/mid/late`
- `deathDistribution` → `deaths_early/mid/late` + `death_pct_early/mid/late`
- `deathCostSummary` → `total_gold_lost`, `total_xp_lost`, `total_cs_lost`
- `deathByRole` → `death_pct_pos1..5`
- `deathEvents` → query su `dota_player_death_events`

## 6. API Endpoint

**Route**: `GET /api/dota/matches/[matchId]/players/[accountId]/analysis`

**File**: `src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts`

**Comportamento**:
1. Cerca analisi esistente in `dota_player_match_analysis` per `matchId` + `accountId`
2. Se esiste, restituisce i dati mappati a `DotaPlayerMatchAnalysis`
3. Se non esiste:
   - Recupera dati raw da OpenDota (`/matches/{matchId}`)
   - Calcola tutti i KPI (kill/death distribution, death cost, death by role)
   - Salva in Supabase (`dota_player_match_analysis` + `dota_player_death_events`)
   - Restituisce l'analisi

**Dati OpenDota utilizzati**:
- `players[].kills_log` - Array di `{ time: number }` per kill
- `players[].deaths_log` - Array di `{ time: number, by?: { hero_id?: number } }` per morti
- `players[].gold_per_min`, `xp_per_min`, `last_hits` - Per calcolo costo opportunità
- `players[].role`, `players[].lane` - Per determinare role position

**Note implementative**:
- Il calcolo del costo opportunità usa GPM/XPM/CS al momento della morte
- Il respawn time è stimato basandosi sul level (formula: 5 + level * 2 secondi)
- La detection del killer role è basata sul `hero_id` del killer e il ruolo del player killer nel match
- Se i dati del killer non sono disponibili, i campi `killerHeroId` e `killerRolePosition` sono `undefined`

## 7. Note Implementative

### Calcolo Fasi
- Early: `time_seconds <= 600` (10 minuti)
- Mid: `600 < time_seconds <= 1800` (30 minuti)
- Late: `time_seconds > 1800`

### Calcolo Costo Opportunità
- `gold_lost` = `downtime_seconds * (GPM / 60)`
- `xp_lost` = `downtime_seconds * (XPM / 60)`
- `cs_lost` = `downtime_seconds * (CS_per_min / 60)`

### Death by Role
- Aggregazione su `dota_player_death_events.killer_role_position`
- Percentuale calcolata su totale morti del player nel match

### Heatmap (Opzionale)
- Se `pos_x` e `pos_y` sono disponibili da OpenDota, possono essere salvati in `dota_player_death_events`
- Visualizzazione tramite `analysis_extra` JSONB in `dota_player_match_analysis`

