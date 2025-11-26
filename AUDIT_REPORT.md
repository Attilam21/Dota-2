# AUDIT REPORT: Schema Supabase vs TypeScript ETL Contract

## Data: 2025-11-26
## Match ID testato: 8576841486

---

## ✅ CONFRONTO SCHEMA DB vs PlayerDigest TypeScript

### Colonne DB vs Campi TypeScript

| Colonna DB | Tipo DB | Campo TypeScript | Tipo TS | Stato |
|------------|---------|------------------|---------|-------|
| id | bigint | - | - | ✅ OK (PK auto) |
| match_id | bigint | match_id | number | ✅ OK |
| player_slot | integer | player_slot | number | ✅ OK |
| account_id | bigint | account_id | number \| null | ✅ OK |
| hero_id | integer | hero_id | number | ✅ OK |
| kills | integer | kills | number \| null | ✅ OK |
| deaths | integer | deaths | number \| null | ✅ OK |
| assists | integer | assists | number \| null | ✅ OK |
| gold_per_min | numeric | gold_per_min | number \| null | ✅ OK |
| xp_per_min | numeric | xp_per_min | number \| null | ✅ OK |
| gold_spent | integer | gold_spent | number \| null | ✅ OK |
| last_hits | integer | last_hits | number \| null | ✅ OK |
| denies | integer | denies | number \| null | ✅ OK |
| net_worth | integer | net_worth | number \| null | ✅ OK |
| hero_damage | integer | hero_damage | number \| null | ✅ OK |
| tower_damage | integer | tower_damage | number \| null | ✅ OK |
| damage_taken | integer | damage_taken | number \| null | ✅ OK |
| teamfight_participation | numeric | teamfight_participation | number \| null | ✅ OK |
| kda | numeric | kda | number \| null | ✅ OK |
| kill_participation | numeric | kill_participation | number \| null | ✅ OK |
| lane | integer | lane | number \| null | ✅ OK |
| lane_role | integer | lane_role | number \| null | ✅ OK |
| vision_score | integer | vision_score | number \| null | ✅ OK |
| items | **jsonb** | items | Record<string, unknown> \| null | ✅ OK |
| position_metrics | **jsonb** | position_metrics | Record<string, unknown> \| null | ✅ OK |
| created_at | timestamptz | - | - | ✅ OK (auto) |
| updated_at | timestamptz | - | - | ✅ OK (auto) |

---

## 🔴 PROBLEMA IDENTIFICATO

### Errore Vercel:
```
invalid input syntax for type integer: "{"npc_dota_hero_pudge":8320,"npc_dota_badguys_siege":17..."
```

### Analisi:
L'errore mostra un oggetto JSON con chiavi tipo `"npc_dota_hero_pudge"` che viene passato a una colonna INTEGER. Questo oggetto **NON è presente** nel `PlayerDigest` TypeScript che costruiamo nell'ETL.

### Possibili cause:

1. **Campo OpenDota non mappato**: Il JSON OpenDota grezzo contiene campi come:
   - `damage_targets`: `{ "npc_dota_hero_pudge": 8320, ... }`
   - `damage_targets_names`: oggetto con nomi
   - Altri campi dinamici non definiti in `RawPlayer`

2. **Supabase mapping automatico**: Se Supabase fa un mapping automatico basato sui nomi delle colonne, potrebbe cercare di mappare un campo del JSON a una colonna esistente.

3. **Campo extra nel payload**: Anche se l'ETL costruisce esplicitamente solo i campi di `PlayerDigest`, potrebbe esserci un campo extra che viene incluso per errore.

---

## 🔍 VERIFICA NECESSARIA

### Query SQL per verificare colonne problematiche:
```sql
-- Verifica se ci sono colonne INTEGER che potrebbero ricevere oggetti JSON
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'players_digest'
  AND data_type = 'integer'
  AND column_name NOT IN (
    'player_slot', 'hero_id', 'kills', 'deaths', 'assists',
    'gold_spent', 'last_hits', 'denies', 'net_worth',
    'hero_damage', 'tower_damage', 'damage_taken',
    'lane', 'lane_role', 'vision_score'
  );
```

### Verifica payload effettivo:
Aggiungere logging per vedere esattamente cosa viene passato a Supabase:
```typescript
console.log('[build-digest] Sample player payload:', JSON.stringify(digest.players[0], null, 2));
```

---

## 💡 SOLUZIONI PROPOSTE

### Soluzione 1: Filtraggio esplicito del payload (CONSIGLIATA)
Modificare l'upsert per passare solo i campi esplicitamente definiti in `PlayerDigest`, escludendo qualsiasi campo extra.

### Soluzione 2: Validazione del payload
Aggiungere una funzione di validazione che rimuove campi non definiti in `PlayerDigest` prima dell'upsert.

### Soluzione 3: Verifica colonne DB extra
Verificare se nel DB esistono colonne che non sono nel nostro schema TypeScript e che potrebbero causare conflitti.

---

## 📋 CHECKLIST PRE-FIX

- [x] Schema DB verificato - tutte le colonne corrispondono a PlayerDigest
- [x] `items` è JSONB ✓
- [x] `position_metrics` è JSONB ✓
- [ ] Payload effettivo verificato (da fare con logging)
- [ ] Campi OpenDota extra identificati (da verificare)
- [ ] Filtraggio payload implementato (da fare)

---

## 🎯 PROSSIMI STEP

1. Aggiungere logging per vedere il payload esatto
2. Implementare filtraggio esplicito dei campi nell'upsert
3. Testare con match_id 8576841486

