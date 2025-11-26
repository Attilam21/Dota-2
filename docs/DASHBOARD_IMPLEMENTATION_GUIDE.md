# Guida Implementazione Dashboard - Dota 2

## 🎯 Obiettivo
Creare una dashboard completa per visualizzare e analizzare dati di Dota 2 usando OpenDota API e Supabase.

## 📋 Fase 1: Setup Database Schema Completo

### 1.1 Tabelle Aggiuntive Necessarie

```sql
-- Heroes table (cache locale per performance)
CREATE TABLE IF NOT EXISTS heroes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  localized_name TEXT NOT NULL,
  primary_attr TEXT CHECK (primary_attr IN ('str', 'agi', 'int', 'all')),
  attack_type TEXT CHECK (attack_type IN ('Melee', 'Ranged')),
  roles TEXT[],
  img TEXT,
  icon TEXT,
  base_health INTEGER,
  base_health_regen NUMERIC,
  base_mana INTEGER,
  base_mana_regen NUMERIC,
  base_armor INTEGER,
  base_mr INTEGER,
  base_attack_min INTEGER,
  base_attack_max INTEGER,
  base_str INTEGER,
  base_agi INTEGER,
  base_int INTEGER,
  str_gain NUMERIC,
  agi_gain NUMERIC,
  int_gain NUMERIC,
  attack_range INTEGER,
  projectile_speed INTEGER,
  attack_rate NUMERIC,
  move_speed INTEGER,
  turn_rate NUMERIC,
  cm_enabled BOOLEAN DEFAULT true,
  legs INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table (statistiche aggregate)
CREATE TABLE IF NOT EXISTS players (
  account_id BIGINT PRIMARY KEY,
  personaname TEXT,
  avatar TEXT,
  avatarfull TEXT,
  profileurl TEXT,
  last_match_time TIMESTAMPTZ,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate NUMERIC(5,2),
  avg_kills NUMERIC(5,2),
  avg_deaths NUMERIC(5,2),
  avg_assists NUMERIC(5,2),
  avg_gpm NUMERIC(8,2),
  avg_xpm NUMERIC(8,2),
  most_played_hero_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hero stats materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS hero_stats AS
SELECT 
  pd.hero_id,
  COUNT(*) as total_matches,
  COUNT(DISTINCT pd.match_id) as unique_matches,
  SUM(CASE WHEN md.radiant_win = (pd.player_slot < 128) THEN 1 ELSE 0 END) as wins,
  COUNT(*) - SUM(CASE WHEN md.radiant_win = (pd.player_slot < 128) THEN 1 ELSE 0 END) as losses,
  ROUND(
    100.0 * SUM(CASE WHEN md.radiant_win = (pd.player_slot < 128) THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as win_rate,
  ROUND(AVG(pd.kills), 2) as avg_kills,
  ROUND(AVG(pd.deaths), 2) as avg_deaths,
  ROUND(AVG(pd.assists), 2) as avg_assists,
  ROUND(AVG(pd.gold_per_min), 2) as avg_gpm,
  ROUND(AVG(pd.xp_per_min), 2) as avg_xpm,
  ROUND(AVG(pd.hero_damage), 0) as avg_hero_damage,
  ROUND(AVG(pd.tower_damage), 0) as avg_tower_damage
FROM players_digest pd
JOIN matches_digest md ON pd.match_id = md.match_id
WHERE pd.hero_id IS NOT NULL
GROUP BY pd.hero_id;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_heroes_name ON heroes(localized_name);
CREATE INDEX IF NOT EXISTS idx_players_personaname ON players(personaname);
CREATE INDEX IF NOT EXISTS idx_players_digest_hero_account ON players_digest(hero_id, account_id);
```

## 📋 Fase 2: Client OpenDota Migliorato

### 2.1 Client con Rate Limiting e Caching

```typescript
// lib/opendota/client.ts
import { RawMatch } from '@/lib/types/opendota';

interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

class OpenDotaClient {
  private baseUrl = 'https://api.opendota.com/api';
  private apiKey: string | null = null;
  private rateLimits: RateLimit = {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENDOTA_API_KEY || null;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}${this.apiKey ? `?api_key=${this.apiKey}` : ''}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      }
      throw new Error(`OpenDota API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getMatch(matchId: number): Promise<RawMatch> {
    return this.request<RawMatch>(`/matches/${matchId}`);
  }

  async getPlayerMatches(accountId: number, limit = 10): Promise<RawMatch[]> {
    return this.request<RawMatch[]>(`/players/${accountId}/matches?limit=${limit}`);
  }

  async getPlayerStats(accountId: number) {
    return this.request(`/players/${accountId}`);
  }

  async getHeroes() {
    return this.request('/heroes');
  }

  async getHeroStats(heroId: number) {
    return this.request(`/heroes/${heroId}/matchups`);
  }
}

export const opendotaClient = new OpenDotaClient();
```

## 📋 Fase 3: API Routes per Dashboard

### 3.1 Endpoint per Heroes

```typescript
// app/api/heroes/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // Controlla se heroes esistono in cache
    const { data: heroes, error } = await supabaseAdmin
      .from('heroes')
      .select('*')
      .order('localized_name');

    if (error) {
      console.error('[heroes] Error fetching heroes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch heroes' },
        { status: 500 }
      );
    }

    // Se non ci sono heroes, importali da OpenDota
    if (!heroes || heroes.length === 0) {
      // TODO: Implementare import heroes da OpenDota
      return NextResponse.json(
        { error: 'Heroes not found. Please import heroes first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ heroes });
  } catch (error) {
    console.error('[heroes] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.2 Endpoint per Hero Stats

```typescript
// app/api/heroes/[heroId]/stats/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: { heroId: string } }
) {
  try {
    const heroId = parseInt(params.heroId);

    if (isNaN(heroId)) {
      return NextResponse.json(
        { error: 'Invalid hero ID' },
        { status: 400 }
      );
    }

    // Query materialized view
    const { data: stats, error } = await supabaseAdmin
      .from('hero_stats')
      .select('*')
      .eq('hero_id', heroId)
      .single();

    if (error) {
      console.error('[hero-stats] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hero stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[hero-stats] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.3 Endpoint per Player Stats

```typescript
// app/api/players/[accountId]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const accountId = parseInt(params.accountId);

    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    // Fetch player stats aggregate
    const { data: player, error: playerError } = await supabaseAdmin
      .from('players')
      .select('*')
      .eq('account_id', accountId)
      .single();

    // Fetch recent matches
    const { data: recentMatches, error: matchesError } = await supabaseAdmin
      .from('players_digest')
      .select(`
        match_id,
        hero_id,
        kills,
        deaths,
        assists,
        gold_per_min,
        xp_per_min,
        matches_digest!inner(radiant_win, duration, game_mode)
      `)
      .eq('account_id', accountId)
      .order('match_id', { ascending: false })
      .limit(20);

    if (playerError || matchesError) {
      console.error('[player] Error:', playerError || matchesError);
      return NextResponse.json(
        { error: 'Failed to fetch player data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      player,
      recentMatches: recentMatches || [],
    });
  } catch (error) {
    console.error('[player] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 📋 Fase 4: Componenti Dashboard

### 4.1 Match Overview Component

```typescript
// app/components/dashboard/MatchOverview.tsx
'use client';

import { MatchDigest, PlayerDigest } from '@/lib/types/opendota';

interface MatchOverviewProps {
  match: MatchDigest;
  players: PlayerDigest[];
}

export function MatchOverview({ match, players }: MatchOverviewProps) {
  const radiantPlayers = players.filter(p => p.player_slot < 128);
  const direPlayers = players.filter(p => p.player_slot >= 128);

  return (
    <div className="match-overview">
      <div className="match-header">
        <h2>Match {match.match_id}</h2>
        <div className="match-result">
          {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
        </div>
        <div className="match-duration">
          {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="teams">
        <div className="team radiant">
          <h3>Radiant</h3>
          {radiantPlayers.map(player => (
            <PlayerCard key={player.player_slot} player={player} />
          ))}
        </div>

        <div className="team dire">
          <h3>Dire</h3>
          {direPlayers.map(player => (
            <PlayerCard key={player.player_slot} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerDigest }) {
  return (
    <div className="player-card">
      <div className="hero-info">
        Hero {player.hero_id}
      </div>
      <div className="player-stats">
        <span>K: {player.kills}</span>
        <span>D: {player.deaths}</span>
        <span>A: {player.assists}</span>
        <span>GPM: {player.gold_per_min}</span>
      </div>
    </div>
  );
}
```

### 4.2 Hero Stats Chart

```typescript
// app/components/dashboard/HeroStatsChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HeroStatsChartProps {
  data: Array<{
    date: string;
    winRate: number;
    pickRate: number;
  }>;
}

export function HeroStatsChart({ data }: HeroStatsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="winRate" stroke="#8884d8" name="Win Rate %" />
        <Line type="monotone" dataKey="pickRate" stroke="#82ca9d" name="Pick Rate %" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## 📋 Fase 5: Pages Dashboard

### 5.1 Match Detail Page

```typescript
// app/matches/[matchId]/page.tsx
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MatchOverview } from '@/app/components/dashboard/MatchOverview';
import { MatchDigest, PlayerDigest } from '@/lib/types/opendota';

export default async function MatchPage({
  params,
}: {
  params: { matchId: string };
}) {
  const matchId = parseInt(params.matchId);

  // Fetch match
  const { data: match, error: matchError } = await supabaseAdmin
    .from('matches_digest')
    .select('*')
    .eq('match_id', matchId)
    .single();

  // Fetch players
  const { data: players, error: playersError } = await supabaseAdmin
    .from('players_digest')
    .select('*')
    .eq('match_id', matchId)
    .order('player_slot');

  if (matchError || playersError || !match || !players) {
    return <div>Match not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <MatchOverview match={match as MatchDigest} players={players as PlayerDigest[]} />
    </div>
  );
}
```

### 5.2 Heroes List Page

```typescript
// app/heroes/page.tsx
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';

export default async function HeroesPage() {
  const { data: heroes, error } = await supabaseAdmin
    .from('heroes')
    .select('id, localized_name, primary_attr, attack_type')
    .order('localized_name');

  if (error || !heroes) {
    return <div>Error loading heroes</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Heroes</h1>
      <div className="grid grid-cols-4 gap-4">
        {heroes.map(hero => (
          <Link
            key={hero.id}
            href={`/heroes/${hero.id}`}
            className="border rounded p-4 hover:bg-gray-100"
          >
            <h3 className="font-semibold">{hero.localized_name}</h3>
            <p className="text-sm text-gray-600">
              {hero.primary_attr} • {hero.attack_type}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

## 📋 Fase 6: Cron Jobs per Aggiornamenti

### 6.1 Update Hero Stats

```typescript
// app/api/cron/update-hero-stats/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  // Verifica header per sicurezza (Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Refresh materialized view
    const { error } = await supabaseAdmin.rpc('refresh_hero_stats');

    if (error) {
      console.error('[cron] Error refreshing hero stats:', error);
      return NextResponse.json(
        { error: 'Failed to refresh hero stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[cron] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## ✅ Prossimi Passi

1. **Implementa schema database completo** (heroes, players tables)
2. **Crea API route per import heroes** da OpenDota
3. **Implementa componenti UI base** (MatchOverview, HeroStats, etc.)
4. **Crea pagine dashboard** (matches, players, heroes)
5. **Setup cron jobs** per aggiornamenti automatici
6. **Aggiungi grafici e visualizzazioni** con Recharts
7. **Implementa search e filtri** per match/players
8. **Ottimizza performance** (caching, pagination, lazy loading)

