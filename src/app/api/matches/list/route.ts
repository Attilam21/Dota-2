import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { getRecentMatches } from '@/services/dota/opendotaAdapter'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')
  const limitParam = searchParams.get('limit')

  if (!playerIdParam) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  const playerId = Number(playerIdParam)
  const limit = limitParam ? Number(limitParam) : 100 // Default 100 partite

  try {
    // SORGENTE PRIMARIA: OpenDota tramite opendotaAdapter
    // Questo garantisce che la dashboard mostri sempre le partite più recenti
    const matches = await getRecentMatches(playerId, limit)
    return NextResponse.json(matches)
  } catch (e: any) {
    // FALLBACK: Se OpenDota fallisce (timeout, errore di rete, ecc.),
    // prova a leggere da Supabase per restituire almeno i dati storici
    console.error('OpenDota error, trying Supabase fallback:', e?.message ?? e)

    try {
      const supabase = createServerClient(cookies())
      const { data, error } = await supabase
        .from('matches_digest')
        .select('*')
        .eq('player_account_id', playerId)
        .order('start_time', { ascending: false })
        .limit(limit)

      if (!error && data && data.length > 0) {
        console.log(`Fallback: returning ${data.length} matches from Supabase`)
        return NextResponse.json(data)
      }

      // Se anche Supabase è vuoto o ha errori, restituisci errore
      return NextResponse.json(
        {
          error:
            e?.message ?? 'Unable to fetch matches from OpenDota or Supabase',
        },
        { status: 500 },
      )
    } catch (fallbackError: any) {
      console.error(
        'Supabase fallback error:',
        fallbackError?.message ?? fallbackError,
      )
      return NextResponse.json(
        { error: e?.message ?? 'List error' },
        { status: 500 },
      )
    }
  }
}
