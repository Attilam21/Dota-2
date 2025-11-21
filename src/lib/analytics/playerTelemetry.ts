/**
 * Helper functions per calcolare telemetria aggiuntiva del giocatore
 * basata sui dati delle partite disponibili
 */

import { buildHeroSnapshot } from './overview'

export type MatchRow = {
  hero_id: number
  kills: number
  deaths: number
  assists: number
  duration_seconds: number
  result: 'win' | 'lose'
}

export interface PlayerTelemetry {
  totalMatches: number
  heroPoolSize: number
  preferredLane: string | null
  prevalentRole: string | null
  aggressivenessIndex: number // 0-100
  consistencyIndex: number // 0-100
  recentStreak: {
    type: 'win' | 'lose' | 'none'
    count: number
  }
  strengths: Array<{
    title: string
    description: string
  }>
  weaknesses: Array<{
    title: string
    description: string
  }>
}

/**
 * Calcola la dimensione dell'hero pool (numero di eroi distinti giocati)
 */
export function calculateHeroPoolSize(matches: MatchRow[]): number {
  if (matches.length === 0) return 0
  const uniqueHeroes = new Set(matches.map((m) => m.hero_id))
  return uniqueHeroes.size
}

/**
 * Calcola la lane preferita (placeholder - da implementare quando i dati lane saranno disponibili)
 */
export function calculatePreferredLane(matches: MatchRow[]): string | null {
  // TODO: Implementare quando i dati lane saranno disponibili nei match
  // Per ora restituisce null
  return null
}

/**
 * Calcola il ruolo prevalente (placeholder - da implementare quando i dati role saranno disponibili)
 */
export function calculatePrevalentRole(matches: MatchRow[]): string | null {
  // TODO: Implementare quando i dati role saranno disponibili nei match
  // Per ora restituisce null
  return null
}

/**
 * Calcola l'indice di aggressività (0-100)
 * Basato su: kills/min, assist/min, partecipazione ai fight
 */
export function calculateAggressivenessIndex(matches: MatchRow[]): number {
  if (matches.length === 0) return 0

  const last20 = matches.slice(0, 20)
  let totalKills = 0
  let totalAssists = 0
  let totalDuration = 0

  for (const match of last20) {
    totalKills += match.kills ?? 0
    totalAssists += match.assists ?? 0
    totalDuration += match.duration_seconds ?? 0
  }

  const avgDurationMinutes = totalDuration / (last20.length * 60)
  const killsPerMin = totalKills / (last20.length * avgDurationMinutes)
  const assistsPerMin = totalAssists / (last20.length * avgDurationMinutes)

  // Normalizza: kills/min * 10 + assists/min * 5 (max ~100 per giocatore molto aggressivo)
  const index = Math.min(100, (killsPerMin * 10 + assistsPerMin * 5) * 2)
  return Math.round(index)
}

/**
 * Calcola l'indice di consistenza (0-100)
 * Basato su deviazione standard di KDA (più bassa = più consistente)
 */
export function calculateConsistencyIndex(matches: MatchRow[]): number {
  if (matches.length < 3) return 50 // Non abbastanza dati

  const last20 = matches.slice(0, 20)
  const kdas = last20.map((m) => {
    const kda = (m.kills + m.assists) / Math.max(1, m.deaths)
    return kda
  })

  const mean = kdas.reduce((a, b) => a + b, 0) / kdas.length
  const variance =
    kdas.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / kdas.length
  const stdDev = Math.sqrt(variance)

  // Inverte: stdDev bassa = consistenza alta (100), stdDev alta = consistenza bassa (0)
  // Assumiamo che stdDev > 2.0 sia molto variabile, stdDev < 0.5 sia molto consistente
  const consistency = Math.max(0, Math.min(100, 100 - stdDev * 25))
  return Math.round(consistency)
}

/**
 * Calcola lo streak recente (vittorie o sconfitte consecutive)
 */
export function calculateRecentStreak(matches: MatchRow[]): {
  type: 'win' | 'lose' | 'none'
  count: number
} {
  if (matches.length === 0) return { type: 'none', count: 0 }

  const recent = matches.slice(0, 10) // Ultimi 10 match
  if (recent.length === 0) return { type: 'none', count: 0 }

  const firstResult = recent[0].result
  let count = 0

  for (const match of recent) {
    if (match.result === firstResult) {
      count++
    } else {
      break
    }
  }

  return {
    type: firstResult === 'win' ? 'win' : 'lose',
    count,
  }
}

/**
 * Genera insight sintetici (punti di forza e debolezze)
 * basati su logica deterministica semplice
 */
export function generateInsights(
  matches: MatchRow[],
  overviewKPI: {
    avgGpm?: number | null
    avgXpm?: number | null
    winRate?: number
    kdaAvg?: number
  } | null,
  styleKPI: {
    fightParticipation?: number
    earlyDeathsAvg?: number
  } | null,
): {
  strengths: Array<{ title: string; description: string }>
  weaknesses: Array<{ title: string; description: string }>
} {
  const strengths: Array<{ title: string; description: string }> = []
  const weaknesses: Array<{ title: string; description: string }> = []

  if (matches.length === 0) {
    return { strengths, weaknesses }
  }

  const last20 = matches.slice(0, 20)
  const avgGpm = overviewKPI?.avgGpm ?? 0
  const avgXpm = overviewKPI?.avgXpm ?? 0
  const winRate = overviewKPI?.winRate ?? 0
  const fightParticipation = styleKPI?.fightParticipation ?? 0
  const earlyDeathsAvg = styleKPI?.earlyDeathsAvg ?? 0

  // Punti di forza
  if (avgGpm > 450) {
    strengths.push({
      title: 'Farming efficiente',
      description:
        'Il tuo GPM è sopra la media: mantieni questo livello di farm per continuare a scalare.',
    })
  }

  if (fightParticipation > 60) {
    strengths.push({
      title: 'Alta partecipazione ai fight',
      description:
        'Sei presente nei momenti decisivi: continua a partecipare attivamente ai teamfight.',
    })
  }

  if (winRate > 55) {
    strengths.push({
      title: 'Winrate positivo',
      description:
        'Stai vincendo più partite di quante ne perdi: mantieni questo trend positivo.',
    })
  }

  // Debolezze / Aree di miglioramento
  if (earlyDeathsAvg > 2) {
    weaknesses.push({
      title: 'Morti early game elevate',
      description:
        'Troppe morti nei primi 10 minuti: migliora il posizionamento e la map awareness early game.',
    })
  }

  if (fightParticipation < 45) {
    weaknesses.push({
      title: 'Bassa partecipazione ai fight',
      description:
        'KP% basso: partecipa di più ai teamfight per aumentare il tuo impatto nella partita.',
    })
  }

  if (avgGpm < 350 && matches.length >= 10) {
    weaknesses.push({
      title: 'Farming da migliorare',
      description:
        'GPM sotto la media: concentrati sul farm per scalare meglio nelle partite.',
    })
  }

  return {
    strengths: strengths.slice(0, 2), // Max 2 punti di forza
    weaknesses: weaknesses.slice(0, 2), // Max 2 debolezze
  }
}

/**
 * Calcola telemetria completa del giocatore
 */
export function calculatePlayerTelemetry(
  matches: MatchRow[],
  overviewKPI: {
    avgGpm?: number | null
    avgXpm?: number | null
    winRate?: number
    kdaAvg?: number
  } | null,
  styleKPI: {
    fightParticipation?: number
    earlyDeathsAvg?: number
  } | null,
): PlayerTelemetry {
  const heroPoolSize = calculateHeroPoolSize(matches)
  const preferredLane = calculatePreferredLane(matches)
  const prevalentRole = calculatePrevalentRole(matches)
  const aggressivenessIndex = calculateAggressivenessIndex(matches)
  const consistencyIndex = calculateConsistencyIndex(matches)
  const recentStreak = calculateRecentStreak(matches)
  const { strengths, weaknesses } = generateInsights(
    matches,
    overviewKPI,
    styleKPI,
  )

  return {
    totalMatches: matches.length,
    heroPoolSize,
    preferredLane,
    prevalentRole,
    aggressivenessIndex,
    consistencyIndex,
    recentStreak,
    strengths,
    weaknesses,
  }
}
