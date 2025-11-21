import { NextResponse } from 'next/server'
import { getMatchDetail } from '@/services/dota/opendotaAdapter'
import type { MatchDetail } from '@/services/dota/opendotaAdapter'

// Esporta il tipo per compatibilità con il frontend esistente
export type MatchDetailResponse = MatchDetail

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
    // Usa l'adapter per ottenere i dettagli della partita
    const response = await getMatchDetail(Number(matchId), Number(playerId))
    return NextResponse.json(response)
  } catch (e: any) {
    console.error('MATCH_DETAIL_ERROR', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Match detail error' },
      { status: 502 },
    )
  }
}
