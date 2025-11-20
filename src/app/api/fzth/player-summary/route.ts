import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

type FzthPlayerSummary = {
  hasFzthProfile: boolean
  nickname: string | null
  fzthScore: number | null
  currentLevel: number | null
  currentLevelTitle: string | null
  progressPercent: number | null
  totalXp: number | null
  achievements: Array<{
    code: string
    name: string
    category: string
    unlocked: boolean
    unlockedAt: string | null
  }>
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  // Accept both playerId (preferred) and dotaAccountId (legacy)
  const idParam =
    searchParams.get('playerId') ?? searchParams.get('dotaAccountId')
  const dotaId = Number(idParam)
  if (!idParam || !Number.isFinite(dotaId)) {
    return NextResponse.json(
      { error: 'Missing or invalid playerId' },
      { status: 400 },
    )
  }
  const supabase = createServerClient(cookies())
  try {
    // fzth_players
    const { data: players, error: pErr } = await supabase
      .from('fzth_players')
      .select('id, nickname')
      .eq('dota_account_id', dotaId)
      .limit(1)
    if (pErr) throw pErr
    const playerRow = players?.[0] as any
    if (!playerRow?.id) {
      const empty: FzthPlayerSummary = {
        hasFzthProfile: false,
        nickname: null,
        fzthScore: null,
        currentLevel: null,
        currentLevelTitle: null,
        progressPercent: null,
        totalXp: null,
        achievements: [],
      }
      return NextResponse.json(empty, { status: 404 })
    }
    const playerId = playerRow.id
    const nickname = playerRow.nickname ?? null

    // player_stats_agg
    const { data: agg, error: aErr } = await supabase
      .from('player_stats_agg')
      .select('*')
      .eq('player_id', playerId)
      .limit(1)
    if (aErr) throw aErr
    const stats = (agg?.[0] as any) || null
    const fzthScore = stats?.performance_index ?? stats?.fzth_score ?? null

    // player_progression
    const { data: prog, error: prErr } = await supabase
      .from('player_progression')
      .select('*')
      .eq('player_id', playerId)
      .limit(1)
    if (prErr) throw prErr
    const progression = (prog?.[0] as any) || null
    const currentLevelNum = progression?.current_level ?? null
    const totalXp = progression?.total_xp ?? progression?.xp ?? null

    // fzth_levels (current and next)
    let currentLevelTitle: string | null = null
    let progressPercent: number | null = null
    if (currentLevelNum != null) {
      const { data: levelRows } = await supabase
        .from('fzth_levels')
        .select('*')
        .in('level_number', [currentLevelNum, currentLevelNum + 1])
      const currentLevel = levelRows?.find(
        (l: any) => l.level_number === currentLevelNum,
      )
      const nextLevel = levelRows?.find(
        (l: any) => l.level_number === currentLevelNum + 1,
      )
      currentLevelTitle = currentLevel?.title ?? currentLevel?.name ?? null
      const minXp = currentLevel?.min_xp ?? currentLevel?.xp_min ?? null
      const maxXp = nextLevel?.min_xp ?? nextLevel?.xp_min ?? null
      if (minXp != null && maxXp != null && totalXp != null) {
        const span = Math.max(1, maxXp - minXp)
        progressPercent = Math.max(
          0,
          Math.min(100, Math.round(((totalXp - minXp) / span) * 100)),
        )
      }
    }

    // Achievements join
    const { data: achRows } = await supabase
      .from('player_achievements')
      .select('achievement_code, unlocked, unlocked_at')
      .eq('player_id', playerId)
    const { data: catalog } = await supabase
      .from('achievement_catalog')
      .select('code, name, category')
    const achMap = new Map((catalog ?? []).map((c: any) => [c.code, c]))
    const achievements =
      (achRows ?? []).map((r: any) => {
        const c = achMap.get(r.achievement_code) || {}
        return {
          code: r.achievement_code,
          name: c.name ?? r.achievement_code,
          category: c.category ?? 'general',
          unlocked: !!r.unlocked,
          unlockedAt: r.unlocked_at ?? null,
        }
      }) ?? []

    const payload: FzthPlayerSummary = {
      hasFzthProfile: true,
      nickname,
      fzthScore,
      currentLevel: currentLevelNum,
      currentLevelTitle,
      progressPercent,
      totalXp,
      achievements,
    }
    return NextResponse.json(payload)
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('FZTH summary error', e)
    return NextResponse.json({ error: 'FZTH summary error' }, { status: 500 })
  }
}
