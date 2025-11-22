/**
 * Fights & Damage Analysis
 * Uses: dota_player_match_analysis, dota_player_death_events
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { FightsDamageAnalysis } from './types'

export async function getFightsDamageAnalysis(
  playerId: number,
): Promise<FightsDamageAnalysis | null> {
  const supabase = createServerClient(cookies())

  try {
    // Get match analysis data
    const { data: matchAnalysis, error: analysisError } = await supabase
      .from('dota_player_match_analysis')
      .select(
        'match_id, kills_early, kills_mid, kills_late, deaths_early, deaths_mid, deaths_late',
      )
      .eq('account_id', playerId)
      .order('created_at', { ascending: false })
      .limit(50)

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

    // Calculate kill participation (simplified: total kills / total team kills)
    // Note: We don't have team total kills, so we approximate
    const totalKills = matchAnalysis.reduce(
      (sum, m) =>
        sum + (m.kills_early ?? 0) + (m.kills_mid ?? 0) + (m.kills_late ?? 0),
      0,
    )
    // Approximation: assume average team kills per match is ~30
    const avgTeamKills = 30
    const killParticipation =
      matchAnalysis.length > 0
        ? (totalKills / (matchAnalysis.length * avgTeamKills)) * 100
        : 0

    // Damage share (placeholder - would need dota_damage_log table)
    const damageShare = 0 // TODO: Calculate from damage_log if available

    // Tower damage (placeholder)
    const avgTowerDamage = 0 // TODO: Calculate from match details

    // Teamfight participation (simplified: count matches with kills/deaths)
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

    // Damage vs KP per match
    const damageVsKp = matchAnalysis.map((m) => ({
      matchId: m.match_id,
      damage: 0, // Placeholder
      kp:
        ((m.kills_early ?? 0) + (m.kills_mid ?? 0) + (m.kills_late ?? 0)) /
        avgTeamKills,
    }))

    // Teamfight impact by phase
    const teamfightImpact = [
      {
        phase: 'Early',
        participation: matchAnalysis.reduce(
          (sum, m) => sum + (m.kills_early ?? 0),
          0,
        ),
        impact: matchAnalysis.reduce(
          (sum, m) => sum + (m.deaths_early ?? 0),
          0,
        ),
      },
      {
        phase: 'Mid',
        participation: matchAnalysis.reduce(
          (sum, m) => sum + (m.kills_mid ?? 0),
          0,
        ),
        impact: matchAnalysis.reduce((sum, m) => sum + (m.deaths_mid ?? 0), 0),
      },
      {
        phase: 'Late',
        participation: matchAnalysis.reduce(
          (sum, m) => sum + (m.kills_late ?? 0),
          0,
        ),
        impact: matchAnalysis.reduce((sum, m) => sum + (m.deaths_late ?? 0), 0),
      },
    ]

    // Damage profile (placeholder)
    const damageProfile = {
      damageDone: 0, // TODO: Calculate from damage_log
      damageTaken: 0, // TODO: Calculate from damage_log
    }

    return {
      killParticipation: Math.min(100, killParticipation),
      damageShare,
      avgTowerDamage,
      avgTeamfightsParticipated,
      damageVsKp: damageVsKp.slice(0, 20),
      teamfightImpact,
      damageProfile,
    }
  } catch (error) {
    console.error('[FIGHTS-ANALYSIS] Error:', error)
    return null
  }
}
