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
      kills_log?: Array<{ time: number }>
      deaths_log?: Array<{ time: number; by?: { hero_id?: number } }>
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
  const killsLog = player.kills_log ?? []
  const killsByPhase = { early: 0, mid: 0, late: 0 }
  killsLog.forEach((kill) => {
    const phase = getGamePhase(kill.time)
    killsByPhase[phase]++
  })

  // Process deaths by phase and calculate death events
  const deathsLog = player.deaths_log ?? []
  const deathsByPhase = { early: 0, mid: 0, late: 0 }
  const deathEvents: DotaPlayerDeathEvent[] = []
  const deathsByRole: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  // Get player's final level for better level estimation
  // OpenDota provides player.level (final level at end of match)
  // We use this as a reference point for level estimation
  const finalLevel = player.level ?? null
  const finalLevelTime = matchData.duration

  // We need to get killer info from match data
  // For now, we'll use a simplified approach
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

    deathEvents.push({
      matchId,
      accountId,
      timeSeconds: death.time,
      phase,
      levelAtDeath,
      downtimeSeconds,
      goldLost,
      xpLost,
      csLost,
      killerHeroId,
      killerRolePosition,
    })
  })

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
 */
async function upsertDeathEvents(
  matchId: number,
  accountId: number,
  events: DotaPlayerDeathEvent[],
): Promise<void> {
  const supabaseAdmin = getAdminClient()

  if (events.length === 0) {
    // No events to store, but ensure old ones are deleted
    const { error: deleteError } = await supabaseAdmin
      .from('dota_player_death_events')
      .delete()
      .eq('match_id', matchId)
      .eq('account_id', accountId)

    if (deleteError) {
      console.error('dota_player_death_events delete error:', deleteError)
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
    console.error('dota_player_death_events delete error:', deleteError)
    throw new Error(
      `Failed to delete existing death events: ${deleteError.message}`,
    )
  }

  // Insert new events
  const eventsToInsert = events.map((event) => ({
    match_id: event.matchId,
    account_id: event.accountId,
    time_seconds: event.timeSeconds,
    phase: event.phase,
    level_at_death: event.levelAtDeath,
    downtime_seconds: event.downtimeSeconds,
    gold_lost: event.goldLost,
    xp_lost: event.xpLost,
    cs_lost: event.csLost,
    killer_hero_id: event.killerHeroId ?? null,
    killer_role_position: event.killerRolePosition ?? null,
    pos_x: event.posX ?? null,
    pos_y: event.posY ?? null,
  }))

  const { error: insertError } = await supabaseAdmin
    .from('dota_player_death_events')
    .insert(eventsToInsert)

  if (insertError) {
    console.error('dota_player_death_events insert error:', insertError)
    throw new Error(`Failed to insert death events: ${insertError.message}`)
  }
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
      try {
        // First store death events, then match analysis, then matches_digest
        await upsertDeathEvents(matchId, accountId, analysis.deathEvents ?? [])
        await upsertMatchAnalysis(matchId, accountId, analysis)
        // Also update matches_digest with extended data
        await upsertMatchesDigest(
          matchId,
          accountId,
          matchData,
          player,
          analysis.rolePosition,
        )
      } catch (storeError: any) {
        console.error(
          'Error storing analysis in Supabase (non-fatal, returning analysis anyway):',
          storeError,
        )
        // Continue and return analysis even if storage fails
        // This ensures the API still returns data even if DB write fails
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
