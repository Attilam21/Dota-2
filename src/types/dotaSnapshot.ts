/**
 * Tipo per lo Snapshot Stato Forma del player
 * Basato SOLO su dati garantiti da matches_digest
 */

export interface PlayerFormSnapshot {
  // Sample sizes
  sampleSizeTotal: number // partite usate totali (max 20)
  sampleSizeRecent: number // partite usate recenti (max 5)

  // Winrate metrics
  winrateRecent: number | null // ultime 5 partite
  winrateTotal: number | null // ultime 20 partite (o tutte disponibili)
  winrateDelta: number | null // differenza (recent - total)

  // KDA metrics
  kdaRecent: number | null // KDA medio ultime 5
  kdaTotal: number | null // KDA medio ultime 20
  kdaDelta: number | null // differenza (recent - total)

  // Farm metrics (GPM)
  gpmRecent: number | null // GPM medio ultime 5
  gpmTotal: number | null // GPM medio ultime 20
  gpmDelta: number | null // differenza (recent - total)

  // Farm metrics (XPM)
  xpmRecent: number | null // XPM medio ultime 5
  xpmTotal: number | null // XPM medio ultime 20
  xpmDelta: number | null // differenza (recent - total)

  // Trend labels (calcolate)
  winrateTrendLabel: 'UP' | 'DOWN' | 'FLAT' | 'UNKNOWN'
  kdaTrendLabel: 'UP' | 'DOWN' | 'FLAT' | 'UNKNOWN'
  farmTrendLabel: 'UP' | 'DOWN' | 'FLAT' | 'UNKNOWN'

  // Insight testuale
  insightText: string | null
}
