/**
 * API Route: Hero Pool Profile
 *
 * GET /api/heroes/pool?playerId={id}&limit={n}
 *
 * Returns hero pool profile with aggregated stats for all heroes played
 */

import { NextResponse } from 'next/server'
import { getRecentMatches } from '@/services/dota/opendotaAdapter'
import { buildHeroPoolProfile } from '@/lib/dota/heroPool'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')
  const limitParam = searchParams.get('limit')

  if (!playerIdParam) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  const playerId = Number(playerIdParam)
  const limit = limitParam ? Number(limitParam) : 100 // Default 100 matches

  try {
    // Fetch matches from OpenDota
    const matches = await getRecentMatches(playerId, limit)

    // Build hero pool profile
    const profile = buildHeroPoolProfile(matches)

    return NextResponse.json(profile)
  } catch (e: any) {
    console.error('[HERO-POOL] Error:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Hero pool calculation error' },
      { status: 500 },
    )
  }
}
