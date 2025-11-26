# OpenDota + Supabase: Best Practices e Analisi Progetti Open Source

## 📚 Repository di Riferimento Analizzati

### 1. **odota/core** - Piattaforma Dati OpenDota
- **URL**: https://github.com/odota/core
- **Stack**: TypeScript, PostgreSQL
- **Focus**: Backend API, gestione dati match, parsing replay

### 2. **odota/web** - Interfaccia Web React
- **URL**: https://github.com/odota/web
- **Stack**: React, TypeScript
- **Focus**: Dashboard UI, visualizzazione statistiche

### 3. **opendota_modeling** - Esempio Estrazione Dati
- **URL**: https://github.com/sheilaxz/opendota_modeling
- **Focus**: ETL pipeline, machine learning su dati match

## 🔑 Best Practices per Gestione API OpenDota

### 1. **Rate Limiting e Caching**

```typescript
// Esempio struttura per gestione rate limiting
const OPENDOTA_RATE_LIMITS = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
};

// Cache strategy
const CACHE_STRATEGY = {
  matchDetails: '24h',      // Match completati non cambiano
  playerStats: '1h',        // Statistiche player aggiornate frequentemente
  heroStats: '6h',          // Statistiche eroi cambiano lentamente
  liveMatches: '30s',       // Match live aggiornati frequentemente
};
```

**Raccomandazioni:**
- ✅ Usa cache Redis o Supabase Edge Functions per evitare rate limiting
- ✅ Implementa retry logic con exponential backoff
- ✅ Salva match completati in Supabase (non cambiano mai)
- ✅ Usa API key di OpenDota per limiti più alti

### 2. **Struttura Chiamate API**

```typescript
// Pattern consigliato per chiamate API
interface OpenDotaClient {
  // Match endpoints
  getMatch(matchId: number): Promise<RawMatch>;
  getMatchPlayers(matchId: number): Promise<RawPlayer[]>;
  
  // Player endpoints
  getPlayerMatches(accountId: number, limit?: number): Promise<Match[]>;
  getPlayerStats(accountId: number): Promise<PlayerStats>;
  
  // Hero endpoints
  getHeroes(): Promise<Hero[]>;
  getHeroStats(heroId: number): Promise<HeroStats>;
}
```

**Best Practices:**
- ✅ Usa TypeScript interfaces per type safety
- ✅ Implementa error handling robusto
- ✅ Logga tutte le chiamate API per debugging
- ✅ Usa Promise.all() per chiamate parallele quando possibile

## 🗄️ Schema Database Supabase - Raccomandazioni

### 1. **Struttura Tabelle Principali**

```sql
-- Matches (già implementato)
CREATE TABLE matches_digest (
  match_id BIGINT PRIMARY KEY,
  radiant_win BOOLEAN,
  duration INTEGER,
  game_mode INTEGER,
  lobby_type INTEGER,
  -- ... altri campi
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players (già implementato)
CREATE TABLE players_digest (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches_digest(match_id),
  player_slot INTEGER,
  account_id BIGINT,
  hero_id INTEGER,
  -- ... statistiche
  items JSONB,
  position_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_slot)
);

-- Raccomandazioni aggiuntive:
-- 1. Tabelle per Heroes (cache locale)
CREATE TABLE heroes (
  id INTEGER PRIMARY KEY,
  name TEXT,
  localized_name TEXT,
  primary_attr TEXT,
  attack_type TEXT,
  roles TEXT[],
  img TEXT,
  icon TEXT,
  base_health INTEGER,
  base_mana INTEGER,
  -- ... altri attributi
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabelle per Players (aggregazione statistiche)
CREATE TABLE players (
  account_id BIGINT PRIMARY KEY,
  personaname TEXT,
  avatar TEXT,
  last_match_time TIMESTAMPTZ,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate NUMERIC(5,2),
  -- ... altre statistiche aggregate
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabelle per Match History (per query veloci)
CREATE TABLE match_history (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT REFERENCES matches_digest(match_id),
  account_id BIGINT REFERENCES players(account_id),
  hero_id INTEGER,
  won BOOLEAN,
  kills INTEGER,
  deaths INTEGER,
  assists INTEGER,
  match_date TIMESTAMPTZ,
  -- Index per query veloci
  INDEX idx_account_date (account_id, match_date DESC),
  INDEX idx_hero_date (hero_id, match_date DESC)
);
```

### 2. **Indici per Performance**

```sql
-- Indici consigliati per query dashboard
CREATE INDEX idx_players_digest_match_id ON players_digest(match_id);
CREATE INDEX idx_players_digest_account_id ON players_digest(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_players_digest_hero_id ON players_digest(hero_id);
CREATE INDEX idx_matches_digest_date ON matches_digest(created_at DESC);

-- Indice composito per query comuni
CREATE INDEX idx_players_match_hero ON players_digest(match_id, hero_id, account_id);
```

### 3. **Materialized Views per Dashboard**

```sql
-- View per statistiche eroi aggregate
CREATE MATERIALIZED VIEW hero_stats AS
SELECT 
  hero_id,
  COUNT(*) as total_matches,
  SUM(CASE WHEN radiant_win = (player_slot < 128) THEN 1 ELSE 0 END) as wins,
  AVG(kills) as avg_kills,
  AVG(deaths) as avg_deaths,
  AVG(assists) as avg_assists,
  AVG(gold_per_min) as avg_gpm,
  AVG(xp_per_min) as avg_xpm
FROM players_digest pd
JOIN matches_digest md ON pd.match_id = md.match_id
GROUP BY hero_id;

-- Refresh periodico (via cron job o Supabase Edge Function)
REFRESH MATERIALIZED VIEW hero_stats;
```

## 🎨 Dashboard - Pattern UI/UX da Progetti Open Source

### 1. **Componenti Dashboard Principali**

Basandosi su **odota/web**, struttura consigliata:

```
Dashboard Layout:
├── Header
│   ├── Navigation (Matches, Players, Heroes, Statistics)
│   └── Search Bar (per match_id, account_id, hero)
├── Main Content
│   ├── Match Overview
│   │   ├── Match Details (duration, mode, result)
│   │   ├── Team Radiant (5 players)
│   │   ├── Team Dire (5 players)
│   │   └── Match Timeline (opzionale)
│   ├── Player Stats
│   │   ├── Player Profile
│   │   ├── Recent Matches Table
│   │   ├── Hero Performance Chart
│   │   └── Win Rate by Role
│   └── Hero Stats
│       ├── Hero Picker
│       ├── Win Rate Chart
│       ├── Popular Items
│       └── Matchups (counter/synergy)
└── Sidebar
    ├── Quick Stats
    ├── Recent Activity
    └── Filters
```

### 2. **Librerie UI Consigliate**

- **Charts**: Recharts o Chart.js per grafici statistiche
- **Tables**: TanStack Table (React Table) per tabelle dati
- **UI Components**: shadcn/ui o Radix UI per componenti accessibili
- **Icons**: Heroicons o Lucide React per icone

### 3. **Data Fetching Pattern (Next.js App Router)**

```typescript
// app/matches/[matchId]/page.tsx
export default async function MatchPage({ params }: { params: { matchId: string } }) {
  // Server-side data fetching
  const match = await getMatchFromSupabase(Number(params.matchId));
  const players = await getPlayersFromSupabase(Number(params.matchId));
  
  return (
    <div>
      <MatchHeader match={match} />
      <MatchTeams radiant={players.filter(p => p.player_slot < 128)} 
                  dire={players.filter(p => p.player_slot >= 128)} />
      <MatchStats match={match} players={players} />
    </div>
  );
}

// Client component per interattività
'use client';
export function MatchStats({ match, players }: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  // ... logica client-side
}
```

## 🔄 ETL Pipeline - Pattern da opendota_modeling

### 1. **Flusso Dati Consigliato**

```
OpenDota API
    ↓
[Import Match] → raw_matches (JSON completo)
    ↓
[Build Digest] → matches_digest + players_digest (normalizzato)
    ↓
[Aggregate Stats] → players (statistiche aggregate)
    ↓
[Materialized Views] → hero_stats, match_history (per dashboard)
```

### 2. **Cronologia e Scheduling**

```typescript
// Pattern per aggiornamento dati
const UPDATE_STRATEGY = {
  // Match completati: import una volta, mai aggiornati
  completedMatches: 'once',
  
  // Statistiche player: aggiorna ogni 24h
  playerStats: 'daily',
  
  // Hero stats: aggiorna ogni settimana
  heroStats: 'weekly',
  
  // Match live: polling ogni 30s (se supportato)
  liveMatches: 'realtime',
};
```

**Implementazione:**
- ✅ Usa Vercel Cron Jobs o Supabase Edge Functions per scheduling
- ✅ Implementa queue system per batch processing
- ✅ Logga tutti gli aggiornamenti per audit

## 🚀 Architettura Consigliata per Dashboard

### Stack Tecnologico

```
Frontend:
├── Next.js 14+ (App Router)
├── TypeScript
├── Tailwind CSS
├── shadcn/ui (componenti)
└── Recharts (grafici)

Backend:
├── Supabase (PostgreSQL + Auth + Storage)
├── Vercel Edge Functions (API routes)
└── Vercel Cron Jobs (scheduling)

Data Layer:
├── Supabase Database (primary)
├── Supabase Realtime (subscriptions)
└── Redis Cache (opzionale, per rate limiting)
```

### Struttura Progetto

```
app/
├── (dashboard)/
│   ├── matches/
│   │   ├── [matchId]/
│   │   │   └── page.tsx
│   │   └── page.tsx (lista match)
│   ├── players/
│   │   ├── [accountId]/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   └── heroes/
│       ├── [heroId]/
│       │   └── page.tsx
│       └── page.tsx
├── api/
│   ├── opendota/
│   │   ├── import-match/
│   │   └── build-digest/
│   └── cron/
│       ├── update-player-stats/
│       └── refresh-hero-stats/
└── components/
    ├── dashboard/
    ├── matches/
    ├── players/
    └── heroes/

lib/
├── opendota/        # Client API OpenDota
├── supabase/        # Client Supabase
├── etl/            # Transformation logic
└── utils/          # Utilities
```

## 📊 Metriche e Monitoring

### 1. **Metriche da Tracciare**

- API call rate (OpenDota)
- Database query performance
- Cache hit rate
- Error rate
- User engagement (se applicabile)

### 2. **Logging Consigliato**

```typescript
// Structured logging
logger.info('match_imported', {
  match_id: matchId,
  duration: duration,
  players_count: players.length,
  source: 'opendota',
});
```

## ✅ Checklist Implementazione Dashboard

- [ ] Setup Supabase schema completo (matches, players, heroes)
- [ ] Implementa client OpenDota con rate limiting
- [ ] Crea ETL pipeline robusta (import + digest)
- [ ] Setup materialized views per performance
- [ ] Implementa caching strategy
- [ ] Crea componenti UI dashboard base
- [ ] Implementa routing Next.js per matches/players/heroes
- [ ] Aggiungi grafici e visualizzazioni
- [ ] Setup cron jobs per aggiornamenti automatici
- [ ] Implementa error handling e retry logic
- [ ] Aggiungi logging strutturato
- [ ] Performance optimization (lazy loading, pagination)

## 🔗 Risorse Utili

- **OpenDota API Docs**: https://docs.opendota.com/
- **Supabase Docs**: https://supabase.com/docs
- **Next.js App Router**: https://nextjs.org/docs/app
- **OpenDota Core Repo**: https://github.com/odota/core
- **OpenDota Web Repo**: https://github.com/odota/web

