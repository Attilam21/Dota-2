/**
 * Single Match Fights & Damage Analysis
 * Uses: matches_digest (single match), dota_player_match_analysis (single match)
 *
 * NOTE: This is for SINGLE MATCH analysis, NOT aggregated profile analysis.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { FightsDamageAnalysis } from './types'

export async function getMatchFightsAnalysis(
  matchId: number,
  playerId: number,
): Promise<FightsDamageAnalysis | null> {
  const supabase = createServerClient(cookies())

  // Sanity check: MATCH MODE
  console.log(
    `[MATCH-FIGHTS-ANALYSIS] MATCH MODE - Analisi solo per match ${matchId}`,
  )

  try {
    // Get SINGLE match analysis data (filtered by matchId)
    const { data: matchAnalysis, error: analysisError } = await supabase
      .from('dota_player_match_analysis')
      .select(
        'match_id, kills_early, kills_mid, kills_late, deaths_early, deaths_mid, deaths_late',
      )
      .eq('account_id', playerId)
      .eq('match_id', matchId)
      .single()

    if (analysisError || !matchAnalysis) {
      console.error(
        '[MATCH-FIGHTS-ANALYSIS] Error fetching match analysis:',
        analysisError,
      )
      return null
    }

    // Get SINGLE match data for kills/deaths/assists
    const { data: match, error: matchError } = await supabase
      .from('matches_digest')
      .select('match_id, kills, deaths, assists, duration_seconds')
      .eq('player_account_id', playerId)
      .eq('match_id', matchId)
      .single()

    // Calculate Kill Participation for THIS match
    let killParticipation = 0
    if (!matchError && match) {
      const playerKills = match.kills ?? 0
      const playerAssists = match.assists ?? 0
      const totalPlayerKillsAndAssists = playerKills + playerAssists

      // Estimate team kills: conservative estimate for single match
      // In Dota, average team kills per match is ~25-35
      // We use: estimated team kills = max(25, (player K+A) * 2.5)
      const estimatedTeamKills = Math.max(25, totalPlayerKillsAndAssists * 2.5)

      killParticipation =
        estimatedTeamKills > 0
          ? (totalPlayerKillsAndAssists / estimatedTeamKills) * 100
          : 0
    } else {
      // Fallback: use match analysis kills only
      const totalKills =
        (matchAnalysis.kills_early ?? 0) +
        (matchAnalysis.kills_mid ?? 0) +
        (matchAnalysis.kills_late ?? 0)
      const estimatedTeamKills = 30 // Average
      killParticipation =
        estimatedTeamKills > 0 ? (totalKills / estimatedTeamKills) * 100 : 0
    }

    // Damage Share: not available in Tier-1
    const damageShare = 0

    // Tower Damage: not available in Tier-1
    const avgTowerDamage = 0

    // Teamfight Participation: 1 if has any kill/death activity, 0 otherwise
    const hasFightActivity =
      (matchAnalysis.kills_early ?? 0) +
        (matchAnalysis.kills_mid ?? 0) +
        (matchAnalysis.kills_late ?? 0) +
        (matchAnalysis.deaths_early ?? 0) +
        (matchAnalysis.deaths_mid ?? 0) +
        (matchAnalysis.deaths_late ?? 0) >
      0
    const avgTeamfightsParticipated = hasFightActivity ? 1 : 0

    // Damage vs KP: single match point
    const playerKills =
      (matchAnalysis.kills_early ?? 0) +
      (matchAnalysis.kills_mid ?? 0) +
      (matchAnalysis.kills_late ?? 0)
    const estimatedTeamKillsPerMatch = 30
    const kp =
      estimatedTeamKillsPerMatch > 0
        ? playerKills / estimatedTeamKillsPerMatch
        : 0

    const damageVsKp = [
      {
        matchId: matchAnalysis.match_id,
        damage: playerKills * 1000, // Approximation: 1 kill ≈ 1000 damage
        kp: kp * 100, // Convert to percentage
      },
    ]

    // Teamfight impact by phase: single match values (not averages)
    const teamfightImpact = [
      {
        phase: 'Early',
        participation: matchAnalysis.kills_early ?? 0,
        impact: matchAnalysis.deaths_early ?? 0,
      },
      {
        phase: 'Mid',
        participation: matchAnalysis.kills_mid ?? 0,
        impact: matchAnalysis.deaths_mid ?? 0,
      },
      {
        phase: 'Late',
        participation: matchAnalysis.kills_late ?? 0,
        impact: matchAnalysis.deaths_late ?? 0,
      },
    ]

    // Damage profile: not available in Tier-1
    const damageProfile = {
      damageDone: 0,
      damageTaken: 0,
    }

    return {
      killParticipation: Math.min(100, Math.round(killParticipation * 10) / 10),
      damageShare,
      avgTowerDamage,
      avgTeamfightsParticipated:
        Math.round(avgTeamfightsParticipated * 10) / 10,
      damageVsKp,
      teamfightImpact,
      damageProfile,
    }
  } catch (error) {
    console.error('[MATCH-FIGHTS-ANALYSIS] Error:', error)
    return null
  }
}
