# 🔍 Audit Completo Schema Supabase ⇄ Codice Dota 2 / Coaching FZTH

**Data Audit**: 2025-01-XX  
**Scopo**: Verificare allineamento tra schema Supabase (migrations) e codice applicativo, identificare gap e tabelle non sfruttate.

---

## 📊 PASSO 1: MAPPA SCHEMA SUPABASE (DA MIGRATIONS)

### Tabelle CREATE nelle Migrations

#### ✅ **matches_digest** (0001_create_matches_digest.sql)
- **Colonne principali**:
  - `id` (uuid, PK)
  - `player_account_id` (bigint, NOT NULL)
  - `match_id` (bigint, NOT NULL, unique con player_account_id)
  - `hero_id` (integer, NOT NULL)
  - `kills`, `deaths`, `assists` (integer, NOT NULL)
  - `duration_seconds` (integer, NOT NULL)
  - `start_time` (timestamptz, NOT NULL)
  - `result` (text, CHECK: 'win'|'lose')
  - `lane`, `role` (text, nullable)
  - `kda` (numeric, nullable)
  - `role_position` (integer, 1-5, nullable) - aggiunta in 20251201
  - `gold_per_min`, `xp_per_min` (integer, nullable) - aggiunta in 20251201
  - `last_hits`, `denies` (integer, nullable) - aggiunta in 20251201
  - `radiant_win`, `party_size` (boolean/integer, nullable) - aggiunta in 20251121
  - `created_at`, `updated_at` (timestamptz)

#### ✅ **dota_player_match_analysis** (20251201_create_dota_analysis_tables.sql)
- **Colonne principali**:
  - `id` (uuid, PK)
  - `match_id`, `account_id` (bigint, NOT NULL, unique constraint)
  - `role_position` (integer, 1-5, NOT NULL)
  - Kill distribution: `kills_early`, `kills_mid`, `kills_late`, `kill_pct_early/mid/late`
  - Death distribution: `deaths_early`, `deaths_mid`, `deaths_late`, `death_pct_early/mid/late`
  - Death cost: `total_gold_lost`, `total_xp_lost`, `total_cs_lost`
  - Death by role: `death_pct_pos1/2/3/4/5`
  - `analysis_extra` (jsonb, default '{}')
  - `created_at`, `updated_at` (timestamptz)

#### ✅ **dota_player_death_events** (20251201_create_dota_analysis_tables.sql)
- **Colonne principali**:
  - `id` (uuid, PK)
  - `match_id`, `account_id` (bigint, NOT NULL)
  - `time_seconds` (integer, >= 0)
  - `phase` (text, CHECK: 'early'|'mid'|'late')
  - `level_at_death` (integer, 1-30)
  - `downtime_seconds` (integer, >= 0)
  - `gold_lost`, `xp_lost`, `cs_lost` (integer, default 0)
  - `killer_hero_id`, `killer_role_position` (integer, nullable)
  - `pos_x`, `pos_y` (numeric, nullable, sempre NULL per ora)
  - `created_at` (timestamptz)

#### ✅ **fzth_player_profile_snapshots** (20251122_fzth_profile_and_tasks.sql)
- **Colonne principali**:
  - `id` (uuid, PK)
  - `player_account_id` (bigint, NOT NULL)
  - `snapshot_at` (timestamptz, default now())
  - `period` (text, default 'all_time')
  - `fzth_score`, `fzth_level` (int, NOT NULL)
  - `next_level_score`, `progress_to_next` (int, nullable)
  - `main_role`, `main_playstyle` (text, nullable)
  - Pilastri: `laning_score`, `macro_score`, `teamfight_score`, `consistency_score`, `hero_pool_score` (int, nullable)
  - `matches_played`, `winrate`, `avg_kda` (int/numeric, nullable)
  - `created_at` (timestamptz)

#### ✅ **fzth_coaching_tasks** (20251122_fzth_profile_and_tasks.sql)
- **Colonne principali**:
  - `id` (uuid, PK)
  - `code` (text, NOT NULL, UNIQUE)
  - `title`, `description` (text, nullable)
  - `pillar` (text, NOT NULL)
  - `difficulty` (smallint, default 1, 1-3)
  - `is_active` (boolean, default true)
  - `created_at`, `updated_at` (timestamptz)

#### ✅ **fzth_player_tasks** (20251122_fzth_profile_and_tasks.sql)
- **Colonne principali**:
  - `id` (uuid, PK)
  - `player_account_id` (bigint, NOT NULL)
  - `task_id` (uuid, FK → fzth_coaching_tasks.id)
  - `status` (text, default 'pending', CHECK: 'pending'|'in_progress'|'completed'|'blocked')
  - `source_match_id` (bigint, nullable)
  - `notes` (text, nullable)
  - `created_at`, `updated_at`, `completed_at` (timestamptz)

#### ✅ **dota_tasks** (20251125_create_dota_tasks.sql)
- **Colonne principali**:
  - `id` (uuid, PK)
  - `player_id` (text, NOT NULL) - ⚠️ **DISCREPANZA**: usa TEXT invece di bigint
  - `type` (text, NOT NULL)
  - `title`, `description` (text, NOT NULL)
  - `status` (text, default 'open', CHECK: 'open'|'completed'|'failed')
  - `kpi_payload`, `params` (jsonb, default '{}')
  - `created_at`, `updated_at`, `resolved_at` (timestamptz)

---

### ⚠️ Tabelle MENZIONATE nel Codice ma NON CREATE nelle Migrations

#### ❌ **fzth_players**
- **Usata in**: `src/app/api/fzth/sync-player/route.ts`, `src/app/api/fzth/profile/route.ts`, ecc.
- **Campi usati**: `id` (uuid), `dota_account_id` (bigint), `nickname` (text)
- **Stato**: **MANCANTE** - Il codice la usa ma non esiste migration

#### ❌ **player_stats_agg**
- **Usata in**: `src/app/api/fzth/sync-player/route.ts`, `src/app/api/fzth/profile/route.ts`, `src/lib/fzth/recomputeStats.ts`
- **Campi usati**: `player_id` (uuid), `total_matches`, `total_wins`, `total_losses`, `winrate`, `avg_kda`, `avg_duration_sec`
- **Stato**: **MANCANTE** - Menzionata in migration 20251121_align_matches_and_stats.sql ma solo per ADD COLUMN, non CREATE TABLE

#### ❌ **player_progression**
- **Usata in**: `src/app/api/fzth/profile/route.ts`, `src/app/api/players/history/route.ts`
- **Campi usati**: `player_id`, `fzth_score`, `fzth_level`, `progress_to_next`, `created_at`
- **Stato**: **MANCANTE** - Il codice la usa ma non esiste migration

#### ❌ **fzth_levels**
- **Usata in**: `src/app/api/fzth/profile/route.ts`, `src/app/api/players/history/route.ts`
- **Campi usati**: `level`, `required_score`, `name`, `description`
- **Stato**: **MANCANTE** - Il codice la usa ma non esiste migration

#### ❌ **player_achievements**
- **Usata in**: `src/app/api/fzth/profile/route.ts`, `src/app/api/fzth/achievements/route.ts`
- **Campi usati**: `player_id`, `achievement_id`, `unlocked_at`
- **Stato**: **MANCANTE** - Il codice la usa ma non esiste migration

#### ❌ **achievement_catalog**
- **Usata in**: `src/app/api/fzth/profile/route.ts`, `src/app/api/fzth/achievements/route.ts`
- **Campi usati**: `id`, `code`, `name`, `description`, `icon_url`, `rarity`
- **Stato**: **MANCANTE** - Il codice la usa ma non esiste migration

#### ❌ **player_hero_stats**
- **Usata in**: `src/app/api/fzth/sync-player/route.ts`, `src/app/api/fzth/profile/route.ts`
- **Campi usati**: `player_id`, `hero_id`, `games_played`, `wins`, `losses`, `winrate`, `avg_kda`
- **Stato**: **MANCANTE** - Il codice la usa ma non esiste migration

#### ❌ **ai_insights**
- **Usata in**: `src/app/api/fzth/profile/route.ts`, `src/app/api/fzth/insights/route.ts`
- **Campi usati**: `player_id`, `insight_type`, `content`, `created_at`
- **Stato**: **MANCANTE** - Il codice la usa ma non esiste migration

#### ❌ **player_matches**
- **Usata in**: `src/app/api/fzth/sync-player/route.ts`
- **Campi usati**: `player_id`, `match_id`, `hero_id`, `result`, `kills`, `deaths`, `assists`
- **Stato**: **MANCANTE** - Il codice la usa ma non esiste migration (probabilmente duplicato di matches_digest?)

#### ❌ **fzth_users**
- **Usata in**: `src/legacy/steam-login/NOT_USED_getOrCreateFzthUserFromSteam.ts` (legacy, non usata)
- **Stato**: **LEGACY** - Non più usata, può essere ignorata

---

## 🔍 PASSO 2: AUDIT CODICE ⇄ TABELLE

### Tabelle Usate nel Codice (grep `.from('...')`)

| Tabella | File Usato | Stato Schema | Note |
|---------|------------|--------------|------|
| `matches_digest` | ✅ Multipli | ✅ ESISTE | Allineata |
| `dota_player_match_analysis` | ✅ Multipli | ✅ ESISTE | Allineata |
| `dota_player_death_events` | ❓ | ✅ ESISTE | **NON USATA nel codice!** |
| `fzth_coaching_tasks` | ✅ `src/lib/fzth/coaching/repository.ts` | ✅ ESISTE | Allineata |
| `fzth_player_tasks` | ✅ `src/lib/fzth/coaching/repository.ts` | ✅ ESISTE | Allineata |
| `fzth_player_profile_snapshots` | ❓ | ✅ ESISTE | **NON USATA nel codice!** |
| `dota_tasks` | ✅ `src/app/api/tasks/*` | ✅ ESISTE | ⚠️ `player_id` è TEXT invece di bigint |
| `fzth_players` | ✅ Multipli | ❌ MANCANTE | **CRITICO** - Serve migration |
| `player_stats_agg` | ✅ Multipli | ❌ MANCANTE | **CRITICO** - Serve migration |
| `player_progression` | ✅ Multipli | ❌ MANCANTE | **CRITICO** - Serve migration |
| `fzth_levels` | ✅ Multipli | ❌ MANCANTE | Serve migration |
| `player_achievements` | ✅ Multipli | ❌ MANCANTE | Serve migration |
| `achievement_catalog` | ✅ Multipli | ❌ MANCANTE | Serve migration |
| `player_hero_stats` | ✅ Multipli | ❌ MANCANTE | Serve migration |
| `ai_insights` | ✅ Multipli | ❌ MANCANTE | Serve migration |
| `player_matches` | ✅ `src/app/api/fzth/sync-player/route.ts` | ❌ MANCANTE | **Possibile duplicato di matches_digest?** |
| `notes` | ✅ `src/components/SignUpUserSteps.tsx` | ❌ ESEMPIO | Solo esempio, ignorare |

---

## 🚨 PROBLEMI IDENTIFICATI

### 1. **Tabelle Critiche Mancanti** (il codice le usa ma non esistono)

#### **fzth_players** (PRIORITÀ ALTA)
- **Uso**: Anagrafica giocatori, riferimento centrale per tutte le altre tabelle
- **Campi necessari** (da codice):
  ```sql
  CREATE TABLE IF NOT EXISTS public.fzth_players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dota_account_id bigint NOT NULL UNIQUE,
    nickname text NOT NULL,
    rank_tier text,
    region text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  ```

#### **player_stats_agg** (PRIORITÀ ALTA)
- **Uso**: Statistiche aggregate per giocatore
- **Campi necessari** (da codice):
  ```sql
  CREATE TABLE IF NOT EXISTS public.player_stats_agg (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id uuid NOT NULL REFERENCES public.fzth_players(id) ON DELETE CASCADE,
    total_matches integer NOT NULL DEFAULT 0,
    total_wins integer NOT NULL DEFAULT 0,
    total_losses integer NOT NULL DEFAULT 0,
    winrate numeric(5,2),
    avg_kda numeric(6,2),
    avg_duration_sec integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(player_id)
  );
  ```

#### **player_progression** (PRIORITÀ MEDIA)
- **Uso**: Progressione FZTH score/level nel tempo
- **Campi necessari**:
  ```sql
  CREATE TABLE IF NOT EXISTS public.player_progression (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id uuid NOT NULL REFERENCES public.fzth_players(id) ON DELETE CASCADE,
    fzth_score int NOT NULL,
    fzth_level int NOT NULL,
    progress_to_next int,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  ```

#### **player_hero_stats** (PRIORITÀ MEDIA)
- **Uso**: Statistiche per eroe per giocatore
- **Campi necessari**:
  ```sql
  CREATE TABLE IF NOT EXISTS public.player_hero_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id uuid NOT NULL REFERENCES public.fzth_players(id) ON DELETE CASCADE,
    hero_id integer NOT NULL,
    games_played integer NOT NULL DEFAULT 0,
    wins integer NOT NULL DEFAULT 0,
    losses integer NOT NULL DEFAULT 0,
    winrate numeric(5,2),
    avg_kda numeric(6,2),
    last_played_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(player_id, hero_id)
  );
  ```

### 2. **Tabelle Esistenti NON Sfruttate**

#### **dota_player_death_events** ⚠️
- **Stato**: ✅ Esiste in schema
- **Uso nel codice**: ❌ **ZERO** - Non viene mai queryata
- **Potenziale**: Analisi dettagliata morti, timeline costi, heatmap posizioni
- **Raccomandazione**: Implementare almeno 2-3 KPI basati su questa tabella

#### **fzth_player_profile_snapshots** ⚠️
- **Stato**: ✅ Esiste in schema
- **Uso nel codice**: ❌ **ZERO** - Non viene mai queryata
- **Potenziale**: Storico profili, trend FZTH score, progressione pilastri
- **Raccomandazione**: Usare per "Coaching Impact" winrateDelta/fzthScoreDelta

### 3. **Discrepanze di Tipo**

#### **dota_tasks.player_id** (TEXT vs bigint)
- **Problema**: `dota_tasks.player_id` è TEXT, mentre tutte le altre tabelle usano `bigint` per `player_account_id`
- **Impatto**: Inconsistenza, possibili errori di join
- **Raccomandazione**: Allineare a `bigint` o creare mapping

#### **player_matches vs matches_digest**
- **Problema**: `player_matches` viene usata in sync-player ma non esiste. Probabilmente è un duplicato di `matches_digest`
- **Raccomandazione**: Verificare se `player_matches` è necessaria o se va sostituita con `matches_digest`

---

## 📊 PASSO 3: COPERTURA ANALITICA vs TABELLE ESISTENTI

### Performance & Stile di Gioco

#### ✅ **Tabelle Usate**
- `matches_digest` - ✅ Usata (match list, KDA, result)
- `dota_player_match_analysis` - ✅ Usata (kill/death distribution, death cost)

#### ❌ **Tabelle NON Sfruttate**
- `dota_player_death_events` - ❌ **ZERO utilizzo**
  - **KPI mancanti**:
    - Death cost per fase (early/mid/late)
    - Timeline morti (grafico temporale)
    - Death by role heatmap
    - Posizione morti (quando pos_x/pos_y disponibili)

#### 📈 **Raccomandazioni**
1. Implementare query su `dota_player_death_events` per:
   - Death cost medio per fase
   - Timeline morti (grafico line chart)
   - Death by killer role (bar chart)

### Hero Pool

#### ✅ **Tabelle Usate**
- `matches_digest` - ✅ Usata (hero_id, winrate per eroe)

#### ❌ **Tabelle NON Sfruttate**
- `player_hero_stats` - ❌ **MANCANTE** (ma codice la usa!)
  - Serve migration per aggregati hero

#### 📈 **Raccomandazioni**
1. Creare migration per `player_hero_stats`
2. Implementare grafici:
   - Winrate trend per eroe (line chart)
   - Hero pool depth (numero eroi con >X partite)
   - Hero performance vs meta

### Team & Compagni

#### ✅ **Tabelle Usate**
- `matches_digest` - ✅ Usata (party_size, teammate analysis)

#### ❌ **Tabelle NON Sfruttate**
- Nessuna tabella dedicata a `dota_teammates` o `player_teammate_stats` nelle migrations
- Il codice non sembra usare tabelle dedicate per teammates

#### 📈 **Raccomandazioni**
1. Verificare se serve tabella `dota_teammates` o se basta `matches_digest` con join
2. Se serve, creare migration per statistiche compagni

### Coaching & Task

#### ✅ **Tabelle Usate**
- `fzth_coaching_tasks` - ✅ Usata
- `fzth_player_tasks` - ✅ Usata
- `dota_tasks` - ✅ Usata (ma con discrepanza tipo)

#### ❌ **Tabelle NON Sfruttate**
- `fzth_player_profile_snapshots` - ❌ **ZERO utilizzo**
  - Potrebbe essere usata per "Coaching Impact" winrateDelta/fzthScoreDelta

#### 📈 **Raccomandazioni**
1. Usare `fzth_player_profile_snapshots` per calcolare:
   - `winrateDelta`: differenza winrate tra snapshot prima/dopo coaching
   - `fzthScoreDelta`: differenza FZTH score tra snapshot
2. Allineare `dota_tasks.player_id` a `bigint`

---

## 📐 PASSO 4: GAP ANALYSIS E NUOVE TABELLE

### Tabelle da CREARE (Priorità)

#### 🔴 **PRIORITÀ CRITICA** (codice le usa ORA)

1. **fzth_players**
   - **Motivo**: Anagrafica centrale, usata in 10+ file
   - **Migration**: `202501XX_create_fzth_players.sql`

2. **player_stats_agg**
   - **Motivo**: Statistiche aggregate, usata in sync-player e profile
   - **Migration**: `202501XX_create_player_stats_agg.sql`

3. **player_progression**
   - **Motivo**: Progressione FZTH, usata in profile e history
   - **Migration**: `202501XX_create_player_progression.sql`

4. **player_hero_stats**
   - **Motivo**: Statistiche per eroe, usata in sync-player e profile
   - **Migration**: `202501XX_create_player_hero_stats.sql`

#### 🟡 **PRIORITÀ MEDIA** (funzionalità incomplete)

5. **fzth_levels**
   - **Motivo**: Catalogo livelli FZTH, usata in profile
   - **Migration**: `202501XX_create_fzth_levels.sql`

6. **player_achievements** + **achievement_catalog**
   - **Motivo**: Sistema achievement, usato in profile e achievements API
   - **Migration**: `202501XX_create_achievements.sql`

7. **ai_insights**
   - **Motivo**: Insight AI, usato in profile e insights API
   - **Migration**: `202501XX_create_ai_insights.sql`

#### 🟢 **PRIORITÀ BASSA** (da verificare)

8. **player_matches**
   - **Motivo**: Usata in sync-player, ma potrebbe essere duplicato di `matches_digest`
   - **Azione**: Verificare se serve o se va rimossa dal codice

### Tabelle da SFRUTTARE (Esistenti ma non usate)

1. **dota_player_death_events**
   - Implementare almeno 2-3 KPI basati su questa tabella
   - File da modificare: `src/app/api/performance/profile/route.ts`

2. **fzth_player_profile_snapshots**
   - Usare per calcolare winrateDelta/fzthScoreDelta in coaching impact
   - File da modificare: `src/lib/fzth/coaching/repository.ts` → `getCoachingImpactSummary`

### Fix Discrepanze

1. **dota_tasks.player_id** (TEXT → bigint)
   - Migration: `202501XX_fix_dota_tasks_player_id_type.sql`
   - Aggiornare codice che usa `dota_tasks`

---

## ✅ RACCOMANDAZIONI FINALI

### Immediate (Blocca funzionalità)

1. ✅ Creare migration per `fzth_players`
2. ✅ Creare migration per `player_stats_agg`
3. ✅ Creare migration per `player_progression`
4. ✅ Creare migration per `player_hero_stats`

### Breve termine (Migliora funzionalità)

5. ✅ Sfruttare `dota_player_death_events` per nuovi KPI
6. ✅ Sfruttare `fzth_player_profile_snapshots` per coaching impact
7. ✅ Fix tipo `dota_tasks.player_id`

### Medio termine (Completa funzionalità)

8. ✅ Creare migration per `fzth_levels`
9. ✅ Creare migration per achievements (`player_achievements` + `achievement_catalog`)
10. ✅ Creare migration per `ai_insights`
11. ✅ Verificare e rimuovere/sostituire `player_matches` se duplicato

---

## 📝 NOTE IMPLEMENTATIVE

- **RLS**: Tutte le nuove tabelle devono avere RLS policies seguendo il pattern esistente (SELECT public, INSERT/UPDATE/DELETE service_role)
- **Indici**: Aggiungere indici su `player_id`, `dota_account_id`, `match_id` dove necessario
- **Foreign Keys**: Usare FK con `ON DELETE CASCADE` dove appropriato
- **Idempotenza**: Tutte le migrations devono essere idempotenti (IF NOT EXISTS, IF EXISTS)

---

**Prossimi Step**: Creare le migrations per le tabelle critiche mancanti e allineare il codice.

