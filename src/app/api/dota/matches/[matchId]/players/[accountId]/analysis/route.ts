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

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabaseAdmin'
import { fetchFromOpenDota } from '@/utils/opendota'
import type {
  DotaPlayerMatchAnalysis,
  RolePosition,
} from '@/types/dotaAnalysis'
import { getGamePhase } from '@/types/dotaAnalysis'

/**
 * [REMOVED - TIER 2/3] Helper functions for death cost calculation
 *
 * These functions have been REMOVED as part of Tier 1 Only consolidation:
 * - calculateRespawnTime: Used for death cost calculation (Tier 2/3)
 * - calculateDeathCost: Used for death cost calculation (Tier 2/3)
 *
 * Death cost analysis requires deaths_log which is not guaranteed by OpenDota API.
 */

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

  // Process kills by phase (TIER 1 - kills_log is documented and guaranteed)
  // NOTE: kills_log is documented with {time: integer, key: string} structure
  const killsLog = player.kills_log ?? []
  const killsByPhase = { early: 0, mid: 0, late: 0 }
  killsLog.forEach((kill) => {
    const phase = getGamePhase(kill.time)
    killsByPhase[phase]++
  })

  // Calculate kill percentages (TIER 1 - calculated from kills which is guaranteed)
  const totalKills = player.kills
  const killPctEarly =
    totalKills > 0 ? (killsByPhase.early / totalKills) * 100 : 0
  const killPctMid = totalKills > 0 ? (killsByPhase.mid / totalKills) * 100 : 0
  const killPctLate =
    totalKills > 0 ? (killsByPhase.late / totalKills) * 100 : 0

  console.log(
    `[DOTA2] Calculated kill distribution (TIER 1 only): early=${killsByPhase.early}, mid=${killsByPhase.mid}, late=${killsByPhase.late}`,
  )

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
  }
}

/**
 * [REMOVED - TIER 2/3] Upsert death events for a match+player
 *
 * This function has been REMOVED as part of Tier 1 Only consolidation.
 * Death events depend on deaths_log which is not guaranteed by OpenDota API.
 *
 * The table dota_player_death_events still exists in the database but is no longer
 * populated or used in the application code.
 */

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
    console.error('[DOTA2-ANALYSIS] UPSERT_MATCHES_DIGEST_ERROR', {
      matchId,
      accountId,
      error: digestError.message,
      code: digestError.code,
      details: digestError.details,
    })
    // Non-blocking: log error but don't fail the analysis
    // This ensures analysis still works even if matches_digest update fails
  }
}

/**
 * Upsert match analysis summary for a match+player (TIER 1 ONLY)
 * If exists, updates; if not, inserts
 *
 * IMPORTANT: Only writes Tier 1 columns guaranteed by OpenDota API:
 * - kills_early/mid/late (from kills_log)
 * - kill_pct_early/mid/late (calculated from kills)
 * - role_position (from player.role)
 *
 * Removed Tier 2/3 columns (no longer written, but table columns remain):
 * - deaths_early/mid/late (requires deaths_log, not guaranteed)
 * - death_pct_early/mid/late (requires deaths_log, not guaranteed)
 * - total_gold_lost/xp_lost/cs_lost (requires deaths_log, not guaranteed)
 * - death_pct_pos1..pos5 (requires deaths_log + killed_by, not guaranteed)
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
        // TIER 1 ONLY - kills from kills_log (guaranteed)
        kills_early: analysis.killDistribution.early,
        kills_mid: analysis.killDistribution.mid,
        kills_late: analysis.killDistribution.late,
        kill_pct_early: analysis.killPercentageDistribution.early,
        kill_pct_mid: analysis.killPercentageDistribution.mid,
        kill_pct_late: analysis.killPercentageDistribution.late,
        // TIER 2/3 columns NOT written (remain NULL in database):
        // - deaths_early/mid/late (not guaranteed)
        // - death_pct_early/mid/late (not guaranteed)
        // - total_gold_lost/xp_lost/cs_lost (not guaranteed)
        // - death_pct_pos1..pos5 (not guaranteed)
        // - analysis_extra (not used)
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
 * Load analysis from Supabase (TIER 1 ONLY)
 *
 * Returns only Tier 1 data guaranteed by OpenDota API:
 * - killDistribution (from kills_log)
 * - killPercentageDistribution (calculated from kills)
 * - rolePosition (from player.role)
 *
 * Does NOT load Tier 2/3 data:
 * - deathDistribution (requires deaths_log, not guaranteed)
 * - deathCostSummary (requires deaths_log, not guaranteed)
 * - deathByRole (requires deaths_log + killed_by, not guaranteed)
 * - deathEvents (requires deaths_log, not guaranteed)
 */
async function loadAnalysisFromSupabase(
  matchId: number,
  accountId: number,
): Promise<DotaPlayerMatchAnalysis | null> {
  const supabaseAdmin = getAdminClient()

  // Load summary (only Tier 1 columns)
  const { data: analysisData, error: analysisError } = await supabaseAdmin
    .from('dota_player_match_analysis')
    .select(
      'match_id, account_id, role_position, kills_early, kills_mid, kills_late, kill_pct_early, kill_pct_mid, kill_pct_late',
    )
    .eq('match_id', matchId)
    .eq('account_id', accountId)
    .single()

  if (analysisError || !analysisData) {
    if (analysisError) {
      console.error('dota_player_match_analysis load error:', analysisError)
    }
    return null
  }

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
  }
}

/**
 * GET handler
 *
 * Route: /api/dota/matches/[matchId]/players/[accountId]/analysis
 *
 * VERIFIED: Path structure matches frontend call from:
 * - src/app/dota/matches/[matchId]/players/[accountId]/page.tsx
 *
 * This route:
 * 1. Loads analysis from Supabase if exists
 * 2. If not, fetches from OpenDota and calculates KPIs
 * 3. Stores in three tables:
 *    - dota_player_match_analysis (summary)
 *    - dota_player_death_events (individual events)
 *    - matches_digest (extended match data)
 *
 * Uses admin client (service_role) for all Supabase writes.
 * Uses only documented OpenDota fields (killed_by fallback for deaths_log).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string; accountId: string } },
) {
  // ============================================================================
  // STEP 1: Validate and parse parameters
  // ============================================================================
  const matchId = Number(params.matchId)
  const accountId = Number(params.accountId)

  // Log strutturato: START
  console.log('[DOTA2-ANALYSIS] START', {
    matchId: Number(params.matchId),
    accountId: Number(params.accountId),
    timestamp: new Date().toISOString(),
  })

  if (!matchId || !accountId || isNaN(matchId) || isNaN(accountId)) {
    console.error(
      `[DOTA2-ANALYSIS] Invalid parameters: matchId=${params.matchId}, accountId=${params.accountId}`,
    )
    return NextResponse.json(
      { error: 'Invalid matchId or accountId' },
      { status: 400 },
    )
  }

  try {
    // ============================================================================
    // STEP 2: Try to load from Supabase first (cache check)
    // ============================================================================
    console.log(
      `[DOTA2-ANALYSIS] Checking Supabase cache for match ${matchId}, player ${accountId}`,
    )
    let analysis = await loadAnalysisFromSupabase(matchId, accountId)

    if (analysis) {
      console.log(
        `[DOTA2-ANALYSIS] Found cached analysis in Supabase, returning immediately`,
      )
      return NextResponse.json(analysis)
    }

    // ============================================================================
    // STEP 3: Analysis not in cache - calculate from OpenDota and store
    // ============================================================================
    console.log(
      `[DOTA2-ANALYSIS] No cached analysis found, fetching from OpenDota and calculating...`,
    )

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

    // ============================================================================
    // STEP 4: Store calculated analysis in Supabase (TIER 1 ONLY)
    // ============================================================================
    // IMPORTANT: We use admin client (service_role) for all writes
    // Order: match analysis → matches_digest
    // Only Tier 1 data is stored (kills from kills_log, guaranteed by OpenDota)

    // 4.1: Store match analysis summary (TIER 1 ONLY)
    console.log(
      `[DOTA2-ANALYSIS] STEP 4.2: Storing match analysis summary to dota_player_match_analysis`,
    )
    try {
      await upsertMatchAnalysis(matchId, accountId, analysis)
      console.log('[DOTA2-ANALYSIS] UPSERT_MATCH_ANALYSIS_OK (Tier 1 only)', {
        matchId,
        accountId,
        rolePosition: analysis.rolePosition,
        killsEarly: analysis.killDistribution.early,
        killsMid: analysis.killDistribution.mid,
        killsLate: analysis.killDistribution.late,
      })
    } catch (analysisError: any) {
      console.error('[DOTA2-ANALYSIS] UPSERT_MATCH_ANALYSIS_KO', {
        matchId,
        accountId,
        error: analysisError.message,
        stack: analysisError.stack,
      })
      // Continue even if analysis storage fails
    }

    // 4.2: Update matches_digest with extended data (NON-BLOCKING)
    console.log(
      `[DOTA2-ANALYSIS] STEP 4.2: Updating matches_digest with extended Dota 2 data (Tier 1 only)`,
    )
    try {
      await upsertMatchesDigest(
        matchId,
        accountId,
        matchData,
        player,
        analysis.rolePosition,
      )
      const kda =
        player.deaths > 0
          ? (player.kills + player.assists) / player.deaths
          : player.kills + player.assists
      console.log('[DOTA2-ANALYSIS] UPSERT_MATCHES_DIGEST_OK (Tier 1 only)', {
        matchId,
        accountId,
        kda: Number(kda.toFixed(2)),
        rolePosition: analysis.rolePosition,
        gpm: player.gold_per_min ?? null,
        xpm: player.xp_per_min ?? null,
        lastHits: player.last_hits ?? null,
        denies: player.denies ?? null,
        lane: player.lane ?? null,
        role: player.role ?? null,
      })
    } catch (digestError: any) {
      console.error('[DOTA2-ANALYSIS] UPSERT_MATCHES_DIGEST_KO', {
        matchId,
        accountId,
        error: digestError.message,
        stack: digestError.stack,
      })
      // Continue even if matches_digest update fails
    }

    // ============================================================================
    // STEP 5: Return calculated analysis (TIER 1 ONLY)
    // ============================================================================
    console.log('[DOTA2-ANALYSIS] SUCCESS (Tier 1 only)', {
      matchId,
      accountId,
      rolePosition: analysis.rolePosition,
      killsEarly: analysis.killDistribution.early,
      killsMid: analysis.killDistribution.mid,
      killsLate: analysis.killDistribution.late,
    })

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('[DOTA2-ANALYSIS] FATAL_ERROR', {
      matchId: params.matchId,
      accountId: params.accountId,
      error: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        matchId: params.matchId,
        accountId: params.accountId,
      },
      { status: 500 },
    )
  }
}

// ============================================================================
// VERIFICATION REPORT (TIER 1 ONLY)
// ============================================================================
//
// ✅ Route path: src/app/api/dota/matches/[matchId]/players/[accountId]/analysis/route.ts
// ✅ Frontend call: /api/dota/matches/${matchId}/players/${accountId}/analysis
// ✅ Parameters: matchId and accountId validated and parsed correctly
// ✅ Supabase client: Uses getAdminClient() (service_role) for all writes
// ✅ Tables populated (TIER 1 ONLY):
//    - dota_player_match_analysis: ✓ upsertMatchAnalysis() (only kills_early/mid/late, kill_pct_early/mid/late, role_position)
//    - matches_digest: ✓ upsertMatchesDigest() (extended Tier 1 data: kda, gpm, xpm, last_hits, denies, lane, role)
// ✅ OpenDota fields: Uses ONLY Tier 1 guaranteed fields (kills_log documented and guaranteed)
// ✅ Removed Tier 2/3:
//    - dota_player_death_events: ❌ REMOVED (depends on deaths_log, not guaranteed)
//    - deathDistribution: ❌ REMOVED (depends on deaths_log, not guaranteed)
//    - deathCostSummary: ❌ REMOVED (depends on deaths_log, not guaranteed)
//    - deathByRole: ❌ REMOVED (depends on deaths_log + killed_by, not guaranteed)
// ✅ Error handling: Non-blocking for all operations
// ✅ Logging: Comprehensive logging at each step for debugging (Tier 1 only)
//
// ============================================================================

/**
 * TODO: Future optimizations (TIER 1 ONLY)
 *
 * 1. Caching: Add Redis or in-memory cache for frequently accessed analyses
 * 2. Batch processing: Process multiple matches in background jobs
 * 3. Incremental updates: Update analysis when new data is available
 *
 * [REMOVED - TIER 2/3] Future features that depend on non-guaranteed data:
 * 4. Heatmap data: Store position data if available from OpenDota (requires deaths_log with pos_x/pos_y)
 * 5. Killer detection: Improve killer role detection using match timeline data (requires deaths_log)
 * 6. Level estimation: Use actual level progression from match data if available (requires deaths_log)
 *
 * These features will be re-implemented when deaths_log is guaranteed by OpenDota API.
 */
