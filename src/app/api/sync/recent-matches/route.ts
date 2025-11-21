import { NextResponse } from 'next/server'

/**
 * SYNC DISABILITATO — ora usiamo solo OpenDota come sorgente dati
 *
 * Questa route è stata disattivata perché la dashboard ora legge direttamente
 * da OpenDota tramite l'adapter opendotaAdapter.ts senza passare per Supabase.
 *
 * La route ritorna sempre successo per mantenere compatibilità con eventuali
 * chiamate esistenti, ma non esegue più alcuna sincronizzazione.
 */
export async function GET(req: Request) {
  // Ritorna sempre successo senza eseguire sincronizzazione
  return NextResponse.json({ ok: true, skipped: true })
}
