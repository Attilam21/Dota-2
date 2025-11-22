/**
 * Get Advanced Analysis (Kill Distribution, Role Position)
 *
 * Extracted from API route for reuse in server-side code
 */

import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'
import { fetchFromOpenDota } from '@/utils/opendota'
import { getGamePhase } from '@/types/dotaAnalysis'
import type { RolePosition } from '@/types/dotaAnalysis'

/**
 * Calculate advanced analysis from OpenDota match data
 * This is the same logic as in the API route, extracted for reuse
 */
export async function getAdvancedAnalysis(
  matchId: number,
  accountId: number,
): Promise<DotaPlayerMatchAnalysis | null> {
  try {
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
        kills_log?: Array<{ time: number; key?: string }>
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
      console.warn(
        `[MATCH-ANALYSIS] Player ${accountId} not found in match ${matchId}`,
      )
      return null
    }

    // Determine role position
    let rolePosition: RolePosition = 1
    if (player.role !== undefined && typeof player.role === 'number') {
      const roleMap: Record<number, RolePosition> = {
        0: 1, // Safe → Pos1
        1: 2, // Mid → Pos2
        2: 3, // Off → Pos3
        4: 4, // Roaming → Pos4
      }
      rolePosition = roleMap[player.role] ?? 1
    }

    // Process kills by phase
    const killsLog = player.kills_log ?? []
    const killsByPhase = { early: 0, mid: 0, late: 0 }
    killsLog.forEach((kill) => {
      const phase = getGamePhase(kill.time)
      killsByPhase[phase]++
    })

    // Calculate kill percentages
    const totalKills = player.kills
    const killPctEarly =
      totalKills > 0 ? (killsByPhase.early / totalKills) * 100 : 0
    const killPctMid =
      totalKills > 0 ? (killsByPhase.mid / totalKills) * 100 : 0
    const killPctLate =
      totalKills > 0 ? (killsByPhase.late / totalKills) * 100 : 0

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
  } catch (error) {
    console.warn(
      '[MATCH-ANALYSIS] Advanced analysis calculation failed:',
      error,
    )
    return null
  }
}
