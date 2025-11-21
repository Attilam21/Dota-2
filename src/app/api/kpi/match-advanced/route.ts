import { NextResponse } from 'next/server'
import { getAdvancedMatchKPI } from '@/services/dota/kpiService'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  const playerId = searchParams.get('playerId')

  if (!matchId || !playerId) {
    return NextResponse.json(
      { error: 'Missing matchId or playerId' },
      { status: 400 },
    )
  }

  try {
    const kpi = await getAdvancedMatchKPI(Number(matchId), Number(playerId))
    return NextResponse.json(kpi)
  } catch (error: any) {
    console.error('Error in match-advanced KPI:', error)
    return NextResponse.json(
      { error: error?.message ?? 'KPI calculation error' },
      { status: 500 },
    )
  }
}
