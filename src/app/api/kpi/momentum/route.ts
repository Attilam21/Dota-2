import { NextResponse } from 'next/server'
import { getMomentumKPI } from '@/services/dota/kpiService'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerId = searchParams.get('playerId')
  const limit = searchParams.get('limit')

  if (!playerId) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  try {
    const kpi = await getMomentumKPI(Number(playerId), {
      limit: limit ? Number(limit) : 20,
    })
    return NextResponse.json(kpi)
  } catch (error: any) {
    console.error('Error in momentum KPI:', error)
    return NextResponse.json(
      { error: error?.message ?? 'KPI calculation error' },
      { status: 500 },
    )
  }
}
