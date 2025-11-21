/**
 * KPI Service per Dashboard Dota 2
 *
 * Questo servizio estende opendotaAdapter per fornire KPI aggregati e avanzati
 * utilizzati dalla dashboard. Tutti i KPI sono "Task-ready" per future implementazioni.
 */

import { fetchFromOpenDota } from '@/utils/opendota'
import {
  getRecentMatches,
  getMatchDetail,
  type MatchRow,
} from './opendotaAdapter'

// ============================================================================
// TIPI E INTERFACCE
// ============================================================================

export interface PlayerOverviewKPI {
  // KPI base
  totalMatches: number
  wins: number
  losses: number
  winRate: number // 0..100
  avgKills: number
  avgDeaths: number
  avgAssists: number
  kdaAvg: number
  avgDurationMinutes: number

  // KPI avanzati (Task-ready)
  avgGpm: number
  avgXpm: number
  avgLastHits: number
  avgDenies: number
  avgHeroDamage: number
  avgTowerDamage: number
  avgHeroHealing: number

  // Serie temporali per grafici
  kdaSeries: Array<{ matchId: number; kda: number; date: string }>
  gpmSeries: Array<{ matchId: number; gpm: number; date: string }>
  xpmSeries: Array<{ matchId: number; xpm: number; date: string }>
  damageSeries: Array<{ matchId: number; damage: number; date: string }>
}

export interface MomentumKPI {
  last10Results: Array<'win' | 'lose'>
  last10WinRate: number
  last5WinRate: number
  prev5WinRate: number
  trend: 'up' | 'down' | 'flat' | 'na'
  kdaTrend: Array<{ matchId: number; kda: number; date: string }>
  winStreak: number
  loseStreak: number
}

export interface HeroPoolKPI {
  heroes: Array<{
    heroId: number
    matches: number
    wins: number
    losses: number
    winRate: number
    kdaAvg: number
    avgDurationMinutes: number
    avgGpm: number
    avgXpm: number
    primaryRole?: string
    primaryLane?: string
  }>
  top5ByWinrate: Array<{
    heroId: number
    winRate: number
    matches: number
  }>
  top5ByMatches: Array<{
    heroId: number
    matches: number
    winRate: number
  }>
}

export interface StyleOfPlayKPI {
  // Aggressività
  killsPerMinute: number
  deathsPerMinute: number
  damagePerMinute: number

  // Presenza ai fight
  fightParticipation: number // KP% medio
  fightParticipationSeries: Array<{ matchId: number; kp: number; date: string }>

  // Early game
  earlyDeathsAvg: number // morti nei primi 10 minuti (media)
  earlyDeathsSeries: Array<{
    matchId: number
    earlyDeaths: number
    date: string
  }>
  earlyKda: number // KDA nei primi 10 minuti

  // Farming efficiency
  farmingEfficiency: {
    avgGpm: number
    avgXpm: number
    avgLastHitsPerMin: number
    avgDeniesPerMin: number
  }
  farmingSeries: Array<{
    matchId: number
    gpm: number
    xpm: number
    date: string
  }>

  // Objective focus
  avgTowerDamage: number
  avgRoshanKills: number // se disponibile

  // Badge/classificazione
  playstyleBadges: Array<
    'Aggressivo' | 'Farmer' | 'Utility' | 'Support' | 'Core'
  >
}

export interface PeersKPI {
  peers: Array<{
    accountId: number
    matchesTogether: number
    wins: number
    losses: number
    winRate: number
    avgKdaTogether: number
  }>
  top5ByWinrate: Array<{
    accountId: number
    winRate: number
    matchesTogether: number
  }>
  top5ByNegativeWinrate: Array<{
    accountId: number
    winRate: number
    matchesTogether: number
  }>
}

export interface AdvancedMatchKPI {
  matchId: number
  playerAccountId: number

  // KPI base
  kda: number
  gpm: number
  xpm: number
  lastHits: number
  denies: number
  heroDamage: number
  towerDamage: number
  heroHealing: number

  // Item progression
  itemBuild: Array<{
    itemId: number
    itemName: string
    purchaseTime: number // secondi dall'inizio
  }>

  // Timeline
  goldTimeline: Array<{ minute: number; gold: number }>
  xpTimeline: Array<{ minute: number; xp: number }>
  goldDiffTimeline: Array<{ minute: number; goldDiff: number }>

  // Vision
  wardsPlaced?: number
  wardsDestroyed?: number
  observerWards?: number
  sentryWards?: number

  // Fight participation
  fightParticipation?: number
  teamfightParticipation?: number
}

// ============================================================================
// FUNZIONI PRINCIPALI
// ============================================================================

export interface KpiOptions {
  limit?: number // numero di partite da considerare
  days?: number // ultimi N giorni (opzionale)
}

/**
 * Calcola KPI overview del giocatore
 */
export async function getPlayerOverviewKPI(
  accountId: number,
  options: KpiOptions = {},
): Promise<PlayerOverviewKPI> {
  const limit = options.limit || 100

  try {
    // Ottieni partite recenti
    const matches = await getRecentMatches(accountId, limit)

    if (matches.length === 0) {
      return getEmptyPlayerOverviewKPI()
    }

    // Calcola KPI base
    const totalMatches = matches.length
    const wins = matches.filter((m) => m.result === 'win').length
    const losses = totalMatches - wins
    const winRate = (wins / totalMatches) * 100

    const sumKills = matches.reduce((acc, m) => acc + (m.kills ?? 0), 0)
    const sumDeaths = matches.reduce((acc, m) => acc + (m.deaths ?? 0), 0)
    const sumAssists = matches.reduce((acc, m) => acc + (m.assists ?? 0), 0)

    const avgKills = sumKills / totalMatches
    const avgDeaths = sumDeaths / totalMatches
    const avgAssists = sumAssists / totalMatches
    const kdaAvg = (avgKills + avgAssists) / Math.max(1, avgDeaths)

    const sumDuration = matches.reduce(
      (acc, m) => acc + (m.duration_seconds ?? 0),
      0,
    )
    const avgDurationMinutes = Math.round(sumDuration / totalMatches / 60)

    // Calcola serie KDA
    const kdaSeries = matches.map((m) => ({
      matchId: m.match_id,
      kda: m.kda ?? (m.kills + m.assists) / Math.max(1, m.deaths),
      date: m.start_time,
    }))

    // Per GPM/XPM/Damage, proviamo a ottenere i dettagli delle prime 20 partite
    // (limite per non sovraccaricare l'API)
    const matchesToDetail = matches.slice(0, 20)
    let gpmSum = 0
    let xpmSum = 0
    let damageSum = 0
    let towerDamageSum = 0
    let lastHitsSum = 0
    let deniesSum = 0
    let healingSum = 0
    let detailCount = 0
    const gpmSeries: Array<{ matchId: number; gpm: number; date: string }> = []
    const xpmSeries: Array<{ matchId: number; xpm: number; date: string }> = []
    const damageSeries: Array<{
      matchId: number
      damage: number
      date: string
    }> = []

    // Carica dettagli match in parallelo (limitato a 5 per non sovraccaricare)
    const detailPromises = matchesToDetail.slice(0, 5).map(async (m) => {
      try {
        const detail = await getMatchDetail(m.match_id, accountId)
        if (detail) {
          const gpm = detail.player.gpm ?? 0
          const xpm = detail.player.xpm ?? 0
          const damage = detail.player.heroDamage ?? 0

          gpmSum += gpm
          xpmSum += xpm
          damageSum += damage
          towerDamageSum += detail.player.towerDamage ?? 0
          lastHitsSum += detail.player.lastHits ?? 0
          deniesSum += detail.player.denies ?? 0
          healingSum += detail.player.heroHealing ?? 0
          detailCount++

          gpmSeries.push({
            matchId: m.match_id,
            gpm,
            date: m.start_time,
          })
          xpmSeries.push({
            matchId: m.match_id,
            xpm,
            date: m.start_time,
          })
          damageSeries.push({
            matchId: m.match_id,
            damage,
            date: m.start_time,
          })
        }
      } catch (e) {
        // Ignora errori per singoli match
        console.error(`Error loading match ${m.match_id} details:`, e)
      }
    })

    // Attendi il completamento (non blocchiamo se alcuni falliscono)
    await Promise.allSettled(detailPromises)

    const avgGpm = detailCount > 0 ? gpmSum / detailCount : 0
    const avgXpm = detailCount > 0 ? xpmSum / detailCount : 0
    const avgHeroDamage = detailCount > 0 ? damageSum / detailCount : 0
    const avgTowerDamage = detailCount > 0 ? towerDamageSum / detailCount : 0
    const avgLastHits = detailCount > 0 ? lastHitsSum / detailCount : 0
    const avgDenies = detailCount > 0 ? deniesSum / detailCount : 0
    const avgHeroHealing = detailCount > 0 ? healingSum / detailCount : 0

    return {
      totalMatches,
      wins,
      losses,
      winRate: Number(winRate.toFixed(1)),
      avgKills: Number(avgKills.toFixed(1)),
      avgDeaths: Number(avgDeaths.toFixed(1)),
      avgAssists: Number(avgAssists.toFixed(1)),
      kdaAvg: Number(kdaAvg.toFixed(2)),
      avgDurationMinutes,
      avgGpm: Number(avgGpm.toFixed(0)),
      avgXpm: Number(avgXpm.toFixed(0)),
      avgLastHits: Number(avgLastHits.toFixed(0)),
      avgDenies: Number(avgDenies.toFixed(0)),
      avgHeroDamage: Number(avgHeroDamage.toFixed(0)),
      avgTowerDamage: Number(avgTowerDamage.toFixed(0)),
      avgHeroHealing: Number(avgHeroHealing.toFixed(0)),
      kdaSeries,
      gpmSeries: gpmSeries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
      xpmSeries: xpmSeries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
      damageSeries: damageSeries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    }
  } catch (error) {
    console.error('Error in getPlayerOverviewKPI:', error)
    return getEmptyPlayerOverviewKPI()
  }
}

/**
 * Calcola KPI di momentum (forma recente)
 */
export async function getMomentumKPI(
  accountId: number,
  options: KpiOptions = {},
): Promise<MomentumKPI> {
  const limit = options.limit || 20

  try {
    const matches = await getRecentMatches(accountId, limit)

    if (matches.length === 0) {
      return {
        last10Results: [],
        last10WinRate: 0,
        last5WinRate: 0,
        prev5WinRate: 0,
        trend: 'na',
        kdaTrend: [],
        winStreak: 0,
        loseStreak: 0,
      }
    }

    const last10 = matches.slice(0, 10)
    const last5 = matches.slice(0, 5)
    const prev5 = matches.slice(5, 10)

    const last10Results = last10.map((m) => m.result) as Array<'win' | 'lose'>
    const last10Wins = last10.filter((m) => m.result === 'win').length
    const last5Wins = last5.filter((m) => m.result === 'win').length
    const prev5Wins = prev5.filter((m) => m.result === 'win').length

    const last10WinRate =
      last10.length > 0 ? (last10Wins / last10.length) * 100 : 0
    const last5WinRate = last5.length > 0 ? (last5Wins / last5.length) * 100 : 0
    const prev5WinRate = prev5.length > 0 ? (prev5Wins / prev5.length) * 100 : 0

    let trend: 'up' | 'down' | 'flat' | 'na' = 'na'
    if (last5.length > 0 && prev5.length > 0) {
      if (last5WinRate > prev5WinRate + 10) trend = 'up'
      else if (last5WinRate < prev5WinRate - 10) trend = 'down'
      else trend = 'flat'
    }

    const kdaTrend = matches.slice(0, 20).map((m) => ({
      matchId: m.match_id,
      kda: m.kda ?? (m.kills + m.assists) / Math.max(1, m.deaths),
      date: m.start_time,
    }))

    // Calcola streak
    let winStreak = 0
    let loseStreak = 0
    for (const m of matches) {
      if (m.result === 'win') {
        winStreak++
        loseStreak = 0
      } else {
        loseStreak++
        winStreak = 0
      }
      if (winStreak > 0 || loseStreak > 0) break
    }

    return {
      last10Results,
      last10WinRate: Number(last10WinRate.toFixed(1)),
      last5WinRate: Number(last5WinRate.toFixed(1)),
      prev5WinRate: Number(prev5WinRate.toFixed(1)),
      trend,
      kdaTrend,
      winStreak,
      loseStreak,
    }
  } catch (error) {
    console.error('Error in getMomentumKPI:', error)
    return {
      last10Results: [],
      last10WinRate: 0,
      last5WinRate: 0,
      prev5WinRate: 0,
      trend: 'na',
      kdaTrend: [],
      winStreak: 0,
      loseStreak: 0,
    }
  }
}

/**
 * Calcola KPI del pool di eroi
 */
export async function getHeroPoolKPI(
  accountId: number,
  options: KpiOptions = {},
): Promise<HeroPoolKPI> {
  const limit = options.limit || 100

  try {
    const matches = await getRecentMatches(accountId, limit)

    if (matches.length === 0) {
      return {
        heroes: [],
        top5ByWinrate: [],
        top5ByMatches: [],
      }
    }

    // Aggrega per eroe
    const heroMap = new Map<
      number,
      {
        matches: number
        wins: number
        kills: number
        deaths: number
        assists: number
        duration: number
      }
    >()

    for (const m of matches) {
      const existing = heroMap.get(m.hero_id) || {
        matches: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        duration: 0,
      }

      existing.matches++
      if (m.result === 'win') existing.wins++
      existing.kills += m.kills ?? 0
      existing.deaths += m.deaths ?? 0
      existing.assists += m.assists ?? 0
      existing.duration += m.duration_seconds ?? 0

      heroMap.set(m.hero_id, existing)
    }

    const heroes = Array.from(heroMap.entries()).map(([heroId, stats]) => {
      const winRate = (stats.wins / stats.matches) * 100
      const kdaAvg =
        stats.deaths > 0
          ? (stats.kills / stats.matches + stats.assists / stats.matches) /
            (stats.deaths / stats.matches)
          : stats.kills / stats.matches + stats.assists / stats.matches

      return {
        heroId,
        matches: stats.matches,
        wins: stats.wins,
        losses: stats.matches - stats.wins,
        winRate: Number(winRate.toFixed(1)),
        kdaAvg: Number(kdaAvg.toFixed(2)),
        avgDurationMinutes: Math.round(stats.duration / stats.matches / 60),
        avgGpm: 0, // da popolare con dettagli
        avgXpm: 0,
      }
    })

    // Top 5 per winrate (minimo 3 partite)
    const top5ByWinrate = heroes
      .filter((h) => h.matches >= 3)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5)
      .map((h) => ({
        heroId: h.heroId,
        winRate: h.winRate,
        matches: h.matches,
      }))

    // Top 5 per numero partite
    const top5ByMatches = heroes
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 5)
      .map((h) => ({
        heroId: h.heroId,
        matches: h.matches,
        winRate: h.winRate,
      }))

    return {
      heroes,
      top5ByWinrate,
      top5ByMatches,
    }
  } catch (error) {
    console.error('Error in getHeroPoolKPI:', error)
    return {
      heroes: [],
      top5ByWinrate: [],
      top5ByMatches: [],
    }
  }
}

/**
 * Calcola KPI dello stile di gioco
 */
export async function getStyleOfPlayKPI(
  accountId: number,
  options: KpiOptions = {},
): Promise<StyleOfPlayKPI> {
  const limit = options.limit || 100

  try {
    const matches = await getRecentMatches(accountId, limit)

    if (matches.length === 0) {
      return getEmptyStyleOfPlayKPI()
    }

    // Per ora calcoliamo solo quello che possiamo dai dati base
    // I KPI avanzati richiedono dettagli match che aggiungeremo dopo
    const totalDuration = matches.reduce(
      (acc, m) => acc + (m.duration_seconds ?? 0),
      0,
    )
    const totalKills = matches.reduce((acc, m) => acc + (m.kills ?? 0), 0)
    const totalDeaths = matches.reduce((acc, m) => acc + (m.deaths ?? 0), 0)

    const killsPerMinute =
      totalDuration > 0 ? (totalKills / totalDuration) * 60 : 0
    const deathsPerMinute =
      totalDuration > 0 ? (totalDeaths / totalDuration) * 60 : 0

    // Badge playstyle (semplificato)
    const playstyleBadges: Array<
      'Aggressivo' | 'Farmer' | 'Utility' | 'Support' | 'Core'
    > = []
    if (killsPerMinute > 0.5) playstyleBadges.push('Aggressivo')
    if (killsPerMinute < 0.2 && deathsPerMinute < 0.3)
      playstyleBadges.push('Farmer')

    return {
      killsPerMinute: Number(killsPerMinute.toFixed(2)),
      deathsPerMinute: Number(deathsPerMinute.toFixed(2)),
      damagePerMinute: 0, // da popolare con dettagli
      fightParticipation: 0, // da popolare con dettagli
      fightParticipationSeries: [],
      earlyDeathsAvg: 0, // da popolare con dettagli
      earlyDeathsSeries: [],
      earlyKda: 0,
      farmingEfficiency: {
        avgGpm: 0,
        avgXpm: 0,
        avgLastHitsPerMin: 0,
        avgDeniesPerMin: 0,
      },
      farmingSeries: [],
      avgTowerDamage: 0,
      avgRoshanKills: 0,
      playstyleBadges,
    }
  } catch (error) {
    console.error('Error in getStyleOfPlayKPI:', error)
    return getEmptyStyleOfPlayKPI()
  }
}

/**
 * Calcola KPI dei compagni (peers)
 */
export async function getPeersKPI(
  accountId: number,
  options: KpiOptions = {},
): Promise<PeersKPI> {
  try {
    // Chiama endpoint OpenDota /peers
    const peersData = await fetchFromOpenDota<
      Array<{
        account_id: number
        last_played: number
        win: number
        games: number
        with_win: number
        with_games: number
        against_win: number
        against_games: number
        with_gpm_sum: number
        with_xpm_sum: number
      }>
    >(`/players/${accountId}/peers`)

    if (!peersData || peersData.length === 0) {
      return {
        peers: [],
        top5ByWinrate: [],
        top5ByNegativeWinrate: [],
      }
    }

    const peers = peersData
      .filter((p) => p.with_games > 0)
      .map((p) => {
        const winRate = (p.with_win / p.with_games) * 100
        return {
          accountId: p.account_id,
          matchesTogether: p.with_games,
          wins: p.with_win,
          losses: p.with_games - p.with_win,
          winRate: Number(winRate.toFixed(1)),
          avgKdaTogether: 0, // non disponibile da peers endpoint
        }
      })

    // Top 5 per winrate (minimo 3 partite insieme)
    const top5ByWinrate = peers
      .filter((p) => p.matchesTogether >= 3)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5)

    // Top 5 con winrate negativo (minimo 3 partite)
    const top5ByNegativeWinrate = peers
      .filter((p) => p.matchesTogether >= 3 && p.winRate < 50)
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, 5)

    return {
      peers,
      top5ByWinrate,
      top5ByNegativeWinrate,
    }
  } catch (error) {
    console.error('Error in getPeersKPI:', error)
    return {
      peers: [],
      top5ByWinrate: [],
      top5ByNegativeWinrate: [],
    }
  }
}

/**
 * Calcola KPI avanzati per un match specifico
 */
export async function getAdvancedMatchKPI(
  matchId: number,
  accountId: number,
): Promise<AdvancedMatchKPI | null> {
  try {
    const matchDetail = await getMatchDetail(matchId, accountId)

    return {
      matchId,
      playerAccountId: accountId,
      kda: matchDetail.player.kda,
      gpm: matchDetail.player.gpm ?? 0,
      xpm: matchDetail.player.xpm ?? 0,
      lastHits: matchDetail.player.lastHits ?? 0,
      denies: matchDetail.player.denies ?? 0,
      heroDamage: matchDetail.player.heroDamage ?? 0,
      towerDamage: matchDetail.player.towerDamage ?? 0,
      heroHealing: matchDetail.player.heroHealing ?? 0,
      itemBuild: [], // da popolare con dettagli parsed se disponibili
      goldTimeline: matchDetail.timeline.goldDiffSeries.map((g) => ({
        minute: g.minute,
        gold: g.goldDiff, // approssimato
      })),
      xpTimeline: [],
      goldDiffTimeline: matchDetail.timeline.goldDiffSeries,
      wardsPlaced: undefined,
      wardsDestroyed: undefined,
      observerWards: undefined,
      sentryWards: undefined,
      fightParticipation: undefined,
      teamfightParticipation: undefined,
    }
  } catch (error) {
    console.error('Error in getAdvancedMatchKPI:', error)
    return null
  }
}

// ============================================================================
// FUNZIONI HELPER
// ============================================================================

function getEmptyPlayerOverviewKPI(): PlayerOverviewKPI {
  return {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    avgKills: 0,
    avgDeaths: 0,
    avgAssists: 0,
    kdaAvg: 0,
    avgDurationMinutes: 0,
    avgGpm: 0,
    avgXpm: 0,
    avgLastHits: 0,
    avgDenies: 0,
    avgHeroDamage: 0,
    avgTowerDamage: 0,
    avgHeroHealing: 0,
    kdaSeries: [],
    gpmSeries: [],
    xpmSeries: [],
    damageSeries: [],
  }
}

function getEmptyStyleOfPlayKPI(): StyleOfPlayKPI {
  return {
    killsPerMinute: 0,
    deathsPerMinute: 0,
    damagePerMinute: 0,
    fightParticipation: 0,
    fightParticipationSeries: [],
    earlyDeathsAvg: 0,
    earlyDeathsSeries: [],
    earlyKda: 0,
    farmingEfficiency: {
      avgGpm: 0,
      avgXpm: 0,
      avgLastHitsPerMin: 0,
      avgDeniesPerMin: 0,
    },
    farmingSeries: [],
    avgTowerDamage: 0,
    avgRoshanKills: 0,
    playstyleBadges: [],
  }
}
