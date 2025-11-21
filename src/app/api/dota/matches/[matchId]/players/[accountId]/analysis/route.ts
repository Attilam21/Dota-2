/**
 * API Route: Dota 2 Player Match Analysis
 *
 * GET /api/dota/matches/[matchId]/players/[accountId]/analysis
 *
 * Returns detailed analysis for a player in a specific match including:
 * - Kill/death distribution by game phase (early/mid/late)
 * - Death cost analysis (gold/xp/cs lost)
 * - Death by role analysis
 * - Individual death events (optional)
 *
 * If analysis doesn't exist in database, it will:
 * 1. Fetch raw data from OpenDota
 * 2. Calculate all KPIs
 * 3. Store in Supabase
 * 4. Return the analysis
 */

import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabaseAdmin'
import { fetchFromOpenDota } from '@/utils/opendota'
import type {
  DotaPlayerMatchAnalysis,
  DotaPlayerDeathEvent,
  GamePhase,
  RolePosition,
} from '@/types/dotaAnalysis'
import { getGamePhase } from '@/types/dotaAnalysis'

/**
 * Helper: Calculate respawn time based on level
 * Formula approssimata: base time + (level * multiplier)
 */
function calculateRespawnTime(level: number): number {
  // Base respawn time: 5 seconds
  // Additional time per level: ~2 seconds
  return 5 + level * 2
}

/**
 * Helper: Calculate death cost (gold/xp/cs lost during downtime)
 */
function calculateDeathCost(
  downtimeSeconds: number,
  gpm: number,
  xpm: number,
  csPerMin: number,
): { goldLost: number; xpLost: number; csLost: number } {
  const goldLost = Math.round((downtimeSeconds * gpm) / 60)
  const xpLost = Math.round((downtimeSeconds * xpm) / 60)
  const csLost = Math.round((downtimeSeconds * csPerMin) / 60)
  return { goldLost, xpLost, csLost }
}

/**
 * Fetch and calculate analysis from OpenDota match data
 */
async function calculateAnalysisFromOpenDota(
  matchId: number,
  accountId: number,
): Promise<DotaPlayerMatchAnalysis> {
  // Fetch match detail from OpenDota
  // Based on OpenDota API Spec v28.0.0
  // NOTE: deaths_log is NOT documented in official spec, but may exist in some matches
  // killed_by is documented as object (not array) - use as fallback
  type OpenDotaMatch = {
    match_id: number
    duration: number
    radiant_win: boolean
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
      level?: number
      kills_log?: Array<{ time: number; key?: string }> // key = hero killed (documented)
      deaths_log?: Array<{ time: number; by?: { hero_id?: number } }> // NOT documented, but may exist
      killed_by?: Record<string, number> // Documented: object with hero_id keys and kill counts
      lane?: number
      role?: number | string
    }>
  }

  const matchData = await fetchFromOpenDota<OpenDotaMatch>(
    `/matches/${matchId}`,
  )

  // Find the player
  const player = matchData.players.find((p) => p.account_id === accountId)
  if (!player) {
    throw new Error(`Player ${accountId} not found in match ${matchId}`)
  }

  // Determine role position (map from lane/role if available)
  // Default to 1 if not available (will be improved with better data)
  let rolePosition: RolePosition = 1
  if (player.role !== undefined && typeof player.role === 'number') {
    // OpenDota role: 0=Safe, 1=Mid, 2=Off, 3=Jungle, 4=Roaming
    // Map to Dota 2 positions: 1=Safe, 2=Mid, 3=Off, 4=Roaming, 5=Hard Support
    const roleMap: Record<number, RolePosition> = {
      0: 1, // Safe → Pos1
      1: 2, // Mid → Pos2
      2: 3, // Off → Pos3
      4: 4, // Roaming → Pos4
    }
    rolePosition = roleMap[player.role] ?? 1
  }

  // Get player stats
  const gpm = player.gold_per_min ?? 400 // Fallback
  const xpm = player.xp_per_min ?? 500 // Fallback
  const lastHits = player.last_hits ?? 0
  const denies = player.denies ?? 0
  const durationMinutes = matchData.duration / 60
  const csPerMin = durationMinutes > 0 ? lastHits / durationMinutes : 0

  // Process kills by phase
  // NOTE: kills_log is documented with {time: integer, key: string} structure
  const killsLog = player.kills_log ?? []
  const killsByPhase = { early: 0, mid: 0, late: 0 }
  killsLog.forEach((kill) => {
    const phase = getGamePhase(kill.time)
    killsByPhase[phase]++
  })

  // Process deaths by phase and calculate death events
  // STRATEGY: Use deaths_log if available (may not be documented but exists in some matches)
  // FALLBACK: If deaths_log is empty, estimate from killed_by object and deaths count
  const deathsLog = player.deaths_log ?? []
  const killedBy = player.killed_by ?? {}

  console.log(
    `[DOTA2] Processing deaths: player.deaths=${
      player.deaths
    }, deathsLog.length=${deathsLog.length}, killed_by keys=${
      Object.keys(killedBy).length
    }`,
  )

  // If player has deaths but deaths_log is empty, use fallback strategy
  const useFallbackStrategy = player.deaths > 0 && deathsLog.length === 0

  if (useFallbackStrategy) {
    console.warn(
      `[DOTA2] WARNING: Player has ${player.deaths} deaths but deaths_log is empty. Using fallback strategy with killed_by object and estimated timing.`,
    )
  }

  const deathsByPhase = { early: 0, mid: 0, late: 0 }
  const deathEvents: DotaPlayerDeathEvent[] = []
  const deathsByRole: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  // Get player's final level for better level estimation
  // OpenDota provides player.level (final level at end of match)
  // We use this as a reference point for level estimation
  const finalLevel = player.level ?? null
  const finalLevelTime = matchData.duration

  // Process death events using primary strategy (deaths_log) or fallback (killed_by + estimation)
  if (useFallbackStrategy) {
    // FALLBACK STRATEGY: Use killed_by object and estimate timing
    // killed_by is an object like { "hero_id_1": count1, "hero_id_2": count2, ... }
    // We distribute deaths evenly across match duration and use killed_by for killer info

    const totalDeaths = player.deaths
    const estimatedDeathInterval =
      totalDeaths > 0 ? matchData.duration / totalDeaths : 0

    Object.entries(killedBy).forEach(([heroIdStr, killCount], idx) => {
      const killerHeroId = parseInt(heroIdStr, 10)
      if (isNaN(killerHeroId) || killCount <= 0) return

      // Create estimated death events for this killer
      // Distribute deaths evenly across match duration
      for (let i = 0; i < killCount; i++) {
        const estimatedTime = Math.min(
          matchData.duration,
          Math.floor(
            idx * estimatedDeathInterval +
              (i * estimatedDeathInterval) / killCount,
          ),
        )
        const phase = getGamePhase(estimatedTime)
        deathsByPhase[phase]++

        // Estimate level at death
        let levelAtDeath: number
        if (finalLevel !== null && finalLevel > 0) {
          const timeRatio = estimatedTime / finalLevelTime
          if (timeRatio < 0.2) {
            levelAtDeath = Math.min(
              finalLevel,
              Math.max(1, Math.floor(1 + timeRatio * 5 * 1.5)),
            )
          } else {
            levelAtDeath = Math.min(
              finalLevel,
              Math.max(
                1,
                Math.floor(1 + ((timeRatio - 0.2) * (finalLevel - 1)) / 0.8),
              ),
            )
          }
        } else {
          levelAtDeath = Math.min(
            30,
            Math.max(1, Math.floor((estimatedTime / matchData.duration) * 30)),
          )
        }

        const downtimeSeconds = calculateRespawnTime(levelAtDeath)
        const { goldLost, xpLost, csLost } = calculateDeathCost(
          downtimeSeconds,
          gpm,
          xpm,
          csPerMin,
        )

        // Find killer role from match data
        let killerRolePosition: RolePosition | undefined
        const killerPlayer = matchData.players.find(
          (p) => p.hero_id === killerHeroId,
        )
        if (
          killerPlayer?.role !== undefined &&
          typeof killerPlayer.role === 'number'
        ) {
          const roleMap: Record<number, RolePosition> = {
            0: 1,
            1: 2,
            2: 3,
            4: 4,
          }
          killerRolePosition = roleMap[killerPlayer.role] ?? undefined
          if (killerRolePosition) {
            deathsByRole[killerRolePosition]++
          }
        }

        const deathEvent: DotaPlayerDeathEvent = {
          matchId,
          accountId,
          timeSeconds: estimatedTime,
          phase,
          levelAtDeath,
          downtimeSeconds,
          goldLost,
          xpLost,
          csLost,
          killerHeroId,
          killerRolePosition,
        }

        deathEvents.push(deathEvent)
      }
    })

    // If killed_by doesn't cover all deaths, create remaining events without killer info
    const deathsWithKiller = deathEvents.length
    const remainingDeaths = totalDeaths - deathsWithKiller
    if (remainingDeaths > 0) {
      console.log(
        `[DOTA2] Creating ${remainingDeaths} additional death events without killer info (killed_by didn't cover all deaths)`,
      )
      for (let i = 0; i < remainingDeaths; i++) {
        const estimatedTime = Math.min(
          matchData.duration,
          Math.floor((deathsWithKiller + i) * estimatedDeathInterval),
        )
        const phase = getGamePhase(estimatedTime)
        deathsByPhase[phase]++

        let levelAtDeath: number
        if (finalLevel !== null && finalLevel > 0) {
          const timeRatio = estimatedTime / finalLevelTime
          if (timeRatio < 0.2) {
            levelAtDeath = Math.min(
              finalLevel,
              Math.max(1, Math.floor(1 + timeRatio * 5 * 1.5)),
            )
          } else {
            levelAtDeath = Math.min(
              finalLevel,
              Math.max(
                1,
                Math.floor(1 + ((timeRatio - 0.2) * (finalLevel - 1)) / 0.8),
              ),
            )
          }
        } else {
          levelAtDeath = Math.min(
            30,
            Math.max(1, Math.floor((estimatedTime / matchData.duration) * 30)),
          )
        }

        const downtimeSeconds = calculateRespawnTime(levelAtDeath)
        const { goldLost, xpLost, csLost } = calculateDeathCost(
          downtimeSeconds,
          gpm,
          xpm,
          csPerMin,
        )

        const deathEvent: DotaPlayerDeathEvent = {
          matchId,
          accountId,
          timeSeconds: estimatedTime,
          phase,
          levelAtDeath,
          downtimeSeconds,
          goldLost,
          xpLost,
          csLost,
          killerHeroId: undefined,
          killerRolePosition: undefined,
        }

        deathEvents.push(deathEvent)
      }
    }
  } else {
    // PRIMARY STRATEGY: Use deaths_log (if available)
    deathsLog.forEach((death, idx) => {
      const phase = getGamePhase(death.time)
      deathsByPhase[phase]++

      // Calculate level at death with improved estimation
      // Strategy:
      // 1. If final level is available, use it as upper bound
      // 2. Estimate level based on time progression (non-linear: early levels faster)
      // 3. Use formula: level ≈ 1 + (time / duration) * (finalLevel - 1) with early game boost
      let levelAtDeath: number
      if (finalLevel !== null && finalLevel > 0) {
        // Use final level as reference for better estimation
        // Early game (0-10 min): faster leveling, mid/late: slower
        const timeRatio = death.time / finalLevelTime
        if (timeRatio < 0.2) {
          // Early game: levels 1-6 faster (first 20% of time)
          levelAtDeath = Math.min(
            finalLevel,
            Math.max(1, Math.floor(1 + timeRatio * 5 * 1.5)), // Boost early levels
          )
        } else {
          // Mid/late game: more linear progression
          levelAtDeath = Math.min(
            finalLevel,
            Math.max(
              1,
              Math.floor(1 + ((timeRatio - 0.2) * (finalLevel - 1)) / 0.8),
            ),
          )
        }
      } else {
        // Fallback: linear estimation (original method)
        levelAtDeath = Math.min(
          30,
          Math.max(1, Math.floor((death.time / matchData.duration) * 30)),
        )
      }
      const downtimeSeconds = calculateRespawnTime(levelAtDeath)
      const { goldLost, xpLost, csLost } = calculateDeathCost(
        downtimeSeconds,
        gpm,
        xpm,
        csPerMin,
      )

      // Try to find killer from match data
      // Note: OpenDota deaths_log may have 'by' field with hero_id
      let killerHeroId: number | undefined
      let killerRolePosition: RolePosition | undefined

      if (death.by?.hero_id) {
        killerHeroId = death.by.hero_id
        // Find killer player to get role
        const killerPlayer = matchData.players.find(
          (p) => p.hero_id === killerHeroId,
        )
        if (
          killerPlayer?.role !== undefined &&
          typeof killerPlayer.role === 'number'
        ) {
          const roleMap: Record<number, RolePosition> = {
            0: 1,
            1: 2,
            2: 3,
            4: 4,
          }
          killerRolePosition = roleMap[killerPlayer.role] ?? undefined
          if (killerRolePosition) {
            deathsByRole[killerRolePosition]++
          }
        }
      }

      // Ensure all required fields are present
      // If OpenDota doesn't provide enough data, save event with available data
      // and set missing cost fields to 0 (but don't skip the event)
      const deathEvent: DotaPlayerDeathEvent = {
        matchId,
        accountId,
        timeSeconds: death.time ?? 0, // Fallback to 0 if missing
        phase, // 'early' | 'mid' | 'late' (from getGamePhase)
        levelAtDeath: levelAtDeath ?? 1, // Fallback to 1 if missing
        downtimeSeconds: downtimeSeconds ?? 0, // Fallback to 0 if missing
        goldLost: goldLost ?? 0, // Fallback to 0 if calculation failed
        xpLost: xpLost ?? 0, // Fallback to 0 if calculation failed
        csLost: csLost ?? 0, // Fallback to 0 if calculation failed
        killerHeroId: killerHeroId ?? undefined,
        killerRolePosition: killerRolePosition ?? undefined,
        // posX and posY remain undefined (not available from OpenDota standard endpoint)
      }

      deathEvents.push(deathEvent)
    })
  }

  console.log(
    `[DOTA2] Created ${deathEvents.length} death events using ${
      useFallbackStrategy
        ? 'fallback strategy (killed_by + estimation)'
        : 'primary strategy (deaths_log)'
    }`,
  )

  // Calculate percentages
  const totalKills = player.kills
  const totalDeaths = player.deaths
  const killPctEarly =
    totalKills > 0 ? (killsByPhase.early / totalKills) * 100 : 0
  const killPctMid = totalKills > 0 ? (killsByPhase.mid / totalKills) * 100 : 0
  const killPctLate =
    totalKills > 0 ? (killsByPhase.late / totalKills) * 100 : 0

  const deathPctEarly =
    totalDeaths > 0 ? (deathsByPhase.early / totalDeaths) * 100 : 0
  const deathPctMid =
    totalDeaths > 0 ? (deathsByPhase.mid / totalDeaths) * 100 : 0
  const deathPctLate =
    totalDeaths > 0 ? (deathsByPhase.late / totalDeaths) * 100 : 0

  // Calculate total death costs
  const totalGoldLost = deathEvents.reduce((sum, e) => sum + e.goldLost, 0)
  const totalXpLost = deathEvents.reduce((sum, e) => sum + e.xpLost, 0)
  const totalCsLost = deathEvents.reduce((sum, e) => sum + e.csLost, 0)

  // Calculate death by role percentages
  const deathPctPos1 =
    totalDeaths > 0 ? (deathsByRole[1] / totalDeaths) * 100 : 0
  const deathPctPos2 =
    totalDeaths > 0 ? (deathsByRole[2] / totalDeaths) * 100 : 0
  const deathPctPos3 =
    totalDeaths > 0 ? (deathsByRole[3] / totalDeaths) * 100 : 0
  const deathPctPos4 =
    totalDeaths > 0 ? (deathsByRole[4] / totalDeaths) * 100 : 0
  const deathPctPos5 =
    totalDeaths > 0 ? (deathsByRole[5] / totalDeaths) * 100 : 0

  return {
    matchId,
    accountId,
    rolePosition,
    killDistribution: killsByPhase,
    killPercentageDistribution: {
      early: Number(killPctEarly.toFixed(1)),
      mid: Number(killPctMid.toFixed(1)),
      late: Number(killPctLate.toFixed(1)),
    },
    deathDistribution: deathsByPhase,
    deathPercentageDistribution: {
      early: Number(deathPctEarly.toFixed(1)),
      mid: Number(deathPctMid.toFixed(1)),
      late: Number(deathPctLate.toFixed(1)),
    },
    deathCostSummary: {
      totalGoldLost,
      totalXpLost,
      totalCsLost,
    },
    deathByRole: {
      pos1: Number(deathPctPos1.toFixed(1)),
      pos2: Number(deathPctPos2.toFixed(1)),
      pos3: Number(deathPctPos3.toFixed(1)),
      pos4: Number(deathPctPos4.toFixed(1)),
      pos5: Number(deathPctPos5.toFixed(1)),
    },
    deathEvents,
  }
}

/**
 * Upsert death events for a match+player
 * Deletes existing events and inserts new ones (idempotent)
 *
 * IMPORTANT: This function throws errors and does NOT silence them.
 * The caller must handle errors appropriately.
 */
async function upsertDeathEvents(
  matchId: number,
  accountId: number,
  events: DotaPlayerDeathEvent[],
): Promise<void> {
  const supabaseAdmin = getAdminClient()

  console.log(
    `[DOTA2] upsertDeathEvents: matchId=${matchId}, accountId=${accountId}, eventsCount=${events.length}`,
  )

  if (events.length === 0) {
    // No events to store, but ensure old ones are deleted
    console.log(
      `[DOTA2] No death events to insert for match ${matchId}, player ${accountId}. Cleaning up old events.`,
    )
    const { error: deleteError } = await supabaseAdmin
      .from('dota_player_death_events')
      .delete()
      .eq('match_id', matchId)
      .eq('account_id', accountId)

    if (deleteError) {
      console.error('[DOTA2] Error deleting old death events:', deleteError)
      throw new Error(
        `Failed to delete existing death events: ${deleteError.message}`,
      )
    }
    return
  }

  // Delete existing events for this match+player (idempotent)
  const { error: deleteError } = await supabaseAdmin
    .from('dota_player_death_events')
    .delete()
    .eq('match_id', matchId)
    .eq('account_id', accountId)

  if (deleteError) {
    console.error('[DOTA2] Error deleting existing death events:', deleteError)
    throw new Error(
      `Failed to delete existing death events: ${deleteError.message}`,
    )
  }

  // Prepare events for insertion
  // Ensure all required fields are present, use 0 for missing cost calculations
  const eventsToInsert = events.map((event, idx) => {
    // Validate required fields
    if (event.timeSeconds === undefined || event.timeSeconds < 0) {
      console.warn(
        `[DOTA2] Warning: Event ${idx} has invalid timeSeconds: ${event.timeSeconds}`,
      )
    }
    if (!event.phase || !['early', 'mid', 'late'].includes(event.phase)) {
      console.warn(
        `[DOTA2] Warning: Event ${idx} has invalid phase: ${event.phase}`,
      )
    }

    return {
      match_id: event.matchId,
      account_id: event.accountId,
      time_seconds: event.timeSeconds,
      phase: event.phase, // 'early' | 'mid' | 'late' (lowercase, matches database CHECK constraint)
      level_at_death: event.levelAtDeath ?? 1, // Default to 1 if missing
      downtime_seconds: event.downtimeSeconds ?? 0, // Default to 0 if missing
      gold_lost: event.goldLost ?? 0, // Default to 0 if missing
      xp_lost: event.xpLost ?? 0, // Default to 0 if missing
      cs_lost: event.csLost ?? 0, // Default to 0 if missing
      killer_hero_id: event.killerHeroId ?? null,
      killer_role_position: event.killerRolePosition ?? null,
      pos_x: event.posX ?? null,
      pos_y: event.posY ?? null,
    }
  })

  console.log(
    `[DOTA2] Inserting ${eventsToInsert.length} death events into dota_player_death_events`,
  )

  // Insert new events
  const { data: insertedData, error: insertError } = await supabaseAdmin
    .from('dota_player_death_events')
    .insert(eventsToInsert)
    .select()

  if (insertError) {
    console.error('[DOTA2] Error saving death events:', insertError)
    console.error(
      `[DOTA2] Failed to insert ${eventsToInsert.length} events for match ${matchId}, player ${accountId}`,
    )
    console.error(
      '[DOTA2] First event sample:',
      JSON.stringify(eventsToInsert[0], null, 2),
    )
    throw new Error(
      `Failed to insert death events: ${
        insertError.message
      }. Details: ${JSON.stringify(insertError)}`,
    )
  }

  console.log(
    `[DOTA2] Successfully inserted ${
      insertedData?.length ?? eventsToInsert.length
    } death events`,
  )
}

/**
 * Upsert matches_digest with extended Dota 2 data
 * Populates: kda, role_position, gold_per_min, xp_per_min, last_hits, denies
 * This ensures matches_digest is kept in sync even when sync route is disabled
 */
async function upsertMatchesDigest(
  matchId: number,
  accountId: number,
  matchData: {
    match_id: number
    duration: number
    start_time: number
    radiant_win: boolean
  },
  player: {
    hero_id: number
    kills: number
    deaths: number
    assists: number
    player_slot: number
    gold_per_min?: number
    xp_per_min?: number
    last_hits?: number
    denies?: number
    lane?: number
    role?: number | string
  },
  rolePosition: RolePosition,
): Promise<void> {
  const supabaseAdmin = getAdminClient()

  // Calculate KDA
  const kda =
    player.deaths > 0
      ? (player.kills + player.assists) / player.deaths
      : player.kills + player.assists

  // Determine result (win/lose)
  const isRadiant = player.player_slot < 128
  const result = isRadiant === matchData.radiant_win ? 'win' : 'lose'

  // Map lane from OpenDota number to text
  let lane: string | null = null
  if (player.lane !== undefined) {
    const laneMap: Record<number, string> = {
      0: 'safe',
      1: 'mid',
      2: 'offlane',
      3: 'jungle',
      4: 'roaming',
    }
    lane = laneMap[player.lane] ?? null
  }

  // Map role from OpenDota to text
  let role: string | null = null
  if (player.role !== undefined) {
    if (typeof player.role === 'string') {
      role = player.role
    } else if (typeof player.role === 'number') {
      const roleMap: Record<number, string> = {
        0: 'safe',
        1: 'mid',
        2: 'offlane',
        3: 'jungle',
        4: 'roaming',
      }
      role = roleMap[player.role] ?? null
    }
  }

  // Convert start_time (Unix timestamp) to ISO string
  const startTime = new Date(matchData.start_time * 1000).toISOString()

  // Upsert matches_digest
  const { error: digestError } = await supabaseAdmin
    .from('matches_digest')
    .upsert(
      {
        player_account_id: accountId,
        match_id: matchId,
        hero_id: player.hero_id,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        duration_seconds: matchData.duration,
        start_time: startTime,
        result,
        // Extended columns (now populated)
        kda: Number(kda.toFixed(2)),
        role_position: rolePosition,
        gold_per_min: player.gold_per_min ?? null,
        xp_per_min: player.xp_per_min ?? null,
        last_hits: player.last_hits ?? null,
        denies: player.denies ?? null,
        // Optional text columns
        lane,
        role,
      },
      {
        onConflict: 'player_account_id,match_id',
      },
    )

  if (digestError) {
    console.error('matches_digest upsert error:', digestError)
    // Non-blocking: log error but don't fail the analysis
    // This ensures analysis still works even if matches_digest update fails
  } else {
    console.log(
      `matches_digest updated for match ${matchId}, player ${accountId}`,
    )
  }
}

/**
 * Upsert match analysis summary for a match+player
 * If exists, updates; if not, inserts
 */
async function upsertMatchAnalysis(
  matchId: number,
  accountId: number,
  analysis: DotaPlayerMatchAnalysis,
): Promise<void> {
  const supabaseAdmin = getAdminClient()

  const { error: analysisError } = await supabaseAdmin
    .from('dota_player_match_analysis')
    .upsert(
      {
        match_id: analysis.matchId,
        account_id: analysis.accountId,
        role_position: analysis.rolePosition,
        kills_early: analysis.killDistribution.early,
        kills_mid: analysis.killDistribution.mid,
        kills_late: analysis.killDistribution.late,
        kill_pct_early: analysis.killPercentageDistribution.early,
        kill_pct_mid: analysis.killPercentageDistribution.mid,
        kill_pct_late: analysis.killPercentageDistribution.late,
        deaths_early: analysis.deathDistribution.early,
        deaths_mid: analysis.deathDistribution.mid,
        deaths_late: analysis.deathDistribution.late,
        death_pct_early: analysis.deathPercentageDistribution.early,
        death_pct_mid: analysis.deathPercentageDistribution.mid,
        death_pct_late: analysis.deathPercentageDistribution.late,
        total_gold_lost: analysis.deathCostSummary.totalGoldLost,
        total_xp_lost: analysis.deathCostSummary.totalXpLost,
        total_cs_lost: analysis.deathCostSummary.totalCsLost,
        death_pct_pos1: analysis.deathByRole.pos1,
        death_pct_pos2: analysis.deathByRole.pos2,
        death_pct_pos3: analysis.deathByRole.pos3,
        death_pct_pos4: analysis.deathByRole.pos4,
        death_pct_pos5: analysis.deathByRole.pos5,
        analysis_extra: analysis.analysisExtra ?? {},
      },
      {
        onConflict: 'match_id,account_id',
      },
    )

  if (analysisError) {
    console.error('dota_player_match_analysis upsert error:', analysisError)
    throw new Error(`Failed to upsert match analysis: ${analysisError.message}`)
  }
}

/**
 * Load analysis from Supabase
 */
async function loadAnalysisFromSupabase(
  matchId: number,
  accountId: number,
): Promise<DotaPlayerMatchAnalysis | null> {
  const supabaseAdmin = getAdminClient()

  // Load summary
  const { data: analysisData, error: analysisError } = await supabaseAdmin
    .from('dota_player_match_analysis')
    .select('*')
    .eq('match_id', matchId)
    .eq('account_id', accountId)
    .single()

  if (analysisError || !analysisData) {
    if (analysisError) {
      console.error('dota_player_match_analysis load error:', analysisError)
    }
    return null
  }

  // Load death events
  const { data: eventsData, error: eventsError } = await supabaseAdmin
    .from('dota_player_death_events')
    .select('*')
    .eq('match_id', matchId)
    .eq('account_id', accountId)
    .order('time_seconds', { ascending: true })

  if (eventsError) {
    console.error('dota_player_death_events load error:', eventsError)
    // Non-fatal: continue without events
  }

  const deathEvents: DotaPlayerDeathEvent[] =
    eventsData?.map((e) => ({
      matchId: e.match_id,
      accountId: e.account_id,
      timeSeconds: e.time_seconds,
      phase: e.phase as GamePhase,
      levelAtDeath: e.level_at_death,
      downtimeSeconds: e.downtime_seconds,
      goldLost: e.gold_lost,
      xpLost: e.xp_lost,
      csLost: e.cs_lost,
      killerHeroId: e.killer_hero_id ?? undefined,
      killerRolePosition: (e.killer_role_position as RolePosition) ?? undefined,
      posX: e.pos_x ?? undefined,
      posY: e.pos_y ?? undefined,
    })) ?? []

  return {
    matchId: analysisData.match_id,
    accountId: analysisData.account_id,
    rolePosition: analysisData.role_position as RolePosition,
    killDistribution: {
      early: analysisData.kills_early,
      mid: analysisData.kills_mid,
      late: analysisData.kills_late,
    },
    killPercentageDistribution: {
      early: Number(analysisData.kill_pct_early),
      mid: Number(analysisData.kill_pct_mid),
      late: Number(analysisData.kill_pct_late),
    },
    deathDistribution: {
      early: analysisData.deaths_early,
      mid: analysisData.deaths_mid,
      late: analysisData.deaths_late,
    },
    deathPercentageDistribution: {
      early: Number(analysisData.death_pct_early),
      mid: Number(analysisData.death_pct_mid),
      late: Number(analysisData.death_pct_late),
    },
    deathCostSummary: {
      totalGoldLost: analysisData.total_gold_lost,
      totalXpLost: analysisData.total_xp_lost,
      totalCsLost: analysisData.total_cs_lost,
    },
    deathByRole: {
      pos1: Number(analysisData.death_pct_pos1),
      pos2: Number(analysisData.death_pct_pos2),
      pos3: Number(analysisData.death_pct_pos3),
      pos4: Number(analysisData.death_pct_pos4),
      pos5: Number(analysisData.death_pct_pos5),
    },
    deathEvents,
    analysisExtra:
      (analysisData.analysis_extra as Record<string, unknown>) ?? {},
  }
}

/**
 * GET handler
 */
export async function GET(
  req: Request,
  { params }: { params: { matchId: string; accountId: string } },
) {
  try {
    const matchId = Number(params.matchId)
    const accountId = Number(params.accountId)

    if (!matchId || !accountId || isNaN(matchId) || isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Invalid matchId or accountId' },
        { status: 400 },
      )
    }

    // Try to load from Supabase first
    let analysis = await loadAnalysisFromSupabase(matchId, accountId)

    // If not found, calculate from OpenDota and store
    if (!analysis) {
      // Calculate analysis and get raw match data for matches_digest update
      const matchData = await fetchFromOpenDota<{
        match_id: number
        duration: number
        start_time: number
        radiant_win: boolean
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
          level?: number
          lane?: number
          role?: number | string
        }>
      }>(`/matches/${matchId}`)

      const player = matchData.players.find((p) => p.account_id === accountId)
      if (!player) {
        return NextResponse.json(
          { error: `Player ${accountId} not found in match ${matchId}` },
          { status: 404 },
        )
      }

      analysis = await calculateAnalysisFromOpenDota(matchId, accountId)

      // Store in Supabase using admin client (synchronous, blocking)
      // This ensures data is saved before returning response
      // IMPORTANT: We handle errors separately for death events vs analysis
      // Death events errors are critical and should be reported
      try {
        // First store death events (critical: must not fail silently)
        const deathEventsCount = analysis.deathEvents?.length ?? 0
        console.log(
          `[DOTA2] Storing ${deathEventsCount} death events for match ${matchId}, player ${accountId}`,
        )

        if (deathEventsCount > 0) {
          await upsertDeathEvents(matchId, accountId, analysis.deathEvents!)
          console.log(
            `[DOTA2] Successfully stored ${deathEventsCount} death events`,
          )
        } else {
          console.log(
            `[DOTA2] No death events to store (player had ${player.deaths} deaths, but deaths_log may be empty)`,
          )
          // Still call upsertDeathEvents to clean up old events
          await upsertDeathEvents(matchId, accountId, [])
        }
      } catch (deathEventsError: any) {
        console.error(
          '[DOTA2] CRITICAL: Failed to store death events. This error will be returned to client.',
          deathEventsError,
        )
        // Death events are critical - return error to client
        return NextResponse.json(
          {
            error: 'Failed to store death events in database',
            details: deathEventsError.message,
            matchId,
            accountId,
          },
          { status: 500 },
        )
      }

      // Store match analysis (less critical, can fail gracefully)
      try {
        await upsertMatchAnalysis(matchId, accountId, analysis)
        console.log(
          `[DOTA2] Successfully stored match analysis for match ${matchId}, player ${accountId}`,
        )
      } catch (analysisError: any) {
        console.error(
          '[DOTA2] Error storing match analysis (non-fatal):',
          analysisError,
        )
        // Continue even if analysis storage fails
      }

      // Update matches_digest (least critical, can fail gracefully)
      try {
        await upsertMatchesDigest(
          matchId,
          accountId,
          matchData,
          player,
          analysis.rolePosition,
        )
      } catch (digestError: any) {
        console.error(
          '[DOTA2] Error updating matches_digest (non-fatal):',
          digestError,
        )
        // Continue even if matches_digest update fails
      }
    }

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error(
      'Error in GET /api/dota/matches/[matchId]/players/[accountId]/analysis:',
      error,
    )
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analysis' },
      { status: 500 },
    )
  }
}

/**
 * TODO: Future optimizations
 *
 * 1. Caching: Add Redis or in-memory cache for frequently accessed analyses
 * 2. Batch processing: Process multiple matches in background jobs
 * 3. Incremental updates: Update analysis when new data is available
 * 4. Heatmap data: Store position data if available from OpenDota
 * 5. Killer detection: Improve killer role detection using match timeline data
 * 6. Level estimation: Use actual level progression from match data if available
 */
