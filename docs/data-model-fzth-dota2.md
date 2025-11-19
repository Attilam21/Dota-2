# Modello Dati FZTH Dota 2 (Proposta)

Questa è una proposta di struttura dati logica (documentazione) per l'app FZTH – Dota 2 Dashboard. Non crea ancora tabelle reali in Supabase.

## 1. players

- id: uuid (PK)
- dota_account_id: integer (OpenDota/Steam32)
- nickname: text
- rank_tier: text (es. "Ancient 3", "Divine 1" o codice OpenDota)
- region: text (es. "EU West", "US East")
- created_at: timestamptz (default now)
- updated_at: timestamptz (auto-update trigger in futuro)

Note:
- `dota_account_id` è il riferimento per le API OpenDota.
- `rank_tier` si può mappare agli ID OpenDota, ma manteniamo stringa leggibile lato UI.

## 2. matches_digest

- id: uuid (PK)
- player_id: uuid (FK → players.id)
- match_id: bigint (OpenDota match ID)
- hero_id: integer
- kills: integer
- deaths: integer
- assists: integer
- duration_seconds: integer
- start_time: timestamptz (UTC)
- result: text (enum: "win" | "lose")
- lane: text (es. "safe", "mid", "off", "jungle", "roaming")
- role: text (es. "core", "support", "hard support", "offlane", "mid")
- kda: numeric (calcolato, es. (kills + assists) / max(1, deaths))
- gpm: integer (opzionale, futura espansione)
- xpm: integer (opzionale, futura espansione)

Indici consigliati:
- idx_matches_digest_player_id
- idx_matches_digest_match_id (unique per evitare duplicati)

## 3. hero_aggregates

- id: uuid (PK)
- player_id: uuid (FK → players.id)
- hero_id: integer
- games_played: integer
- wins: integer
- losses: integer
- avg_kda: numeric
- avg_duration: integer (seconds)
- last_played_at: timestamptz

Indici consigliati:
- unique (player_id, hero_id)

## 4. profiling

- id: uuid (PK)
- player_id: uuid (FK → players.id)
- primary_role: text (es. "carry", "mid", "offlane", "soft support", "hard support")
- playstyle: text
- strengths: text
- weaknesses: text
- tags: text | text[] (es. "aggressivo, farming, roamer" oppure array)
- last_updated_at: timestamptz

Note:
- Campi testuali liberi per iniziare, normalizzazione opzionale più avanti.

## 5. coaching_tasks

- id: uuid (PK)
- player_id: uuid (FK → players.id)
- title: text
- description: text
- status: text (enum: "todo" | "in_progress" | "done")
- created_at: timestamptz (default now)
- completed_at: timestamptz (nullable)
- related_match_id: bigint (OpenDota match ID, opzionale)

Indici consigliati:
- idx_coaching_tasks_player_id
- idx_coaching_tasks_status

---

## Relazioni principali
- `players (1) → matches_digest (N)`
- `players (1) → hero_aggregates (N)`
- `players (1) → profiling (1)`
- `players (1) → coaching_tasks (N)`

## Note di implementazione futura
- Creazione di viste/materialized views per KPI e trend su periodi.
- Trigger per aggiornare `updated_at` e calcolare KPI sintetici.
- Politiche RLS in Supabase per isolare dati per utente autenticato.

---

## Endpoint OpenDota utilizzati in futuro
- `/players/{id}`: profilo/riassunto giocatore
- `/players/{id}/recentMatches`: ultimi match (digest)
- `/players/{id}/matches`: storico partite (paginato/filtrabile)
- `/players/{id}/heroes`: aggregati per eroe
- `/players/{id}/totals`: totali e KPI sintetici
- `/matches/{match_id}`: dettaglio singolo match
- `/players/{id}/wl`: win/loss complessivo o per periodo

