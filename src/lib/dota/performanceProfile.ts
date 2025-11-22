/**
 * Player Performance Profile Calculator (TIER 1 ONLY)
 *
 * Calculates enterprise performance indices using ONLY real data from:
 * - matches_digest (kills, deaths, assists, gpm, xpm, last_hits, duration)
 * - dota_player_match_analysis (kills_early/mid/late)
 *
 * All indices are normalized 0-100 relative to the player's own matches,
 * NOT absolute values.
 *
 * TODO [BUG-FIX]: Root cause of "killsEarly undefined" error:
 * - Problem: match.analysis can be undefined when analysis data is missing
 * - Solution: Use safe utility functions to always return numbers, never undefined
 * - All calculations must handle missing/null/undefined gracefully
 */

import type {
  PerformanceIndex,
  PhaseKPI,
  StyleTrendPoint,
  MatchWithAnalysis,
  PlayerPerformanceProfile,
} from '@/types/playerPerformance'

// Soglie massime per calcolo stabilità (hard-coded, documentate)
const MAX_STD_KDA = 2.0
const MAX_STD_GPM = 200
const MAX_STD_XPM = 200

/**
 * Utility function: safely convert value to number (fallback to 0)
 */
function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value
  }
  return fallback
}

/**
 * Utility function: safely get phase kills (returns 0 if null/undefined)
 */
function safePhaseKills(value: number | null | undefined): number {
  return safeNumber(value, 0)
}

/**
 * Normalizza un valore su scala 0-1 rispetto a min/max in un array
 */
function normalizeValue(value: number, values: number[]): number {
  if (values.length === 0) return 0
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return 0.5 // Se tutti i valori sono uguali, ritorna 0.5
  return (value - min) / (max - min)
}

/**
 * Clamp valore tra min e max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Calcola deviazione standard
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    values.length
  return Math.sqrt(variance)
}

/**
 * Calcola KDA
 */
function calculateKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists
  return (kills + assists) / deaths
}

/**
 * Calcola KP (Kill Participation) - proxy se non abbiamo team_kills
 */
function calculateKP(kills: number, assists: number, deaths: number): number {
  // Proxy: usa il rapporto (kills + assists) rispetto a (kills + deaths + assists)
  // Questo dà un'idea della partecipazione ai fight
  const total = kills + deaths + assists
  if (total === 0) return 0
  return (kills + assists) / total
}

/**
 * Calcola fight rate (kills+assists per minuto)
 */
function calculateFightRate(
  kills: number,
  assists: number,
  durationMinutes: number,
): number {
  if (durationMinutes === 0) return 0
  return (kills + assists) / durationMinutes
}

/**
 * Calcola Last Hits Per Minute
 */
function calculateLHPM(lastHits: number, durationMinutes: number): number {
  if (durationMinutes === 0) return 0
  return lastHits / durationMinutes
}

/**
 * Calcola indice Aggressività (0-100)
 */
function calculateAggressivenessIndex(matches: MatchWithAnalysis[]): number {
  if (matches.length === 0) return 0

  // Calcola metriche per ogni match
  const kps: number[] = []
  const fightRates: number[] = []
  const kdas: number[] = []

  matches.forEach((match) => {
    const durationMinutes = match.durationSeconds / 60
    const kp = calculateKP(match.kills, match.assists, match.deaths)
    const fr = calculateFightRate(match.kills, match.assists, durationMinutes)
    const kda = calculateKDA(match.kills, match.deaths, match.assists)

    kps.push(kp)
    fightRates.push(fr)
    kdas.push(kda)
  })

  // Calcola medie
  const avgKP = kps.reduce((a, b) => a + b, 0) / kps.length
  const avgFR = fightRates.reduce((a, b) => a + b, 0) / fightRates.length
  const avgKDA = kdas.reduce((a, b) => a + b, 0) / kdas.length

  // Normalizza rispetto alle proprie partite
  const normKP = normalizeValue(avgKP, kps)
  const normFR = normalizeValue(avgFR, fightRates)
  const normKDA = normalizeValue(avgKDA, kdas)

  // Calcola indice: 40% KP, 40% Fight Rate, 20% KDA
  const index = 100 * (0.4 * normKP + 0.4 * normFR + 0.2 * normKDA)
  return Math.round(clamp(index, 0, 100))
}

/**
 * Calcola indice Efficienza Farm (0-100)
 */
function calculateFarmEfficiencyIndex(matches: MatchWithAnalysis[]): number {
  if (matches.length === 0) return 0

  // Filtra match con GPM e Last Hits disponibili
  const validMatches = matches.filter(
    (m) => m.gpm !== null && m.lastHits !== null,
  )

  if (validMatches.length === 0) return 0

  // Calcola metriche per ogni match
  const gpms: number[] = []
  const lhpms: number[] = []

  validMatches.forEach((match) => {
    const durationMinutes = match.durationSeconds / 60
    if (match.gpm !== null) gpms.push(match.gpm)
    if (match.lastHits !== null) {
      const lhpm = calculateLHPM(match.lastHits, durationMinutes)
      lhpms.push(lhpm)
    }
  })

  if (gpms.length === 0) return 0

  // Calcola medie
  const avgGPM = gpms.reduce((a, b) => a + b, 0) / gpms.length
  const avgLHPM =
    lhpms.length > 0 ? lhpms.reduce((a, b) => a + b, 0) / lhpms.length : 0

  // Normalizza rispetto alle proprie partite
  const normGPM = normalizeValue(avgGPM, gpms)
  const normLHPM = lhpms.length > 0 ? normalizeValue(avgLHPM, lhpms) : 0.5

  // Calcola indice: 70% GPM, 30% LHPM
  const index = 100 * (0.7 * normGPM + 0.3 * normLHPM)
  return Math.round(clamp(index, 0, 100))
}

/**
 * Calcola indice Macro Gameplay (0-100)
 */
function calculateMacroGameplayIndex(matches: MatchWithAnalysis[]): number {
  if (matches.length === 0) return 0

  // Filtra match con analysis data (kills per fase) - use safe check
  const matchesWithAnalysis = matches.filter((m) => {
    if (!m.analysis) return false
    return (
      m.analysis.killsEarly !== null &&
      m.analysis.killsEarly !== undefined &&
      m.analysis.killsMid !== null &&
      m.analysis.killsMid !== undefined &&
      m.analysis.killsLate !== null &&
      m.analysis.killsLate !== undefined
    )
  })

  if (matchesWithAnalysis.length === 0) return 0

  // Calcola metriche per ogni match - use safe functions
  const midFocuses: number[] = []
  const lateFocuses: number[] = []
  const gpms: number[] = []

  matchesWithAnalysis.forEach((match) => {
    const killsEarly = safePhaseKills(match.analysis?.killsEarly)
    const killsMid = safePhaseKills(match.analysis?.killsMid)
    const killsLate = safePhaseKills(match.analysis?.killsLate)
    const totalKills = killsEarly + killsMid + killsLate

    if (totalKills > 0) {
      const midFocus = killsMid / totalKills
      const lateFocus = killsLate / totalKills
      midFocuses.push(midFocus)
      lateFocuses.push(lateFocus)
    }

    if (match.gpm !== null) gpms.push(match.gpm)
  })

  if (midFocuses.length === 0) return 0

  // Calcola medie
  const avgMidFocus = midFocuses.reduce((a, b) => a + b, 0) / midFocuses.length
  const avgLateFocus =
    lateFocuses.reduce((a, b) => a + b, 0) / lateFocuses.length

  // Normalizza rispetto alle proprie partite
  const normMid = normalizeValue(avgMidFocus, midFocuses)
  const normLate = normalizeValue(avgLateFocus, lateFocuses)
  const normGPM = gpms.length > 0 ? normalizeValue(gpms[0], gpms) : 0.5

  // Calcola indice: 40% Mid Focus, 40% Late Focus, 20% GPM
  const index = 100 * (0.4 * normMid + 0.4 * normLate + 0.2 * normGPM)
  return Math.round(clamp(index, 0, 100))
}

/**
 * Calcola indice Stabilità/Consistency (0-100)
 */
function calculateConsistencyIndex(matches: MatchWithAnalysis[]): number {
  if (matches.length === 0) return 0

  // Calcola KDA, GPM, XPM per ogni match
  const kdas: number[] = []
  const gpms: number[] = []
  const xpms: number[] = []

  matches.forEach((match) => {
    const kda = calculateKDA(match.kills, match.deaths, match.assists)
    kdas.push(kda)
    if (match.gpm !== null) gpms.push(match.gpm)
    if (match.xpm !== null) xpms.push(match.xpm)
  })

  if (kdas.length === 0) return 0

  // Calcola deviazione standard
  const stdKDA = calculateStdDev(kdas)
  const stdGPM = gpms.length > 0 ? calculateStdDev(gpms) : 0
  const stdXPM = xpms.length > 0 ? calculateStdDev(xpms) : 0

  // Trasforma in stabilità (deviazione bassa = stabilità alta)
  const stabilityKDA = clamp(100 * (1 - stdKDA / MAX_STD_KDA), 0, 100)
  const stabilityGPM = clamp(100 * (1 - stdGPM / MAX_STD_GPM), 0, 100)
  const stabilityXPM = clamp(100 * (1 - stdXPM / MAX_STD_XPM), 0, 100)

  // Media delle 3 stabilità
  const stabilityValues = [stabilityKDA]
  if (gpms.length > 0) stabilityValues.push(stabilityGPM)
  if (xpms.length > 0) stabilityValues.push(stabilityXPM)

  const index =
    stabilityValues.reduce((a, b) => a + b, 0) / stabilityValues.length
  return Math.round(clamp(index, 0, 100))
}

/**
 * Calcola KPI per fase (Early/Mid/Late)
 * HARDENED: Always returns valid PhaseKPI structure, never undefined/null properties
 */
function calculatePhaseKPI(matches: MatchWithAnalysis[]): PhaseKPI {
  // Filtra match con analysis data - use safe check for undefined analysis
  const matchesWithAnalysis = matches.filter((m) => {
    if (!m.analysis) return false
    return (
      m.analysis.killsEarly !== null &&
      m.analysis.killsEarly !== undefined &&
      m.analysis.killsMid !== null &&
      m.analysis.killsMid !== undefined &&
      m.analysis.killsLate !== null &&
      m.analysis.killsLate !== undefined
    )
  })

  if (matchesWithAnalysis.length === 0) {
    // Return empty structure with null values (never undefined)
    return {
      early: { avgKills: null, avgDeaths: null },
      mid: { avgKills: null, avgDeaths: null },
      late: { avgKills: null, avgDeaths: null },
    }
  }

  // Calcola medie per fase - use safe functions
  const earlyKills =
    matchesWithAnalysis
      .map((m) => safePhaseKills(m.analysis?.killsEarly))
      .reduce((a, b) => a + b, 0) / matchesWithAnalysis.length

  const midKills =
    matchesWithAnalysis
      .map((m) => safePhaseKills(m.analysis?.killsMid))
      .reduce((a, b) => a + b, 0) / matchesWithAnalysis.length

  const lateKills =
    matchesWithAnalysis
      .map((m) => safePhaseKills(m.analysis?.killsLate))
      .reduce((a, b) => a + b, 0) / matchesWithAnalysis.length

  return {
    early: {
      avgKills: Number(earlyKills.toFixed(1)),
      avgDeaths: null, // Non disponibile in Tier 1
    },
    mid: {
      avgKills: Number(midKills.toFixed(1)),
      avgDeaths: null, // Non disponibile in Tier 1
    },
    late: {
      avgKills: Number(lateKills.toFixed(1)),
      avgDeaths: null, // Non disponibile in Tier 1
    },
  }
}

/**
 * Calcola trend di stile (per grafico)
 * HARDENED: Always returns valid StyleTrendPoint[], never undefined/null properties
 */
function calculateStyleTrend(matches: MatchWithAnalysis[]): StyleTrendPoint[] {
  if (matches.length === 0) return []

  return matches.map((match, idx) => {
    const durationMinutes = match.durationSeconds / 60

    // Calcola metriche per questo match
    const kp = calculateKP(match.kills, match.assists, match.deaths)
    const fr = calculateFightRate(match.kills, match.assists, durationMinutes)
    const kda = calculateKDA(match.kills, match.deaths, match.assists)

    // Normalizza rispetto a tutte le partite (per questo punto)
    const allKPs = matches.map((m) => calculateKP(m.kills, m.assists, m.deaths))
    const allFRs = matches.map((m) =>
      calculateFightRate(m.kills, m.assists, m.durationSeconds / 60),
    )
    const allKDAs = matches.map((m) =>
      calculateKDA(m.kills, m.deaths, m.assists),
    )

    const normKP = normalizeValue(kp, allKPs)
    const normFR = normalizeValue(fr, allFRs)
    const normKDA = normalizeValue(kda, allKDAs)

    const aggressiveness = Math.round(
      100 * (0.4 * normKP + 0.4 * normFR + 0.2 * normKDA),
    )

    // Farm efficiency per questo match
    const farmEfficiency =
      match.gpm !== null && match.lastHits !== null
        ? (() => {
            const validMatches = matches.filter(
              (m) => m.gpm !== null && m.lastHits !== null,
            )
            if (validMatches.length === 0) return null
            const lhpm = calculateLHPM(match.lastHits, durationMinutes)
            const allGPMs = validMatches.map((m) => m.gpm!)
            const allLHPMs = validMatches.map((m) =>
              calculateLHPM(m.lastHits!, m.durationSeconds / 60),
            )
            const normGPM = normalizeValue(match.gpm, allGPMs)
            const normLHPM = normalizeValue(lhpm, allLHPMs)
            return Math.round(100 * (0.7 * normGPM + 0.3 * normLHPM))
          })()
        : null

    // Macro gameplay per questo match - use safe functions
    const macroGameplay = (() => {
      if (!match.analysis) return null

      const killsEarly = safePhaseKills(match.analysis.killsEarly)
      const killsMid = safePhaseKills(match.analysis.killsMid)
      const killsLate = safePhaseKills(match.analysis.killsLate)
      const totalKills = killsEarly + killsMid + killsLate

      if (totalKills === 0) return null

      const midFocus = killsMid / totalKills
      const lateFocus = killsLate / totalKills

      const matchesWithAnalysis = matches.filter((m) => {
        if (!m.analysis) return false
        return (
          m.analysis.killsEarly !== null &&
          m.analysis.killsEarly !== undefined &&
          m.analysis.killsMid !== null &&
          m.analysis.killsMid !== undefined &&
          m.analysis.killsLate !== null &&
          m.analysis.killsLate !== undefined
        )
      })

      if (matchesWithAnalysis.length === 0) return null

      const allMidFocuses = matchesWithAnalysis.map((m) => {
        const kE = safePhaseKills(m.analysis?.killsEarly)
        const kM = safePhaseKills(m.analysis?.killsMid)
        const kL = safePhaseKills(m.analysis?.killsLate)
        const tot = kE + kM + kL
        return tot > 0 ? kM / tot : 0
      })

      const allLateFocuses = matchesWithAnalysis.map((m) => {
        const kE = safePhaseKills(m.analysis?.killsEarly)
        const kM = safePhaseKills(m.analysis?.killsMid)
        const kL = safePhaseKills(m.analysis?.killsLate)
        const tot = kE + kM + kL
        return tot > 0 ? kL / tot : 0
      })

      const normMid = normalizeValue(midFocus, allMidFocuses)
      const normLate = normalizeValue(lateFocus, allLateFocuses)
      const normGPM =
        match.gpm !== null && matches.some((m) => m.gpm !== null)
          ? normalizeValue(
              match.gpm,
              matches.filter((m) => m.gpm !== null).map((m) => m.gpm!),
            )
          : 0.5

      return Math.round(100 * (0.4 * normMid + 0.4 * normLate + 0.2 * normGPM))
    })()

    return {
      matchId: match.matchId,
      index: idx,
      aggressiveness,
      farmEfficiency,
      macroGameplay,
      result: match.result,
      date: match.startTime,
    }
  })
}

/**
 * Genera insight testuali basati sui KPI
 */
function generateInsights(
  indices: PerformanceIndex,
  phaseKPI: PhaseKPI,
): string[] {
  const insights: string[] = []

  // Regola 1: Aggressività bassa + Farm alto
  if (indices.aggressiveness < 40 && indices.farmEfficiency >= 70) {
    insights.push(
      'Farming solido ma bassa partecipazione ai fight. Valuta di essere più presente nei combattimenti chiave.',
    )
  }

  // Regola 2: Aggressività alta + Farm basso
  if (indices.aggressiveness >= 70 && indices.farmEfficiency < 40) {
    insights.push(
      'Molto presente ai fight ma farm inefficiente. Rischi di arrivare in late senza risorse sufficienti.',
    )
  }

  // Regola 3: Macro alta
  if (indices.macroGameplay >= 70) {
    insights.push(
      'Buona gestione di mid e late game: sfrutti i vantaggi per chiudere prima le partite.',
    )
  }

  // Regola 4: Consistency molto bassa
  if (indices.consistency < 40) {
    insights.push(
      'Prestazioni altalenanti: alterni partite molto buone a partite negative. Lavora sulla ripetibilità delle performance.',
    )
  }

  // Regola 5: Consistency alta
  if (indices.consistency >= 70) {
    insights.push(
      'Profilo stabile: le tue partite hanno performance simili. Puoi concentrare il lavoro su piccoli miglioramenti mirati.',
    )
  }

  // Max 3 insight
  return insights.slice(0, 3)
}

/**
 * Calcola il profilo completo di performance del player
 * HARDENED: Always returns valid PlayerPerformanceProfile structure, never undefined/null properties
 */
export function calculatePlayerPerformanceProfile(
  matches: MatchWithAnalysis[],
): PlayerPerformanceProfile {
  // Handle empty array - return empty but valid structure
  if (!matches || matches.length === 0) {
    return {
      sampleSize: 0,
      indices: {
        aggressiveness: 0,
        farmEfficiency: 0,
        macroGameplay: 0,
        consistency: 0,
      },
      phaseKPI: {
        early: { avgKills: null, avgDeaths: null },
        mid: { avgKills: null, avgDeaths: null },
        late: { avgKills: null, avgDeaths: null },
      },
      styleTrend: [],
      insights: [
        'Non ci sono abbastanza partite recenti per calcolare il profilo di gioco.',
      ],
    }
  }

  // Limita a 20 partite (più recenti)
  const recentMatches = matches.slice(0, 20)

  // Calcola indici - always returns numbers (never undefined/null)
  const indices: PerformanceIndex = {
    aggressiveness: calculateAggressivenessIndex(recentMatches),
    farmEfficiency: calculateFarmEfficiencyIndex(recentMatches),
    macroGameplay: calculateMacroGameplayIndex(recentMatches),
    consistency: calculateConsistencyIndex(recentMatches),
  }

  // Calcola KPI per fase - always returns valid PhaseKPI
  const phaseKPI = calculatePhaseKPI(recentMatches)

  // Calcola trend di stile - always returns valid StyleTrendPoint[]
  const styleTrend = calculateStyleTrend(recentMatches)

  // Genera insight - always returns string[]
  const insights = generateInsights(indices, phaseKPI)

  return {
    sampleSize: recentMatches.length,
    indices,
    phaseKPI,
    styleTrend,
    insights,
  }
}
