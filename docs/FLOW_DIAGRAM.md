# 🔄 Diagramma Flussi Completo - Dota-2 Dashboard

## 1. FLUSSO REGISTRAZIONE

```
Utente → /register
  ↓
Compila form (nickname, email, password)
  ↓
supabase.auth.signUp()
  ↓
[TRIGGER] handle_new_user() → Crea user_profile automaticamente
  ↓
Client aggiorna nickname in user_profile
  ↓
Redirect → /onboarding/profile
```

## 2. FLUSSO ONBOARDING

### Step 1: Profilo
```
/onboarding/profile
  ↓
Compila: in_game_name, role_preferred, region, steam_id, skill_self_eval
  ↓
Update user_profile
  ↓
onboarding_status = 'avatar_pending'
  ↓
Redirect → /onboarding/avatar
```

### Step 2: Avatar
```
/onboarding/avatar
  ↓
Seleziona avatar
  ↓
Update user_profile.avatar
  ↓
onboarding_status = 'import_pending'
  ↓
Redirect → /onboarding/import
```

### Step 3: Import Partite
```
/onboarding/import
  ↓
Incolla match IDs (max 20)
  ↓
Per ogni match_id:
  ├─ /api/opendota/import-match?match_id=X&user_id=Y
  │   └─ Salva in raw_matches con user_id
  │
  └─ /api/opendota/build-digest (POST con user_id)
      ├─ Legge da raw_matches
      ├─ ETL: buildDigestFromRaw()
      ├─ [TRIGGER] set_match_date_trigger → popola match_date
      ├─ Upsert matches_digest (con user_id)
      └─ Upsert players_digest (con user_id)
  ↓
Valida partite (durata >= 15 min)
  ↓
Utente seleziona quali includere nel coaching
  ↓
Update matches_digest:
  - is_eligible_for_coaching = (duration >= 15 min)
  - included_in_coaching = (selezionato dall'utente)
  ↓
Update user_profile.onboarding_status = 'complete'
  ↓
Redirect → /dashboard/panoramica
```

## 3. FLUSSO DASHBOARD

### Accesso Dashboard
```
Utente loggato → /dashboard/panoramica
  ↓
[PROXY] Verifica auth → Redirect se non loggato
  ↓
Fetch user_profile
  ↓
Fetch user_statistics
  ↓
Render Dashboard:
  ├─ DashboardHero (KPI principali)
  ├─ KPICards (Winrate, KDA, GPM, XPM)
  ├─ AdvancedMetrics (4 metriche 0-100)
  ├─ TrendChart (grafico multilinea)
  ├─ GamePhaseAnalysis (Early/Mid/Late)
  ├─ RecentMatchesTable (ultime 20 partite)
  └─ CoachingSection (task attivi)
```

### Import Nuova Partita
```
Dashboard → Pulsante "Importa Partita"
  ↓
Inserisci match_id
  ↓
/api/opendota/import-match?match_id=X
  ↓
/api/opendota/build-digest (POST)
  ↓
[TRIGGER] set_match_date_trigger
  ↓
Match salvato con user_id
  ↓
Refresh dashboard
```

### Generazione Task Coaching
```
Dashboard → "Richiedi nuova analisi AI"
  ↓
/api/coaching/generate (POST)
  ↓
Fetch user_statistics
  ↓
Analizza metriche:
  - Se avg_aggressiveness < 50 → Task "Migliora Aggressività"
  - Se avg_farm_efficiency < 50 → Task "Ottimizza Farm"
  - Se avg_macro < 50 → Task "Migliora Macro"
  - Se avg_survivability < 50 → Task "Riduci Morte"
  - Se winrate < 50 → Task "Aumenta Winrate"
  ↓
Insert coaching_tasks
  ↓
Refresh dashboard
```

## 4. FLUSSO CALCOLO METRICHE

### Calcolo Metriche per Match
```
Match importato e processato
  ↓
[FUTURO] Job automatico o API call
  ↓
calculatePlayerMetrics(player, match)
  ↓
Calcola:
  - aggressiveness_score (0-100)
  - farm_efficiency_score (0-100)
  - macro_score (0-100)
  - survivability_score (0-100)
  - early/mid/late KDA, GPM, XPM
  ↓
Insert/Update player_match_metrics
  ↓
[FUTURO] updateUserStatistics(user_id)
  ↓
Aggiorna user_statistics con medie
```

## 5. FLUSSO LOGIN

```
Utente → /login
  ↓
Compila email + password
  ↓
supabase.auth.signInWithPassword()
  ↓
Fetch user_profile.onboarding_status
  ↓
Redirect in base a status:
  - 'complete' → /dashboard/panoramica
  - 'profile_pending' → /onboarding/profile
  - 'avatar_pending' → /onboarding/avatar
  - 'import_pending' → /onboarding/import
```

## 6. FLUSSO HOME

```
Utente → / (root)
  ↓
[PROXY] Verifica auth
  ↓
Se loggato:
  ├─ Fetch user_profile.onboarding_status
  └─ Redirect in base a status
  ↓
Se non loggato:
  └─ Redirect → /login
```

## 📊 Tabelle Coinvolte per Flusso

### Registrazione
- `auth.users` (Supabase Auth)
- `user_profile` (creato da trigger)

### Onboarding
- `user_profile` (update)
- `raw_matches` (insert)
- `matches_digest` (upsert)
- `players_digest` (upsert)

### Dashboard
- `user_profile` (read)
- `user_statistics` (read)
- `matches_digest` (read)
- `players_digest` (read)
- `player_match_metrics` (read)
- `coaching_tasks` (read)
- `user_match_trend` (read - materialized view)

### Coaching
- `user_statistics` (read)
- `coaching_tasks` (insert/update)
- `coaching_task_progress` (insert)

