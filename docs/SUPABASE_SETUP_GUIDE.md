# 🗄️ Guida Setup Completo Supabase

## 📋 Schema Database Finale

Lo schema completo è in `supabase/schema_final.sql`. Questo file contiene:

### Tabelle Principali

1. **user_profile** - Profilo utente e onboarding
2. **matches_digest** - Match normalizzati (con colonne aggiuntive per coaching)
3. **players_digest** - Player normalizzati (con user_id)
4. **player_match_metrics** - Metriche avanzate per match
5. **coaching_tasks** - Task di coaching generati
6. **coaching_task_progress** - Tracking progresso task
7. **user_statistics** - Statistiche aggregate utente

### Funzionalità Automatiche

1. **Trigger `handle_new_user()`** - Crea automaticamente `user_profile` quando si registra un utente
2. **Trigger `set_match_date_trigger`** - Popola `match_date` da `start_time` automaticamente
3. **Trigger `update_updated_at_column()`** - Aggiorna `updated_at` automaticamente

### Row Level Security (RLS)

Tutte le tabelle hanno RLS abilitato con policy che permettono agli utenti di vedere solo i propri dati.

## 🚀 Setup Step-by-Step

### Step 1: Esegui Schema SQL

1. Vai su Supabase Dashboard → SQL Editor
2. Copia e incolla il contenuto di `supabase/schema_final.sql`
3. Esegui lo script
4. Verifica che tutte le tabelle siano create

### Step 2: Verifica Tabelle Create

Esegui questa query per verificare:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_profile',
    'matches_digest',
    'players_digest',
    'player_match_metrics',
    'coaching_tasks',
    'coaching_task_progress',
    'user_statistics'
  )
ORDER BY table_name;
```

### Step 3: Verifica Trigger

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

Dovresti vedere:
- `on_auth_user_created` su `auth.users`
- `set_match_date_trigger` su `matches_digest`
- `update_user_profile_updated_at` su `user_profile`
- `update_user_statistics_updated_at` su `user_statistics`
- `update_coaching_tasks_updated_at` su `coaching_tasks`

### Step 4: Verifica RLS Policies

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🔄 Flusso Registrazione

1. **Utente si registra** → `supabase.auth.signUp()`
2. **Trigger automatico** → `handle_new_user()` crea `user_profile` con `onboarding_status = 'profile_pending'`
3. **Client aggiorna nickname** → `user_profile.upsert()` con nickname
4. **Redirect** → `/onboarding/profile`

## 🔄 Flusso Import Match

1. **Import match** → `/api/opendota/import-match?match_id=X&user_id=Y`
2. **Build digest** → `/api/opendota/build-digest` con `user_id`
3. **Trigger automatico** → `set_match_date_trigger` popola `match_date` da `start_time`
4. **Match salvato** → `matches_digest` e `players_digest` con `user_id`

## 🔄 Flusso Onboarding

1. **Step 1: Profilo** → Aggiorna `user_profile` → `onboarding_status = 'avatar_pending'`
2. **Step 2: Avatar** → Aggiorna `user_profile.avatar` → `onboarding_status = 'import_pending'`
3. **Step 3: Import** → Importa match → Aggiorna `matches_digest.included_in_coaching` → `onboarding_status = 'complete'`

## 📊 Calcolo Metriche

Le metriche avanzate vengono calcolate quando:
- Un match viene importato e processato
- Viene chiamata la funzione `calculatePlayerMetrics()`
- I dati vengono salvati in `player_match_metrics`

## ✅ Checklist Verifica

- [ ] Schema SQL eseguito senza errori
- [ ] Tutte le tabelle create
- [ ] Tutti i trigger attivi
- [ ] RLS policies configurate
- [ ] Indici creati
- [ ] Materialized view `user_match_trend` creata
- [ ] Test registrazione funziona
- [ ] Test import match funziona
- [ ] Test onboarding completo funziona

## 🐛 Troubleshooting

### Problema: Registrazione fallisce
- Verifica che il trigger `on_auth_user_created` sia attivo
- Verifica che la policy `Users can insert own profile` esista

### Problema: match_date è NULL
- Verifica che il trigger `set_match_date_trigger` sia attivo
- Verifica che `start_time` sia presente in `matches_digest`

### Problema: RLS blocca query
- Verifica che l'utente sia autenticato
- Verifica che le policy siano corrette
- Usa `supabaseAdmin` per operazioni server-side

