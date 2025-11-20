import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

type HistorySummaryResponse = {
  kpi: {
    totalMatches: number
    winrate: number
    avgKda: number
    bestWinStreak: number
    currentLevel?: number
    currentLevelTitle?: string
  }
  winrateTrend: Array<{
    period: string
    matches: number
    wins: number
    winrate: number
  }>
  performanceTrend: Array<{
    matchId: number
    startTime: string
    kda: number
    performanceIndex: number
  }>
  levelProgression?: {
    currentLevel: number
    currentXp: number
    nextLevelXp: number
    ratio: number
  }
  milestones: Array<{
    date: string
    type: string
    label: string
    details?: string
  }>
}

function toDateStr(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')
  const playerId = Number(playerIdParam)
  if (!playerIdParam || !Number.isFinite(playerId)) {
    return NextResponse.json(
      { error: 'Missing or invalid playerId' },
      { status: 400 },
    )
  }
  try {
    const supabase = createServerClient(cookies())
    // Read matches for player
    const { data: matches, error } = await supabase
      .from('matches_digest')
      .select('*')
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: true })
    if (error) throw new Error(error.message)
    const rows = matches ?? []
    const total = rows.length
    const wins = rows.filter((m: any) => m.result === 'win').length
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0
    const sumK = rows.reduce((a: number, m: any) => a + (m.kills ?? 0), 0)
    const sumD = rows.reduce((a: number, m: any) => a + (m.deaths ?? 0), 0)
    const sumA = rows.reduce((a: number, m: any) => a + (m.assists ?? 0), 0)
    const avgKda =
      total > 0 ? Number(((sumK + sumA) / Math.max(1, sumD)).toFixed(2)) : 0
    // Best win streak
    let bestStreak = 0
    let curStreak = 0
    for (const m of rows) {
      if (m.result === 'win') {
        curStreak += 1
        bestStreak = Math.max(bestStreak, curStreak)
      } else {
        curStreak = 0
      }
    }
    // Winrate trend per giorno
    const byDay = new Map<string, { matches: number; wins: number }>()
    for (const m of rows) {
      const key = toDateStr(m.start_time)
      const cur = byDay.get(key) ?? { matches: 0, wins: 0 }
      cur.matches += 1
      if (m.result === 'win') cur.wins += 1
      byDay.set(key, cur)
    }
    const winrateTrend = Array.from(byDay.entries())
      .map(([period, v]) => ({
        period,
        matches: v.matches,
        wins: v.wins,
        winrate: Math.round((v.wins / Math.max(1, v.matches)) * 100),
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
    // Performance trend (ultimi 30)
    const lastN = rows.slice(-30)
    const performanceTrend = lastN.map((m: any) => {
      const kda = (m.kills + m.assists) / Math.max(1, m.deaths)
      const kdaNorm = Math.max(0, Math.min(1, kda / 10))
      const winComponent = m.result === 'win' ? 1 : 0
      const performanceIndex = Math.round(
        (winComponent * 0.6 + kdaNorm * 0.4) * 100,
      )
      return {
        matchId: m.match_id,
        startTime: m.start_time,
        kda: Number(kda.toFixed(2)),
        performanceIndex,
      }
    })
    // Progression (optional)
    let levelProgression: HistorySummaryResponse['levelProgression'] | undefined
    let currentLevelTitle: string | undefined
    const { data: players } = await supabase
      .from('fzth_players')
      .select('id')
      .eq('dota_account_id', playerId)
      .limit(1)
    const fzthId = players?.[0]?.id
    if (fzthId) {
      const { data: prog } = await supabase
        .from('player_progression')
        .select('*')
        .eq('player_id', fzthId)
        .limit(1)
      const p = (prog?.[0] as any) || null
      if (p?.current_level != null) {
        const lvl = p.current_level
        const currentXp = p.total_xp ?? p.xp ?? 0
        const { data: lvls } = await supabase
          .from('fzth_levels')
          .select('*')
          .in('level_number', [lvl, lvl + 1])
        const cur = lvls?.find((l: any) => l.level_number === lvl)
        const next = lvls?.find((l: any) => l.level_number === lvl + 1)
        const minXp = cur?.min_xp ?? cur?.xp_min ?? 0
        const nextMin = next?.min_xp ?? next?.xp_min ?? minXp + 100
        const span = Math.max(1, nextMin - minXp)
        const ratio = Math.max(0, Math.min(1, (currentXp - minXp) / span))
        currentLevelTitle = cur?.title ?? cur?.name ?? undefined
        levelProgression = {
          currentLevel: lvl,
          currentXp,
          nextLevelXp: nextMin,
          ratio: Number(ratio.toFixed(2)),
        }
      }
    }
    // Milestones
    const milestones: HistorySummaryResponse['milestones'] = []
    // streak milestone (>=3)
    curStreak = 0
    for (const m of rows) {
      if (m.result === 'win') {
        curStreak += 1
        if (curStreak === 3) {
          milestones.push({
            date: toDateStr(m.start_time),
            type: 'streak',
            label: 'Streak positiva',
            details: '3 vittorie consecutive',
          })
        }
      } else {
        curStreak = 0
      }
    }
    // high KDA milestone
    for (const m of rows) {
      const kda = (m.kills + m.assists) / Math.max(1, m.deaths)
      if (kda >= 10) {
        milestones.push({
          date: toDateStr(m.start_time),
          type: 'high_kda',
          label: 'Partita ad alto impatto',
          details: `KDA ${kda.toFixed(1)}+`,
        })
      }
    }
    // Achievements unlocked
    if (fzthId) {
      const { data: ach } = await supabase
        .from('player_achievements')
        .select('achievement_code, unlocked_at')
        .eq('player_id', fzthId)
      const { data: cat } = await supabase
        .from('achievement_catalog')
        .select('code, name')
      const cmap = new Map((cat ?? []).map((c: any) => [c.code, c.name]))
      for (const a of ach ?? []) {
        milestones.push({
          date: toDateStr(a.unlocked_at ?? new Date().toISOString()),
          type: 'achievement',
          label: `Achievement: ${
            cmap.get(a.achievement_code) ?? a.achievement_code
          }`,
        })
      }
    }
    const resp: HistorySummaryResponse = {
      kpi: {
        totalMatches: total,
        winrate,
        avgKda,
        bestWinStreak: bestStreak,
        currentLevel: levelProgression?.currentLevel,
        currentLevelTitle,
      },
      winrateTrend,
      performanceTrend,
      levelProgression,
      milestones: milestones.sort((a, b) => a.date.localeCompare(b.date)),
    }
    return NextResponse.json(resp)
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('HISTORY_SUMMARY_ERROR', e)
    return NextResponse.json(
      { error: 'History summary error' },
      { status: 500 },
    )
  }
}
