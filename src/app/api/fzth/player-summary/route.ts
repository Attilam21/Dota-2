import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

type PlayerSummary = {
  hasAggregates: boolean
  kpi?: {
    totalMatches: number
    winrate: number
    kdaAvg: number
    avgDurationMinutes: number
  }
  topHero?: {
    heroId: number
    matches: number
    winrate: number
    kdaAvg: number
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dotaIdParam = searchParams.get('dotaAccountId')
  const dotaId = Number(dotaIdParam)
  if (!dotaIdParam || !Number.isFinite(dotaId)) {
    return NextResponse.json(
      { error: 'Missing or invalid dotaAccountId' },
      { status: 400 },
    )
  }
  const supabase = createServerClient(cookies())
  try {
    // Resolve player UUID from fzth_players
    const { data: players, error: pErr } = await supabase
      .from('fzth_players')
      .select('id')
      .eq('dota_account_id', dotaId)
      .limit(1)
    if (pErr) throw pErr
    const playerId = players?.[0]?.id
    if (!playerId) {
      return NextResponse.json({ hasAggregates: false } as PlayerSummary, {
        status: 404,
      })
    }
    // Read aggregated KPI
    const { data: agg, error: aErr } = await supabase
      .from('player_stats_agg')
      .select('*')
      .eq('player_id', playerId)
      .limit(1)
    if (aErr) throw aErr
    if (!agg || agg.length === 0) {
      return NextResponse.json({ hasAggregates: false } as PlayerSummary, {
        status: 404,
      })
    }
    const row = agg[0] as any
    const totalMatches =
      row.total_matches ?? row.matches ?? row.matches_count ?? 0
    const winrate = row.winrate ?? row.win_rate ?? 0
    const kdaAvg = row.kda_avg ?? row.kda ?? 0
    const avgDurationMinutes = row.avg_duration_minutes ?? row.avg_duration ?? 0
    // Top hero
    const { data: heroAgg, error: hErr } = await supabase
      .from('player_hero_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('matches', { ascending: false })
      .limit(1)
    if (hErr) throw hErr
    const h = (heroAgg?.[0] as any) || null
    const payload: PlayerSummary = {
      hasAggregates: true,
      kpi: {
        totalMatches,
        winrate,
        kdaAvg,
        avgDurationMinutes,
      },
      topHero: h
        ? {
            heroId: h.hero_id ?? 0,
            matches: h.matches ?? h.matches_count ?? 0,
            winrate: h.winrate ?? h.win_rate ?? 0,
            kdaAvg: h.kda_avg ?? h.kda ?? 0,
          }
        : undefined,
    }
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'FZTH summary error' },
      { status: 500 },
    )
  }
}
