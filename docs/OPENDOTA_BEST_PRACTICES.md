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

`ercando su GitHub progetti open source che usano OpenDota e Supabase per analizzare le best practice:
Cercando progetti più specifici su OpenDota e dashboard:
Cercando il repository ufficiale di OpenDota e progetti popolari che usano l'API:
Cercando il repository principale di OpenDota:
Cercando il README e la struttura del progetto:
Cercando progetti Next.js che usano OpenDota:
Cercando progetti popolari che usano l'API di OpenDota e analizzando il codice:
Esplorando i repository menzionati per analizzare il codice:
Cercando file specifici che mostrano la gestione delle API e la struttura del database. Analizzando il repository core di OpenDota per la struttura del database:
Creando un documento di analisi con le best practice trovate:
OPENDOTA_BEST_PRACTICES.md
+397
# OpenDota + Supabase: Best Practices e Analisi Progetti Open Source## 📚 Repository di Riferimento Analizzati### 1. **odota/core** - Piattaforma Dati OpenDota- **URL**: https://github.com/odota/core
Creando un documento con esempi di codice pratici per il progetto:
DASHBOARD_IMPLEMENTATION_GUIDE.md
+560
# Guida Implementazione Dashboard - Dota 2## 🎯 ObiettivoCreare una dashboard completa per visualizzare e analizzare dati di Dota 2 usando OpenDota API e Supabase.## 📋 Fase 1: Setup Database Schema Completo
Analisi completata
Ho analizzato i progetti open source di OpenDota e creato due documenti:
Documenti creati
1. docs/OPENDOTA_BEST_PRACTICES.md
Analisi dei repository: odota/core, odota/web, opendota_modeling
Best practices per gestione API (rate limiting, caching)
Schema database consigliato (heroes, players, materialized views)
Pattern UI/UX da progetti esistenti
Architettura consigliata per dashboard
Checklist implementazione
2. docs/DASHBOARD_IMPLEMENTATION_GUIDE.md
Esempi di codice TypeScript/Next.js
Schema SQL per tabelle aggiuntive (heroes, players)
Client OpenDota con rate limiting
API routes per dashboard (heroes, players, stats)
Componenti React per UI
Cron jobs per aggiornamenti automatici
Insight principali
Rate limiting: OpenDota ha limiti (60 req/min, 1000/ora). Usa caching e API key.
Schema database: aggiungi tabelle heroes e players per performance.
Materialized views: usa per statistiche aggregate (hero stats, win rates).
Caching: match completati non cambiano → salvali in Supabase.
UI pattern: struttura simile a odota/web (match overview, player stats, hero stats).
Prossimi passi consigliati
Implementa schema database completo (vedi SQL in DASHBOARD_IMPLEMENTATION_GUIDE.md)
Crea API route per import heroes da OpenDota
Implementa componenti UI base (MatchOverview, HeroStats)
Crea pagine dashboard (matches, players, heroes)
Vuoi che inizi a implementare una di queste parti?


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

