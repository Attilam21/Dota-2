/**
 * API Route: Match Analysis PRO
 *
 * GET /api/matches/analysis?matchId={id}&playerId={id}
 *
 * Returns complete match analysis using Tier 1 data only
 */

import { NextResponse } from 'next/server'
import { getMatchAnalysis } from '@/lib/dota/matchAnalysis/getMatchAnalysis'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchIdParam = searchParams.get('matchId')
  const playerIdParam = searchParams.get('playerId')

  if (!matchIdParam || !playerIdParam) {
    return NextResponse.json(
      { error: 'Missing matchId or playerId' },
      { status: 400 },
    )
  }

  const matchId = Number(matchIdParam)
  const playerId = Number(playerIdParam)

  if (!Number.isFinite(matchId) || !Number.isFinite(playerId)) {
    return NextResponse.json(
      { error: 'Invalid matchId or playerId' },
      { status: 400 },
    )
  }

  try {
    const analysis = await getMatchAnalysis(matchId, playerId)
    return NextResponse.json(analysis)
  } catch (e: any) {
    console.error('[API/MATCHES/ANALYSIS] Error:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch match analysis' },
      { status: 500 },
    )
  }
}
