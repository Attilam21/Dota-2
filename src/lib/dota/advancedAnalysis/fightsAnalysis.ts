/**
 * Fights & Damage Analysis
 * Uses: matches_digest (for kills/deaths/assists), dota_player_match_analysis (for phase distribution)
 *
 * NOTE: Damage Share and Tower Damage require dota_damage_log table which doesn't exist.
 * We return 0 for these metrics with appropriate handling in UI.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { FightsDamageAnalysis } from './types'

export async function getFightsDamageAnalysis(
  playerId: number,
): Promise<FightsDamageAnalysis | null> {
  const supabase = createServerClient(cookies())

  try {
    // Get match analysis data (limit to 20 for DEMO mode)
    const { data: matchAnalysis, error: analysisError } = await supabase
      .from('dota_player_match_analysis')
      .select(
        'match_id, kills_early, kills_mid, kills_late, deaths_early, deaths_mid, deaths_late',
      )
      .eq('account_id', playerId)
      .order('created_at', { ascending: false })
      .limit(20) // DEMO mode: 20 matches

    if (analysisError) {
      console.error(
        '[FIGHTS-ANALYSIS] Error fetching match analysis:',
        analysisError,
      )
      return null
    }

    if (!matchAnalysis || matchAnalysis.length === 0) {
      return null
    }

    // Get matches_digest for total kills/deaths/assists (for KP calculation)
    const matchIds = matchAnalysis.map((m) => m.match_id)
    const { data: matches, error: matchesError } = await supabase
      .from('matches_digest')
      .select('match_id, kills, deaths, assists, duration_seconds')
      .eq('player_account_id', playerId)
      .in('match_id', matchIds)

    if (matchesError) {
      console.error('[FIGHTS-ANALYSIS] Error fetching matches:', matchesError)
    }

    // Calculate Kill Participation: (player kills + assists) / (team total kills)
    // Approximation: team total kills ≈ (player kills + assists) * 5 (rough estimate)
    // Better: use actual team kills if available, otherwise estimate
    let killParticipation = 0
    if (matches && matches.length > 0) {
      const totalPlayerKills = matches.reduce(
        (sum, m) => sum + (m.kills ?? 0),
        0,
      )
      const totalPlayerAssists = matches.reduce(
        (sum, m) => sum + (m.assists ?? 0),
        0,
      )
      const totalPlayerKillsAndAssists = totalPlayerKills + totalPlayerAssists

      // Estimate team kills: in Dota, average team kills per match is ~25-35
      // We use a conservative estimate: if player has high K+A, team likely has more kills
      // Formula: estimated team kills = max(25, (player K+A) * 2.5)
      const estimatedTeamKills =
        matches.length *
        Math.max(25, (totalPlayerKillsAndAssists / matches.length) * 2.5)

      killParticipation =
        estimatedTeamKills > 0
          ? (totalPlayerKillsAndAssists / estimatedTeamKills) * 100
          : 0
    } else {
      // Fallback: use match analysis kills only
      const totalKills = matchAnalysis.reduce(
        (sum, m) =>
          sum + (m.kills_early ?? 0) + (m.kills_mid ?? 0) + (m.kills_late ?? 0),
        0,
      )
      const estimatedTeamKills = matchAnalysis.length * 30 // Average 30 kills per team per match
      killParticipation =
        estimatedTeamKills > 0 ? (totalKills / estimatedTeamKills) * 100 : 0
    }

    // Damage Share: not available in Tier-1 OpenDota data (requires dota_damage_log)
    const damageShare = 0

    // Tower Damage: not available in Tier-1 OpenDota data
    const avgTowerDamage = 0

    // Teamfight Participation: count matches with any kill/death activity
    const matchesWithFights = matchAnalysis.filter(
      (m) =>
        (m.kills_early ?? 0) +
          (m.kills_mid ?? 0) +
          (m.kills_late ?? 0) +
          (m.deaths_early ?? 0) +
          (m.deaths_mid ?? 0) +
          (m.deaths_late ?? 0) >
        0,
    ).length
    const avgTeamfightsParticipated =
      matchAnalysis.length > 0 ? matchesWithFights / matchAnalysis.length : 0

    // Damage vs KP per match (using kills as proxy for damage contribution)
    const damageVsKp = matchAnalysis
      .map((m) => {
        const playerKills =
          (m.kills_early ?? 0) + (m.kills_mid ?? 0) + (m.kills_late ?? 0)
        // Estimate KP: kills / estimated team kills per match
        const estimatedTeamKillsPerMatch = 30
        const kp =
          estimatedTeamKillsPerMatch > 0
            ? playerKills / estimatedTeamKillsPerMatch
            : 0

        return {
          matchId: m.match_id,
          damage: playerKills * 1000, // Approximation: 1 kill ≈ 1000 damage
          kp: kp * 100, // Convert to percentage
        }
      })
      .filter((d) => d.damage > 0 || d.kp > 0) // Only matches with activity

    // Teamfight impact by phase (normalized per match)
    const teamfightImpact = [
      {
        phase: 'Early',
        participation:
          matchAnalysis.length > 0
            ? matchAnalysis.reduce((sum, m) => sum + (m.kills_early ?? 0), 0) /
              matchAnalysis.length
            : 0,
        impact:
          matchAnalysis.length > 0
            ? matchAnalysis.reduce((sum, m) => sum + (m.deaths_early ?? 0), 0) /
              matchAnalysis.length
            : 0,
      },
      {
        phase: 'Mid',
        participation:
          matchAnalysis.length > 0
            ? matchAnalysis.reduce((sum, m) => sum + (m.kills_mid ?? 0), 0) /
              matchAnalysis.length
            : 0,
        impact:
          matchAnalysis.length > 0
            ? matchAnalysis.reduce((sum, m) => sum + (m.deaths_mid ?? 0), 0) /
              matchAnalysis.length
            : 0,
      },
      {
        phase: 'Late',
        participation:
          matchAnalysis.length > 0
            ? matchAnalysis.reduce((sum, m) => sum + (m.kills_late ?? 0), 0) /
              matchAnalysis.length
            : 0,
        impact:
          matchAnalysis.length > 0
            ? matchAnalysis.reduce((sum, m) => sum + (m.deaths_late ?? 0), 0) /
              matchAnalysis.length
            : 0,
      },
    ]

    // Damage profile: not available in Tier-1 OpenDota data
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
      damageVsKp: damageVsKp.slice(0, 20),
      teamfightImpact,
      damageProfile,
    }
  } catch (error) {
    console.error('[FIGHTS-ANALYSIS] Error:', error)
    return null
  }
}
