import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRecentMatches } from '@/services/dota/opendotaAdapter'

type FzthKpi = {
  totalMatches: number
  winrate: number
  avgKda: number
  avgDurationMin: number
}

type FzthProfileResponse = {
  playerId: number
  internalPlayerId: string
  hasKpi: boolean
  kpi: FzthKpi | null
  level: {
    currentLevel: number
    currentXp: number
    nextLevelXp: number | null
  } | null
  achievements: Array<{
    achievementId: string
    code: string
    title: string
    unlockedAt: string
  }>
  insights: Array<{
    type: string
    content: string
    createdAt: string
  }>
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const idParam = searchParams.get('playerId')
  const dotaId = Number(idParam)
  if (!idParam || !Number.isFinite(dotaId)) {
    return NextResponse.json(
      { error: 'Missing or invalid playerId' },
      { status: 400 },
    )
  }
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      // eslint-disable-next-line no-console
      console.error('FZTH_PROFILE_ENV_MISSING', {
        hasUrl: !!url,
        hasService: !!serviceKey,
      })
      return NextResponse.json(
        { error: 'Missing Supabase env' },
        { status: 500 },
      )
    }
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    // Player
    const { data: players, error: pErr } = await supabase
      .from('fzth_players')
      .select('id, nickname, dota_account_id')
      .eq('dota_account_id', dotaId)
      .limit(1)
    if (pErr) {
      // eslint-disable-next-line no-console
      console.error('FZTH_PROFILE_PLAYERS_ERROR', pErr)
      return NextResponse.json(
        { error: 'FZTH profile: player lookup error' },
        { status: 500 },
      )
    }
    const player = players?.[0] as any
    if (!player?.id) {
      return NextResponse.json(
        { error: 'Player not found in FZTH' },
        { status: 404 },
      )
    }
    const playerUuid = player.id as string
    // const nickname = player.nickname ?? null

    // KPI: calcolati dalle partite reali di OpenDota tramite opendotaAdapter
    // Questo garantisce che i dati siano sempre aggiornati e mostrino le partite più recenti
    let kpi: FzthProfileResponse['kpi'] = null
    try {
      // Chiama direttamente l'adapter che usa OpenDota come sorgente primaria
      // Limite aumentato a 1000 per avere statistiche più accurate
      const matches = await getRecentMatches(dotaId, 1000)

      if (matches && matches.length > 0) {
        // Calcola KPI dalle partite reali
        const totalMatches = matches.length
        const wins = matches.filter((m) => m.result === 'win').length
        const winrate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0

        const sumKills = matches.reduce((acc, m) => acc + (m.kills ?? 0), 0)
        const sumDeaths = matches.reduce((acc, m) => acc + (m.deaths ?? 0), 0)
        const sumAssists = matches.reduce((acc, m) => acc + (m.assists ?? 0), 0)
        const avgKills = totalMatches > 0 ? sumKills / totalMatches : 0
        const avgDeaths = totalMatches > 0 ? sumDeaths / totalMatches : 0
        const avgAssists = totalMatches > 0 ? sumAssists / totalMatches : 0
        const avgKda =
          avgDeaths > 0
            ? (avgKills + avgAssists) / avgDeaths
            : avgKills + avgAssists

        const sumDuration = matches.reduce(
          (acc, m) => acc + (m.duration_seconds ?? 0),
          0,
        )
        const avgDurationSec = totalMatches > 0 ? sumDuration / totalMatches : 0
        const avgDurationMin = Math.round(avgDurationSec / 60)

        kpi = {
          totalMatches,
          winrate: Number(winrate.toFixed(1)),
          avgKda: Number(avgKda.toFixed(2)),
          avgDurationMin,
        }

        // eslint-disable-next-line no-console
        console.log('FZTH PROFILE: KPI calculated from OpenDota matches', {
          playerId: dotaId,
          totalMatches,
          kpi,
        })
      } else {
        // Nessuna partita disponibile - KPI rimane null
        // La UI gestirà questo caso mostrando valori 0 o messaggio appropriato
        // eslint-disable-next-line no-console
        console.log('FZTH PROFILE: no matches found for player', dotaId)
      }
    } catch (kpiError: any) {
      // Se OpenDota fallisce, prova fallback a Supabase come ultima risorsa
      // eslint-disable-next-line no-console
      console.error(
        'FZTH PROFILE: OpenDota error, trying Supabase fallback',
        kpiError,
      )

      try {
        const { data: statsAgg } = await supabase
          .from('player_stats_agg')
          .select('*')
          .eq('player_id', playerUuid)
          .limit(1)
        const s = (statsAgg?.[0] as any) || null
        if (
          s &&
          (s.total_matches != null ||
            s.winrate != null ||
            s.avg_kda != null ||
            s.avg_duration_sec != null)
        ) {
          kpi = {
            totalMatches: s.total_matches ?? 0,
            winrate: s.winrate ?? 0,
            avgKda: s.avg_kda ?? 0,
            avgDurationMin:
              s.avg_duration_sec != null
                ? Math.round((s.avg_duration_sec as number) / 60)
                : 0,
          }
          // eslint-disable-next-line no-console
          console.log('FZTH PROFILE: using Supabase fallback', {
            playerId: dotaId,
            kpi,
          })
        }
      } catch (fallbackError: any) {
        // eslint-disable-next-line no-console
        console.error(
          'FZTH PROFILE: Supabase fallback also failed',
          fallbackError,
        )
        // KPI rimane null se entrambi falliscono
      }
    }

    // Level / progression
    let level: FzthProfileResponse['level'] | null = null
    const { data: prog } = await supabase
      .from('player_progression')
      .select('*')
      .eq('player_id', playerUuid)
      .limit(1)
    const pr = (prog?.[0] as any) || null
    if (pr?.current_level != null) {
      const currentLevel = pr.current_level
      const currentXp = pr.total_xp ?? pr.xp ?? 0
      const { data: lvlRows } = await supabase
        .from('fzth_levels')
        .select('*')
        .in('level_number', [currentLevel, currentLevel + 1])
      const cur = lvlRows?.find((l: any) => l.level_number === currentLevel)
      const next = lvlRows?.find(
        (l: any) => l.level_number === currentLevel + 1,
      )
      const minXp = cur?.min_xp ?? cur?.xp_min ?? 0
      const nextLevelXp = next?.min_xp ?? next?.xp_min ?? null
      level = {
        currentLevel,
        currentXp,
        nextLevelXp,
      }
    }

    // Achievements (real schema: player_achievements uses achievement_id referencing achievement_catalog.id)
    const { data: ach } = await supabase
      .from('player_achievements')
      .select('achievement_id, unlocked_at')
      .eq('player_id', playerUuid)
    const { data: catalog } = await supabase
      .from('achievement_catalog')
      .select('id, code, title')
    const cMap = new Map((catalog ?? []).map((c: any) => [c.id, c]))
    const achievements: FzthProfileResponse['achievements'] = (ach ?? [])
      .map((a: any) => {
        const c = cMap.get(a.achievement_id) || {}
        return {
          achievementId: String(a.achievement_id ?? ''),
          code: c.code ?? String(a.achievement_id ?? ''),
          title: c.title ?? 'Achievement',
          unlockedAt: a.unlocked_at ?? null,
        }
      })
      .filter((x: any) => !!x.achievementId)
      .sort(
        (a: any, b: any) => (a.unlockedAt ? -1 : 1) - (b.unlockedAt ? -1 : 1),
      )

    // Playstyle tags (simple rules)
    const tags: string[] = []
    const kpiWin = kpi?.winrate ?? 0
    const kpiKda = kpi?.avgKda ?? 0
    if (kpiKda >= 4) tags.push('Efficiente')
    if (kpiWin >= 55) tags.push('Consistente')
    // derive from hero stats - specialization
    const { data: heroStats } = await supabase
      .from('player_hero_stats')
      .select('hero_id, matches')
      .eq('player_id', playerUuid)
    const totalHeroMatches = (heroStats ?? []).reduce(
      (a: number, h: any) => a + (h.matches ?? 0),
      0,
    )
    const distinctHeroes = (heroStats ?? []).length
    if (totalHeroMatches > 0) {
      const ratio = distinctHeroes / Math.max(1, totalHeroMatches / 5) // rough
      if (ratio < 0.8) tags.push('Specialista')
      else tags.push('Versatile')
    }
    if (tags.length === 0) tags.push('In definizione')

    // AI insights (latest 5)
    const { data: insightsRows } = await supabase
      .from('ai_insights')
      .select('id, created_at, insight_type, content')
      .eq('player_id', playerUuid)
      .order('created_at', { ascending: false })
      .limit(5)
    const insights: FzthProfileResponse['insights'] =
      (insightsRows ?? []).map((r: any) => ({
        type: r.insight_type ?? 'insight',
        content: r.content ?? '',
        createdAt: r.created_at,
      })) ?? []

    const resp: FzthProfileResponse = {
      playerId: dotaId,
      internalPlayerId: playerUuid,
      hasKpi: !!kpi,
      kpi,
      level,
      achievements,
      insights,
    }
    // eslint-disable-next-line no-console
    console.log('FZTH PROFILE: response payload', {
      playerId: resp.playerId,
      internalPlayerId: resp.internalPlayerId,
      kpi: resp.kpi,
      achievements: achievements?.length ?? 0,
      insights: insights?.length ?? 0,
    })
    return NextResponse.json(resp)
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('FZTH_PROFILE_ERROR', e)
    return NextResponse.json(
      { error: String(e?.message ?? 'FZTH profile error') },
      { status: 500 },
    )
  }
}
