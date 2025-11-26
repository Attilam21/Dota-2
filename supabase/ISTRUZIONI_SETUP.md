# 🚀 Istruzioni Setup Supabase - DOTA-2 Dashboard

## 📋 Script da Eseguire

**File:** `supabase/setup_complete.sql`

## ✅ Step-by-Step

1. **Apri Supabase Dashboard**
   - Vai su https://supabase.com/dashboard
   - Seleziona il tuo progetto

2. **Apri SQL Editor**
   - Nel menu laterale, clicca su **"SQL Editor"**
   - Clicca su **"New query"**

3. **Copia lo Script**
   - Apri il file `supabase/setup_complete.sql`
   - Seleziona tutto il contenuto (Ctrl+A / Cmd+A)
   - Copia (Ctrl+C / Cmd+C)

4. **Incolla e Esegui**
   - Incolla lo script nel SQL Editor di Supabase
   - Clicca su **"Run"** (o premi Ctrl+Enter / Cmd+Enter)

5. **Verifica Risultato**
   - Dovresti vedere "Success. No rows returned"
   - Se ci sono errori, controlla il messaggio

## 🔍 Verifica Setup

Dopo aver eseguito lo script, esegui queste query per verificare:

### Verifica Tabelle
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

### Verifica Trigger
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

### Verifica RLS Policies
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## ⚠️ Note Importanti

- Lo script è **idempotente**: puoi eseguirlo più volte senza problemi
- Le tabelle esistenti non vengono eliminate
- Le colonne vengono aggiunte solo se non esistono già
- I trigger vengono ricreati se già esistono

## 🐛 Troubleshooting

### Errore: "relation already exists"
- **Normale**: significa che la tabella esiste già, lo script continua

### Errore: "column already exists"
- **Normale**: significa che la colonna esiste già, lo script continua

### Errore: "permission denied"
- Verifica di avere i permessi di amministratore sul progetto Supabase

### Errore: "function does not exist"
- Esegui di nuovo lo script completo, potrebbe essere un problema di ordine di esecuzione

## ✅ Checklist Post-Setup

- [ ] Script eseguito senza errori critici
- [ ] Tutte le 7 tabelle create
- [ ] Tutti i 5 trigger attivi
- [ ] Tutte le policy RLS configurate
- [ ] Materialized view `user_match_trend` creata
- [ ] Indici creati

## 🎯 Prossimi Step

Dopo aver eseguito lo script:
1. Testa la registrazione di un nuovo utente
2. Verifica che `user_profile` venga creato automaticamente
3. Testa l'import di un match
4. Verifica che `match_date` venga popolato automaticamente

