import { NextResponse } from 'next/server'
import { getVisionMapAnalysis } from '@/lib/dota/advancedAnalysis/visionAnalysis'

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
    const data = await getVisionMapAnalysis(playerId)
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Vision analysis error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
