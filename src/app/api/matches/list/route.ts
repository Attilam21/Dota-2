import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { getRecentMatches } from '@/services/dota/opendotaAdapter'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')

  if (!playerIdParam) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
  }

  const playerId = Number(playerIdParam)

  try {
    // Prova prima a leggere da Supabase (cache locale)
    const supabase = createServerClient(cookies())
    const { data, error } = await supabase
      .from('matches_digest')
      .select('*')
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })

    // Se Supabase ha dati, restituiscili
    if (!error && data && data.length > 0) {
      return NextResponse.json(data)
    }

    // Altrimenti usa l'adapter OpenDota come fallback
    // Questo garantisce che la dashboard funzioni anche senza Supabase popolato
    const matches = await getRecentMatches(playerId, 100)
    return NextResponse.json(matches)
  } catch (e: any) {
    console.error('MATCHES_LIST_ERROR', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'List error' },
      { status: 500 },
    )
  }
}
