/**
 * OpenDota Adapter
 *
 * Questo adapter mappa i dati dell'API OpenDota al formato utilizzato dalla dashboard Dota 2.
 * Mantiene la compatibilità con il formato esistente senza modificare i componenti UI.
 */

import { fetchFromOpenDota, type RecentMatch } from '@/utils/opendota'

/**
 * Formato MatchRow utilizzato dalla dashboard
 */
export type MatchRow = {
  id: string
  player_account_id: number
  match_id: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
  duration_seconds: number
  start_time: string // ISO timestamptz
  result: 'win' | 'lose'
  lane?: string | null
  role?: string | null
  kda?: number
}

/**
 * Formato PlayerOverview utilizzato dalla dashboard
 */
export type PlayerOverview = {
  totalMatches: number
  wins: number
  losses: number
  winRate: number // 0..100
  avgKills: number
  avgDeaths: number
  avgAssists: number
  kdaAvg: number
  avgDurationMinutes: number
}

/**
 * Formato MatchDetail utilizzato dalla dashboard
 */
export type MatchDetail = {
  match: {
    matchId: number
    durationSeconds: number
    startTime: string
    radiantWin: boolean
    mode?: number
    lobbyType?: number
    avgRankTier?: number
  }
  player: {
    accountId: number
    heroId: number
    kills: number
    deaths: number
    assists: number
    lastHits?: number
    denies?: number
    gpm?: number
    xpm?: number
    heroDamage?: number
    towerDamage?: number
    heroHealing?: number
    kda: number
    lane?: string | number | null
    role?: string | null
  }
  timeline: {
    goldDiffSeries: Array<{ minute: number; goldDiff: number }>
    killsByInterval: Array<{
      minuteFrom: number
      minuteTo: number
      teamKills: number
      enemyKills: number
    }>
  }
}

/**
 * Mappa un RecentMatch di OpenDota a MatchRow della dashboard
 */
function mapRecentMatchToMatchRow(
  match: RecentMatch,
  accountId: number,
): MatchRow {
  const isRadiant = match.player_slot < 128
  const result: 'win' | 'lose' =
    isRadiant === match.radiant_win ? 'win' : 'lose'
  const kda = (match.kills + match.assists) / Math.max(1, match.deaths)

  // Mappa lane da numero a stringa
  let lane: string | null = null
  if (match.lane !== undefined) {
    const laneMap: Record<number, string> = {
      1: 'safe',
      2: 'mid',
      3: 'offlane',
      4: 'jungle',
    }
    lane = laneMap[match.lane] || null
  }

  // Mappa role
  let role: string | null = match.role || null
  if (!role && match.lane_role !== undefined) {
    role = match.lane_role === 1 ? 'core' : 'support'
  }

  return {
    id: `${accountId}-${match.match_id}`,
    player_account_id: accountId,
    match_id: match.match_id,
    hero_id: match.hero_id,
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    duration_seconds: match.duration,
    start_time: new Date(match.start_time * 1000).toISOString(),
    result,
    lane,
    role,
    kda,
  }
}

/**
 * Ottiene l'overview di un giocatore da OpenDota
 *
 * @param accountId - Steam32 account ID del giocatore
 * @returns PlayerOverview con statistiche aggregate
 */
export async function getPlayerOverview(
  accountId: number,
): Promise<PlayerOverview> {
  try {
    // Ottieni le partite recenti
    const matches = await getRecentMatches(accountId, 100) // Limite ragionevole per calcolare statistiche

    if (matches.length === 0) {
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
      }
    }

    const totalMatches = matches.length
    const wins = matches.filter((m) => m.result === 'win').length
    const losses = totalMatches - wins
    const winRate = (wins / totalMatches) * 100

    const sumKills = matches.reduce((acc, m) => acc + m.kills, 0)
    const sumDeaths = matches.reduce((acc, m) => acc + m.deaths, 0)
    const sumAssists = matches.reduce((acc, m) => acc + m.assists, 0)
    const sumDuration = matches.reduce((acc, m) => acc + m.duration_seconds, 0)

    const avgKills = sumKills / totalMatches
    const avgDeaths = sumDeaths / totalMatches
    const avgAssists = sumAssists / totalMatches
    const kdaAvg = (avgKills + avgAssists) / Math.max(1, avgDeaths)
    const avgDurationMinutes = Math.round(sumDuration / totalMatches / 60)

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
    }
  } catch (error) {
    console.error('Error in getPlayerOverview:', error)
    throw error
  }
}

/**
 * Ottiene le partite recenti di un giocatore da OpenDota
 *
 * @param accountId - Steam32 account ID del giocatore
 * @param limit - Numero massimo di partite da restituire (default: 20)
 * @returns Array di MatchRow mappati dal formato OpenDota
 */
export async function getRecentMatches(
  accountId: number,
  limit: number = 20,
): Promise<MatchRow[]> {
  try {
    const recentMatches = await fetchFromOpenDota<RecentMatch[]>(
      `/players/${accountId}/recentMatches`,
    )

    // Limita il numero di partite
    const limitedMatches = recentMatches.slice(0, limit)

    // Mappa ogni partita al formato MatchRow
    return limitedMatches.map((match) =>
      mapRecentMatchToMatchRow(match, accountId),
    )
  } catch (error) {
    console.error('Error in getRecentMatches:', error)
    throw error
  }
}

/**
 * Ottiene i dettagli di una partita specifica da OpenDota
 *
 * @param matchId - ID della partita
 * @param accountId - Steam32 account ID del giocatore
 * @returns MatchDetail con informazioni complete della partita
 */
export async function getMatchDetail(
  matchId: number,
  accountId: number,
): Promise<MatchDetail> {
  try {
    // Tipo per la risposta completa di OpenDota match
    type OpenDotaMatch = {
      match_id: number
      duration: number
      start_time: number
      lobby_type?: number
      game_mode?: number
      avg_rank_tier?: number
      radiant_win: boolean
      radiant_gold_adv?: number[] | null
      players: Array<{
        account_id: number | null
        player_slot: number
        hero_id: number
        kills: number
        deaths: number
        assists: number
        last_hits?: number
        denies?: number
        gold_per_min?: number
        xp_per_min?: number
        hero_damage?: number
        tower_damage?: number
        hero_healing?: number
        lane?: string | number | null
        role?: string | null
        kills_log?: Array<{ time: number }>
      }>
    }

    const data = await fetchFromOpenDota<OpenDotaMatch>(`/matches/${matchId}`)

    // Trova il giocatore nella partita
    const player = data.players.find((p) => p.account_id === accountId)

    if (!player) {
      throw new Error('Player not found in match')
    }

    const kda = (player.kills + player.assists) / Math.max(1, player.deaths)

    // Crea la serie gold difference
    const goldSeries =
      data.radiant_gold_adv?.map((g, idx) => ({
        minute: idx,
        goldDiff: g ?? 0,
      })) ?? []

    // Aggrega kills per intervalli di 10 minuti
    const interval = 600 // 10 minuti in secondi
    const numBuckets = Math.max(1, Math.ceil(data.duration / interval))
    const buckets = Array.from({ length: numBuckets }, (_, i) => ({
      minuteFrom: i * 10,
      minuteTo: Math.min((i + 1) * 10, Math.ceil(data.duration / 60)),
      teamKills: 0,
      enemyKills: 0,
    }))

    const isTargetRadiant = player.player_slot < 128

    data.players.forEach((p) => {
      const isSameTeam = p.player_slot < 128 === isTargetRadiant
      const logs = p.kills_log ?? []

      logs.forEach((log) => {
        if (
          !log ||
          typeof log.time !== 'number' ||
          !Number.isFinite(log.time) ||
          log.time < 0
        ) {
          return
        }

        const rawIdx = Math.floor(log.time / interval)
        if (!Number.isFinite(rawIdx)) {
          return
        }

        const bucketIdx = Math.max(0, Math.min(rawIdx, numBuckets - 1))
        const bucket = buckets[bucketIdx]
        if (!bucket) return

        if (isSameTeam) {
          bucket.teamKills += 1
        } else {
          bucket.enemyKills += 1
        }
      })
    })

    const response: MatchDetail = {
      match: {
        matchId: data.match_id,
        durationSeconds: data.duration,
        startTime: new Date(data.start_time * 1000).toISOString(),
        radiantWin: data.radiant_win,
        mode: data.game_mode,
        lobbyType: data.lobby_type,
        avgRankTier: data.avg_rank_tier,
      },
      player: {
        accountId,
        heroId: player.hero_id,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        lastHits: player.last_hits,
        denies: player.denies,
        gpm: player.gold_per_min,
        xpm: player.xp_per_min,
        heroDamage: player.hero_damage,
        towerDamage: player.tower_damage,
        heroHealing: player.hero_healing,
        kda,
        lane: player.lane,
        role: player.role,
      },
      timeline: {
        goldDiffSeries: goldSeries,
        killsByInterval: buckets,
      },
    }

    return response
  } catch (error) {
    console.error('Error in getMatchDetail:', error)
    throw error
  }
}
