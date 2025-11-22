/**
 * Player Performance Profile Types (TIER 1 ONLY)
 *
 * Types for enterprise player performance analysis using ONLY real data
 * from matches_digest and dota_player_match_analysis.
 */

/**
 * Performance Index (0-100)
 * Normalizzato rispetto alle proprie partite (non assoluto)
 */
export interface PerformanceIndex {
  /** Aggressività: coinvolgimento nei fight (0-100) */
  aggressiveness: number
  /** Efficienza Farm: gestione risorse (0-100) */
  farmEfficiency: number
  /** Macro Gameplay: impatto mid/late game (0-100) */
  macroGameplay: number
  /** Stabilità: consistenza prestazioni (0-100) */
  consistency: number
}

/**
 * KPI per fase di gioco (Early/Mid/Late)
 */
export interface PhaseKPI {
  /** Early Game (0-10 min) */
  early: {
    /** Media kill nella fase early */
    avgKills: number | null
    /** Media morti nella fase early (se disponibile) */
    avgDeaths: number | null
  }
  /** Mid Game (10-30 min) */
  mid: {
    /** Media kill nella fase mid */
    avgKills: number | null
    /** Media morti nella fase mid (se disponibile) */
    avgDeaths: number | null
  }
  /** Late Game (30+ min) */
  late: {
    /** Media kill nella fase late */
    avgKills: number | null
    /** Media morti nella fase late (se disponibile) */
    avgDeaths: number | null
  }
}

/**
 * Punto nel trend di stile (per grafico)
 */
export interface StyleTrendPoint {
  /** Indice partita (0-N) o matchId */
  matchId: number
  /** Indice ordinato (0-N) */
  index: number
  /** Aggressività (0-100) */
  aggressiveness: number | null
  /** Farm efficiency (0-100) */
  farmEfficiency: number | null
  /** Macro gameplay (0-100) */
  macroGameplay: number | null
  /** Risultato partita */
  result: 'win' | 'lose'
  /** Data partita (opzionale) */
  date?: string
}

/**
 * Match data with analysis for performance calculation
 */
export interface MatchWithAnalysis {
  matchId: number
  kills: number
  deaths: number
  assists: number
  durationSeconds: number
  result: 'win' | 'lose'
  gpm: number | null
  xpm: number | null
  lastHits: number | null
  denies: number | null
  startTime: string
  // Analysis data (opzionale, da dota_player_match_analysis)
  analysis?: {
    killsEarly: number | null
    killsMid: number | null
    killsLate: number | null
  }
}

/**
 * Fight Profile Scores
 * Calcolati da kills, deaths, assists, duration_seconds (solo dati base)
 */
export interface FightProfileScores {
  /** Aggressività in fight (0-100) */
  aggressivenessScore: number | null
  /** Impatto nei fight (0-100) */
  impactScore: number | null
  /** Sopravvivenza (0-100) */
  survivalScore: number | null
  /** Label descrittivo aggressività */
  aggressivenessLabel: string | null
  /** Label descrittivo impatto */
  impactLabel: string | null
  /** Label descrittivo sopravvivenza */
  survivalLabel: string | null
}

/**
 * Complete player performance profile
 */
export interface PlayerPerformanceProfile {
  /** Sample size (number of matches used) */
  sampleSize: number
  /** Performance indices (0-100 each) */
  indices: PerformanceIndex
  /** Phase KPIs */
  phaseKPI: PhaseKPI
  /** Style trend (for chart) */
  styleTrend: StyleTrendPoint[]
  /** Textual insights (2-3 bullet points) */
  insights: string[]
}
