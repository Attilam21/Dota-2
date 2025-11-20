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
    const { data } = await supabase
      .from('ai_insights')
      .select('id, created_at, insight_type, content')
      .eq('player_id', playerUuid)
      .order('created_at', { ascending: false })
      .limit(20)
    const items =
      (data ?? []).map((r: any) => {
        const it = (r.insight_type ?? 'insight') as string
        const title = it.charAt(0).toUpperCase() + it.slice(1)
        return {
          id: String(r.id),
          createdAt: r.created_at,
          title,
          message: r.content ?? '',
        }
      }) ?? []
    return NextResponse.json({ items })
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('FZTH_INSIGHTS_ERROR', e)
    return NextResponse.json({ error: 'FZTH insights error' }, { status: 500 })
  }
}
