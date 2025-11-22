/**
 * Get Improvement Pillars from Profiling
 *
 * Extracts critical pillars that need improvement from the player profile
 */

import type { ProfilePillar } from '@/lib/dota/profile/types'
import type { FzthCoachingPillar } from '../coaching/types'

export interface ImprovementPillar {
  pillarId: FzthCoachingPillar
  score: number // 0-100
  severity: 'high' | 'medium' | 'low'
  rationale: string
}

/**
 * Get improvement pillars from profile pillars
 * Returns only pillars that need improvement (score < 70)
 */
export function getImprovementPillars(
  profilePillars: ProfilePillar[],
): ImprovementPillar[] {
  const improvementPillars: ImprovementPillar[] = []

  // Map ProfilePillar to FzthCoachingPillar
  const pillarMap: Record<string, FzthCoachingPillar> = {
    laning: 'laning',
    macro: 'macro',
    teamfight: 'teamfight',
    consistency: 'consistency',
    hero_pool: 'hero_pool',
  }

  // Filter and map pillars that need improvement
  profilePillars.forEach((pillar) => {
    const fzthPillar = pillarMap[pillar.id]
    if (!fzthPillar) return

    // Only include pillars with score < 70
    if (pillar.score >= 70) return

    // Determine severity
    let severity: 'high' | 'medium' | 'low' = 'medium'
    if (pillar.score < 40) {
      severity = 'high'
    } else if (pillar.score < 60) {
      severity = 'medium'
    } else {
      severity = 'low'
    }

    improvementPillars.push({
      pillarId: fzthPillar,
      score: pillar.score,
      severity,
      rationale: pillar.insight,
    })
  })

  // Sort by severity (high first) then by score (lowest first)
  improvementPillars.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 }
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff
    return a.score - b.score
  })

  return improvementPillars
}
