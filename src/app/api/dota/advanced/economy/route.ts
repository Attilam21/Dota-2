import { NextResponse } from 'next/server'
import { getFarmEconomyAnalysis } from '@/lib/dota/advancedAnalysis/economyAnalysis'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')

  if (!playerIdParam) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  const playerId = Number(playerIdParam)
  if (!Number.isFinite(playerId)) {
    return NextResponse.json({ error: 'Invalid playerId' }, { status: 400 })
  }

  try {
    const data = await getFarmEconomyAnalysis(playerId)
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Economy analysis error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
