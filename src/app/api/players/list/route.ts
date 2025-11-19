import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

type RawRow = {
  player_account_id: number
  start_time: string | null
  result?: string | null
}

export type PlayerSummary = {
  playerId: number
  matchesCount: number
  lastMatchTime: string | null
  winrate: number // 0..1
}

export async function GET() {
  try {
    const supabase = createServerClient(cookies())
    const { data, error } = await supabase
      .from('matches_digest')
      .select('player_account_id,start_time,result')
      .order('start_time', { ascending: false })
      .limit(5000)

    if (error) throw new Error(error.message)

    const map = new Map<number, { count: number; wins: number; last: number }>()
    for (const r of (data ?? []) as RawRow[]) {
      if (typeof r.player_account_id !== 'number') continue
      const pid = r.player_account_id
      const entry = map.get(pid) ?? { count: 0, wins: 0, last: 0 }
      entry.count += 1
      if ((r.result ?? '') === 'win') entry.wins += 1
      const t = r.start_time ? new Date(r.start_time).getTime() : 0
      if (Number.isFinite(t) && t > entry.last) entry.last = t
      map.set(pid, entry)
    }

    let summaries: PlayerSummary[] = Array.from(map.entries()).map(
      ([playerId, v]) => ({
        playerId,
        matchesCount: v.count,
        lastMatchTime: v.last ? new Date(v.last).toISOString() : null,
        winrate: v.count > 0 ? v.wins / v.count : 0,
      }),
    )

    summaries.sort((a, b) => {
      const ta = a.lastMatchTime ? Date.parse(a.lastMatchTime) : 0
      const tb = b.lastMatchTime ? Date.parse(b.lastMatchTime) : 0
      return tb - ta
    })

    summaries = summaries.slice(0, 20)

    return NextResponse.json(summaries)
  } catch (e: any) {
    console.error('PLAYERS_LIST_ERROR', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Players list error' },
      { status: 500 },
    )
  }
}
