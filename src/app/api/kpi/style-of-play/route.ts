import { NextResponse } from 'next/server'
import { getStyleOfPlayKPI } from '@/services/dota/kpiService'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerId = searchParams.get('playerId')
  const limit = searchParams.get('limit')

  if (!playerId) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  try {
    const kpi = await getStyleOfPlayKPI(Number(playerId), {
      limit: limit ? Number(limit) : 100,
    })
    return NextResponse.json(kpi)
  } catch (error: any) {
    console.error('Error in style-of-play KPI:', error)
    return NextResponse.json(
      { error: error?.message ?? 'KPI calculation error' },
      { status: 500 },
    )
  }
}
