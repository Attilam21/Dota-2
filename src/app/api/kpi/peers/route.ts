import { NextResponse } from 'next/server'
import { getPeersKPI } from '@/services/dota/kpiService'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerId = searchParams.get('playerId')

  if (!playerId) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  try {
    const kpi = await getPeersKPI(Number(playerId))
    return NextResponse.json(kpi)
  } catch (error: any) {
    console.error('Error in peers KPI:', error)
    return NextResponse.json(
      { error: error?.message ?? 'KPI calculation error' },
      { status: 500 },
    )
  }
}
