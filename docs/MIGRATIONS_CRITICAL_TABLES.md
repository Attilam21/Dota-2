# Migrations Tabelle Critiche - Riepilogo

**Data**: 2025-01-XX  
**Stato**: ⏸️ **IN ATTESA DI REVISIONE** - Non applicate

---

## 📋 Migrations Create

### 1. `202501XX_create_fzth_players.sql`
**Tabella**: `fzth_players`  
**Scopo**: Anagrafica centrale giocatori FZTH (mappa `dota_account_id` → `uuid` interno)

**Struttura**:
- `id` (uuid, PK) - UUID interno
- `dota_account_id` (bigint, UNIQUE) - Dota account ID (Steam32)
- `nickname` (text, NOT NULL)
- `rank_tier` (text, nullable)
- `region` (text, nullable)
- `created_at`, `updated_at` (timestamptz)

**FK**: Nessuna (tabella root)

**Note**:
- Unique constraint su `dota_account_id` per supportare `upsert` con `onConflict: 'dota_account_id'`
- Trigger automatico per `updated_at`

---

### 2. `202501XX_create_player_stats_agg.sql`
**Tabella**: `player_stats_agg`  
**Scopo**: Statistiche aggregate per giocatore (calcolate da `matches_digest`)

**Struttura**:
- `id` (uuid, PK)
- `player_id` (uuid, FK → `fzth_players.id`, UNIQUE)
- `total_matches` (integer, default 0)
- `total_wins` (integer, default 0)
- `total_losses` (integer, default 0)
- `winrate` (numeric(5,2), nullable)
- `avg_kda` (numeric(6,2), nullable)
- `avg_duration_sec` (integer, nullable)
- `created_at`, `updated_at` (timestamptz)

**FK**: `player_id` → `fzth_players.id` (ON DELETE CASCADE)

**Note**:
- Unique constraint su `player_id` per supportare `upsert` con `onConflict: 'player_id'`
- Trigger automatico per `updated_at`

---

### 3. `202501XX_create_player_progression.sql`
**Tabella**: `player_progression`  
**Scopo**: Progressione FZTH score/level per giocatore

**Struttura**:
- `id` (uuid, PK)
- `player_id` (uuid, FK → `fzth_players.id`, UNIQUE)
- `current_level` (integer, default 1)
- `total_xp` (integer, default 0)
- `fzth_score` (integer, default 0)
- `created_at`, `updated_at` (timestamptz)

**FK**: `player_id` → `fzth_players.id` (ON DELETE CASCADE)

**Note**:
- Unique constraint su `player_id` per supportare `upsert`
- Il codice legge anche `xp` come fallback per `total_xp` (compatibilità)
- Trigger automatico per `updated_at`

---

### 4. `202501XX_create_player_hero_stats.sql`
**Tabella**: `player_hero_stats`  
**Scopo**: Statistiche per eroe per giocatore (aggregate da `matches_digest`)

**Struttura**:
- `id` (uuid, PK)
- `player_id` (uuid, FK → `fzth_players.id`)
- `hero_id` (integer, NOT NULL)
- `matches` (integer, default 0)
- `wins` (integer, default 0)
- `losses` (integer, nullable) - Calcolabile come `matches - wins`
- `winrate` (numeric(5,2), nullable)
- `kda_avg` (numeric(6,2), nullable)
- `avg_duration_sec` (integer, nullable)
- `last_played_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

**FK**: `player_id` → `fzth_players.id` (ON DELETE CASCADE)

**Unique Constraint**: `(player_id, hero_id)` per supportare `upsert` con `onConflict: 'player_id,hero_id'`

**Note**:
- `losses` è nullable perché il codice attuale non lo calcola (può essere calcolato come `matches - wins`)
- Trigger automatico per `updated_at`

---

## ✅ Verifiche Completate

### Allineamento Tipi
- ✅ `player_id` = `uuid` (FK a `fzth_players.id`) - **CORRETTO**
- ✅ `dota_account_id` = `bigint` (Steam32) - **CORRETTO**
- ✅ Nessun uso di `TEXT` per ID (eccetto `dota_tasks.player_id` che è legacy)

### Foreign Keys
- ✅ Tutte le FK puntano a `fzth_players.id` (uuid) - **CORRETTO**
- ✅ `ON DELETE CASCADE` dove appropriato - **CORRETTO**
- ✅ Nessuna FK a tabelle inesistenti - **CORRETTO**

### Compatibilità Codice
- ✅ `fzth_players`: supporta `upsert` con `onConflict: 'dota_account_id'` - **CORRETTO**
- ✅ `player_stats_agg`: supporta `upsert` con `onConflict: 'player_id'` - **CORRETTO**
- ✅ `player_progression`: supporta query con `player_id` - **CORRETTO**
- ✅ `player_hero_stats`: supporta `upsert` con `onConflict: 'player_id,hero_id'` - **CORRETTO**

### Idempotenza
- ✅ Tutte le migrations usano `IF NOT EXISTS` / `IF EXISTS` - **CORRETTO**
- ✅ Nessuna migration sovrascrive dati esistenti - **CORRETTO**

### RLS Policies
- ✅ Tutte le tabelle hanno RLS abilitato - **CORRETTO**
- ✅ SELECT policy per `public` (read access) - **CORRETTO**
- ✅ INSERT/UPDATE/DELETE policies per `service_role` (write access) - **CORRETTO**

---

## 📝 Note Implementative

### Ordine di Applicazione
Le migrations devono essere applicate in questo ordine:
1. `202501XX_create_fzth_players.sql` (prima, perché altre tabelle FK a questa)
2. `202501XX_create_player_stats_agg.sql`
3. `202501XX_create_player_progression.sql`
4. `202501XX_create_player_hero_stats.sql`

### Rinominare File
I file usano il placeholder `202501XX_`. Prima di applicare, rinominare con timestamp reale:
- `202501XX_create_fzth_players.sql` → `20250123HHMMSS_create_fzth_players.sql`
- `202501XX_create_player_stats_agg.sql` → `20250123HHMMSS_create_player_stats_agg.sql`
- `202501XX_create_player_progression.sql` → `20250123HHMMSS_create_player_progression.sql`
- `202501XX_create_player_hero_stats.sql` → `20250123HHMMSS_create_player_hero_stats.sql`

### Dati Esistenti
- ✅ Le migrations sono **non distruttive**: non modificano o eliminano dati esistenti
- ✅ Se le tabelle esistono già (parzialmente), le migrations aggiungono solo colonne/costraint mancanti
- ⚠️ **Attenzione**: Se esistono già dati in queste tabelle con struttura diversa, verificare compatibilità prima di applicare

---

## 🚨 Prossimi Step

1. **Revisione migrations** (questo documento)
2. **Rinominare file** con timestamp reale
3. **Test in ambiente di sviluppo** (se disponibile)
4. **Applicare migrations** in produzione
5. **Verificare funzionamento** del codice dopo applicazione

---

## 📊 File Creati

```
supabase/migrations/
├── 202501XX_create_fzth_players.sql
├── 202501XX_create_player_stats_agg.sql
├── 202501XX_create_player_progression.sql
└── 202501XX_create_player_hero_stats.sql
```

---

**Stato**: ⏸️ **IN ATTESA DI REVISIONE**

