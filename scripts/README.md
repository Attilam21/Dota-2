# Scripts per interrogare Supabase

## Prerequisiti

Per usare lo script `query-supabase.ts`, devi avere le variabili d'ambiente configurate:

1. Crea un file `.env.local` nella root del progetto con:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Oppure esporta le variabili d'ambiente nel terminale:
   ```powershell
   $env:SUPABASE_URL="your_supabase_url"
   $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   ```

## Uso

### Metodo 1: Script npm (consigliato)
```powershell
npm run query:db players_digest 8576841486
npm run query:db matches_digest 8576841486
npm run query:db raw_matches 8576841486
```

### Metodo 2: tsx diretto
```powershell
npx tsx scripts/query-supabase.ts players_digest 8576841486
```

## Tabelle disponibili

- `matches_digest` - Query su matches_digest
- `players_digest` - Query su players_digest  
- `raw_matches` - Query su raw_matches

## Alternativa: Interfaccia Web Supabase

Se non vuoi configurare le variabili d'ambiente localmente, puoi usare l'interfaccia web di Supabase:

1. Vai su https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Vai su "SQL Editor" o "Table Editor"
4. Esegui query SQL direttamente:

```sql
-- Query matches_digest
SELECT * FROM public.matches_digest WHERE match_id = 8576841486;

-- Query players_digest
SELECT * FROM public.players_digest WHERE match_id = 8576841486 ORDER BY player_slot;

-- Query raw_matches
SELECT match_id, source, ingested_at FROM public.raw_matches WHERE match_id = 8576841486;
```

