import { NextResponse } from 'next/server'
import { fetchFromOpenDota, type RecentMatch } from '@/utils/opendota'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerId = searchParams.get('playerId')

  if (!playerId) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  try {
    const data = await fetchFromOpenDota<RecentMatch[]>(
      `/players/${playerId}/recentMatches`,
    )
    // TEMP LOG per audit
    console.log(
      'DOTA2_RAW_RESPONSE',
      JSON.stringify(data?.slice?.(0, 3) ?? data, null, 2),
    )
    return NextResponse.json(data)
  } catch (error: any) {
    // Non-bloccante: fallback per il frontend
    console.error('OpenDota recentMatches error', error?.message ?? error)
    return NextResponse.json({
      ok: false,
      source: 'opendota',
      status: error?.status ?? 0,
      fallback: true,
    })
  }
}
