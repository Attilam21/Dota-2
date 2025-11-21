import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { DEFAULT_PLAYER_ID } from '@/lib/playerId'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')
  const statusParam = searchParams.get('status') // opzionale: 'open', 'completed', 'failed'

  // Usa il playerId fornito o il default (giocatore di test)
  const playerId = playerIdParam || String(DEFAULT_PLAYER_ID)

  try {
    const supabase = createServerClient(cookies())

    // Costruisci la query
    let query = supabase
      .from('dota_tasks')
      .select('*')
      .eq('player_id', playerId)

    // Filtra per status se specificato
    if (statusParam && ['open', 'completed', 'failed'].includes(statusParam)) {
      query = query.eq('status', statusParam)
    }

    // Ordina: prima open, poi completed, poi failed
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      // Ritorna sempre formato consistente: { tasks: [], error: "..." }
      // Se la tabella non esiste, ritorna array vuoto con errore descrittivo
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          tasks: [],
          error:
            'Tabella dota_tasks non trovata. Esegui la migration SQL per crearla.',
        })
      }
      return NextResponse.json({
        tasks: [],
        error: `Errore nel recupero dei task: ${error.message}`,
      })
    }

    // Ordina manualmente per status (open > completed > failed)
    const sorted = (data || []).sort((a, b) => {
      const statusOrder = { open: 0, completed: 1, failed: 2 }
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      // Se stesso status, ordina per data creazione (più recenti prima)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Ritorna sempre formato consistente: { tasks: [...], error: null }
    return NextResponse.json({ tasks: sorted, error: null })
  } catch (error: any) {
    console.error('Unexpected error in tasks/list:', error)
    // Ritorna sempre formato consistente anche in caso di errore inatteso
    return NextResponse.json({
      tasks: [],
      error: error?.message ?? 'Errore inatteso nel recupero dei task',
    })
  }
}
