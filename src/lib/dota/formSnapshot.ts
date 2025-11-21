/**
 * Funzioni per calcolare lo Snapshot Stato Forma del player
 * Basato SOLO su dati garantiti da matches_digest
 */

import type { PlayerFormSnapshot } from '@/types/dotaSnapshot'

// Soglie per determinare i trend
const WINRATE_THRESHOLD = 5 // differenza percentuale per considerare UP/DOWN
const KDA_THRESHOLD = 0.3 // differenza KDA per considerare UP/DOWN
const FARM_THRESHOLD = 50 // differenza GPM/XPM per considerare UP/DOWN

export type MatchRowForSnapshot = {
  kills: number
  deaths: number
  assists: number
  result: 'win' | 'lose'
  start_time: string
  gpm?: number | null
  xpm?: number | null
}

/**
 * Calcola KDA da kills/deaths/assists
 */
function calculateKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists
  return (kills + assists) / deaths
}

/**
 * Calcola winrate da array di risultati
 */
function calculateWinrate(results: Array<'win' | 'lose'>): number | null {
  if (results.length === 0) return null
  const wins = results.filter((r) => r === 'win').length
  return (wins / results.length) * 100
}

/**
 * Calcola media di un array numerico, gestendo null/undefined
 */
function calculateAverage(
  values: Array<number | null | undefined>,
): number | null {
  const validValues = values.filter(
    (v): v is number => v !== null && v !== undefined && !isNaN(v),
  )
  if (validValues.length === 0) return null
  const sum = validValues.reduce((acc, v) => acc + v, 0)
  return sum / validValues.length
}

/**
 * Determina label di trend in base a delta e soglia
 */
function determineTrendLabel(
  delta: number | null,
  threshold: number,
): 'UP' | 'DOWN' | 'FLAT' | 'UNKNOWN' {
  if (delta === null || isNaN(delta)) return 'UNKNOWN'
  if (delta >= threshold) return 'UP'
  if (delta <= -threshold) return 'DOWN'
  return 'FLAT'
}

/**
 * Genera insight testuale basato sui trend
 */
function generateInsight(snapshot: PlayerFormSnapshot): string | null {
  if (snapshot.sampleSizeTotal === 0) {
    return 'Non ci sono abbastanza partite recenti per valutare il trend.'
  }

  if (snapshot.sampleSizeRecent < 3) {
    return 'Non ci sono abbastanza partite recenti per valutare il trend.'
  }

  const insights: string[] = []

  // Winrate insight
  if (
    snapshot.winrateDelta !== null &&
    snapshot.winrateDelta < -10 &&
    snapshot.winrateTrendLabel === 'DOWN'
  ) {
    insights.push(
      'Il winrate recente è peggiorato rispetto al tuo storico. Potrebbe indicare un momento di forma negativo.',
    )
  }

  // Farm insight
  if (
    snapshot.gpmDelta !== null &&
    snapshot.gpmDelta > FARM_THRESHOLD &&
    snapshot.farmTrendLabel === 'UP'
  ) {
    insights.push(
      'Il tuo farm recente è superiore al tuo storico: buona gestione delle risorse.',
    )
  }

  // KDA consistency (se abbiamo almeno 10 partite per calcolare varianza)
  if (snapshot.sampleSizeTotal >= 10 && snapshot.kdaTrendLabel === 'FLAT') {
    insights.push('Le tue prestazioni sono relativamente stabili (KDA).')
  }

  // Max 2 frasi
  return insights.slice(0, 2).join(' ') || null
}

/**
 * Calcola lo Snapshot Stato Forma del player
 * @param matches Array di partite ordinate per data DESC (più recenti prime)
 * @param gpmSeries Serie GPM opzionale (da overviewKPI)
 * @param xpmSeries Serie XPM opzionale (da overviewKPI)
 */
export function calculatePlayerFormSnapshot(
  matches: MatchRowForSnapshot[],
  gpmSeries?: Array<{ gpm: number }>,
  xpmSeries?: Array<{ xpm: number }>,
): PlayerFormSnapshot {
  // Se non ci sono partite, ritorna snapshot vuoto
  if (!matches || matches.length === 0) {
    return {
      sampleSizeTotal: 0,
      sampleSizeRecent: 0,
      winrateRecent: null,
      winrateTotal: null,
      winrateDelta: null,
      kdaRecent: null,
      kdaTotal: null,
      kdaDelta: null,
      gpmRecent: null,
      gpmTotal: null,
      gpmDelta: null,
      xpmRecent: null,
      xpmTotal: null,
      xpmDelta: null,
      winrateTrendLabel: 'UNKNOWN',
      kdaTrendLabel: 'UNKNOWN',
      farmTrendLabel: 'UNKNOWN',
      insightText:
        'Non ci sono abbastanza partite recenti per valutare il trend.',
    }
  }

  // Limita a 20 partite (le più recenti sono già prime)
  const allMatches = matches.slice(0, 20)
  const recentMatches = matches.slice(0, 5)

  const sampleSizeTotal = allMatches.length
  const sampleSizeRecent = recentMatches.length

  // Calcola winrate
  const winrateRecent = calculateWinrate(recentMatches.map((m) => m.result))
  const winrateTotal = calculateWinrate(allMatches.map((m) => m.result))
  const winrateDelta =
    winrateRecent !== null && winrateTotal !== null
      ? winrateRecent - winrateTotal
      : null

  // Calcola KDA
  const kdaRecent =
    recentMatches.length > 0
      ? calculateAverage(
          recentMatches.map((m) => calculateKDA(m.kills, m.deaths, m.assists)),
        )
      : null

  const kdaTotal =
    allMatches.length > 0
      ? calculateAverage(
          allMatches.map((m) => calculateKDA(m.kills, m.deaths, m.assists)),
        )
      : null

  const kdaDelta =
    kdaRecent !== null && kdaTotal !== null ? kdaRecent - kdaTotal : null

  // Calcola GPM/XPM (usa serie se disponibile, altrimenti calcola da matches)
  const gpmRecent =
    gpmSeries && gpmSeries.length >= 5
      ? calculateAverage(gpmSeries.slice(0, 5).map((s) => s.gpm))
      : calculateAverage(recentMatches.map((m) => m.gpm))

  const gpmTotal =
    gpmSeries && gpmSeries.length >= 20
      ? calculateAverage(gpmSeries.slice(0, 20).map((s) => s.gpm))
      : calculateAverage(allMatches.map((m) => m.gpm))

  const gpmDelta =
    gpmRecent !== null && gpmTotal !== null ? gpmRecent - gpmTotal : null

  const xpmRecent =
    xpmSeries && xpmSeries.length >= 5
      ? calculateAverage(xpmSeries.slice(0, 5).map((s) => s.xpm))
      : calculateAverage(recentMatches.map((m) => m.xpm))

  const xpmTotal =
    xpmSeries && xpmSeries.length >= 20
      ? calculateAverage(xpmSeries.slice(0, 20).map((s) => s.xpm))
      : calculateAverage(allMatches.map((m) => m.xpm))

  const xpmDelta =
    xpmRecent !== null && xpmTotal !== null ? xpmRecent - xpmTotal : null

  // Determina trend labels
  const winrateTrendLabel = determineTrendLabel(winrateDelta, WINRATE_THRESHOLD)
  const kdaTrendLabel = determineTrendLabel(kdaDelta, KDA_THRESHOLD)

  // Farm trend basato su GPM (priorità) o XPM
  const farmDelta = gpmDelta !== null ? gpmDelta : xpmDelta
  const farmTrendLabel = determineTrendLabel(farmDelta, FARM_THRESHOLD)

  // Crea snapshot base
  const snapshot: PlayerFormSnapshot = {
    sampleSizeTotal,
    sampleSizeRecent,
    winrateRecent,
    winrateTotal,
    winrateDelta,
    kdaRecent,
    kdaTotal,
    kdaDelta,
    gpmRecent,
    gpmTotal,
    gpmDelta,
    xpmRecent,
    xpmTotal,
    xpmDelta,
    winrateTrendLabel,
    kdaTrendLabel,
    farmTrendLabel,
    insightText: null,
  }

  // Genera insight
  snapshot.insightText = generateInsight(snapshot)

  return snapshot
}
