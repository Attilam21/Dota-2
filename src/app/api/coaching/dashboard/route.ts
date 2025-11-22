/**
 * API Route: Coaching Dashboard Data
 *
 * GET /api/coaching/dashboard?playerId={id}
 *
 * Returns coaching dashboard data with tasks grouped by pillar
 */

import { NextResponse } from 'next/server'
import { getCoachingDashboardData } from '@/lib/dota/coaching/fetchCoachingData'

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
    const data = await getCoachingDashboardData(playerId)
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('[API/COACHING/DASHBOARD] Error:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch coaching dashboard data' },
      { status: 500 },
    )
  }
}
