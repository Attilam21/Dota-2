import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

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
    const { data: players } = await supabase
      .from('fzth_players')
      .select('id')
      .eq('dota_account_id', dotaId)
      .limit(1)
    const playerUuid = players?.[0]?.id as string | undefined
    if (!playerUuid) {
      return NextResponse.json({ items: [] })
    }
    const { data: ach } = await supabase
      .from('player_achievements')
      .select('achievement_id, unlocked_at')
      .eq('player_id', playerUuid)
    const { data: catalog } = await supabase
      .from('achievement_catalog')
      .select('id, code, title')
    const cMap = new Map((catalog ?? []).map((c: any) => [c.id, c]))
    const items =
      (ach ?? []).map((a: any) => {
        const c = cMap.get(a.achievement_id) || {}
        return {
          achievementId: String(a.achievement_id ?? ''),
          code: c.code ?? String(a.achievement_id ?? ''),
          title: c.title ?? 'Achievement',
          unlockedAt: a.unlocked_at ?? null,
        }
      }) ?? []
    return NextResponse.json({ items })
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('FZTH_ACHIEVEMENTS_ERROR', e)
    return NextResponse.json(
      { error: 'FZTH achievements error' },
      { status: 500 },
    )
  }
}
