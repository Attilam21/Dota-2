import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

type FzthProfileResponse = {
  player: {
    dotaAccountId: number
    nickname: string | null
  }
  kpi: {
    totalMatches: number
    winrate: number
    avgKda: number
    fzthScore: number | null
  }
  level: {
    currentLevel: number
    title: string
    currentXp: number
    minXp: number
    maxXp: number
    xpRatio: number
    badgeColor?: string | null
  } | null
  achievements: {
    total: number
    unlocked: number
    items: Array<{
      code: string
      name: string
      description: string
      category: string
      rarity: string
      unlockedAt: string | null
    }>
  }
  playstyle: {
    tags: string[]
    notes?: string
  }
  insights: Array<{
    id: string
    createdAt: string
    title: string
    message: string
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
  const supabase = createServerClient(cookies())
  try {
    // Player
    const { data: players, error: pErr } = await supabase
      .from('fzth_players')
      .select('id, nickname, dota_account_id')
      .eq('dota_account_id', dotaId)
      .limit(1)
    if (pErr) throw pErr
    const player = players?.[0] as any
    if (!player?.id) {
      return NextResponse.json(
        { error: 'Player not found in FZTH' },
        { status: 404 },
      )
    }
    const playerUuid = player.id as string
    const nickname = player.nickname ?? null

    // KPI (stats agg) and score
    const { data: statsAgg } = await supabase
      .from('player_stats_agg')
      .select('*')
      .eq('player_id', playerUuid)
      .limit(1)
    const s = (statsAgg?.[0] as any) || {}
    const totalMatches = s.total_matches ?? s.matches ?? 0
    const totalWins =
      s.total_wins ?? Math.round(((s.winrate ?? 0) * totalMatches) / 100) ?? 0
    const winrate =
      s.winrate ??
      (totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0)
    const avgKda = s.avg_kda ?? s.kda_avg ?? s.kda ?? 0
    const fzthScore = s.performance_index ?? s.fzth_score ?? null

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
      const title = cur?.title ?? cur?.name ?? `Level ${currentLevel}`
      const minXp = cur?.min_xp ?? cur?.xp_min ?? 0
      const maxXp = next?.min_xp ?? next?.xp_min ?? minXp + 100
      const span = Math.max(1, maxXp - minXp)
      const ratio = Math.max(0, Math.min(1, (currentXp - minXp) / span))
      level = {
        currentLevel,
        title,
        currentXp,
        minXp,
        maxXp,
        xpRatio: Number(ratio.toFixed(2)),
        badgeColor: cur?.badge_color ?? null,
      }
    }

    // Achievements
    const { data: ach } = await supabase
      .from('player_achievements')
      .select('achievement_code, unlocked_at')
      .eq('player_id', playerUuid)
    const { data: catalog } = await supabase
      .from('achievement_catalog')
      .select('code, name, description, category, rarity')
    const cMap = new Map((catalog ?? []).map((c: any) => [c.code, c]))
    const items =
      (catalog ?? []).map((c: any) => {
        const unlocked = (ach ?? []).find(
          (a: any) => a.achievement_code === c.code,
        )
        return {
          code: c.code,
          name: c.name ?? c.code,
          description: c.description ?? '',
          category: c.category ?? 'general',
          rarity: c.rarity ?? 'common',
          unlockedAt: unlocked?.unlocked_at ?? null,
        }
      }) ?? []
    items.sort((a, b) => (a.unlockedAt ? -1 : 1) - (b.unlockedAt ? -1 : 1))
    const achievements = {
      total: items.length,
      unlocked: items.filter((i) => !!i.unlockedAt).length,
      items,
    }

    // Playstyle tags (simple rules)
    const tags: string[] = []
    if (avgKda >= 4) tags.push('Efficiente')
    if (winrate >= 55) tags.push('Consistente')
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
      .select('id, created_at, title, message')
      .eq('player_id', playerUuid)
      .order('created_at', { ascending: false })
      .limit(5)
    const insights =
      (insightsRows ?? []).map((r: any) => ({
        id: String(r.id),
        createdAt: r.created_at,
        title: r.title ?? 'Insight',
        message: r.message ?? '',
      })) ?? []

    const resp: FzthProfileResponse = {
      player: { dotaAccountId: dotaId, nickname },
      kpi: {
        totalMatches,
        winrate,
        avgKda,
        fzthScore,
      },
      level,
      achievements,
      playstyle: { tags },
      insights,
    }
    return NextResponse.json(resp)
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('FZTH_PROFILE_ERROR', e)
    return NextResponse.json({ error: 'FZTH profile error' }, { status: 500 })
  }
}
