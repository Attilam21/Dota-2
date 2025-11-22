/**
 * Compute Focus Areas (TIER 1 ONLY)
 *
 * Identifies priority areas for improvement
 */

import type { FocusArea } from './types'
import type { ProfilePillar } from './types'
import type { TasksSummary } from './types'

/**
 * Compute focus areas from pillars and tasks
 */
export function computeFocusAreas(
  pillars: ProfilePillar[],
  tasks: TasksSummary,
): FocusArea[] {
  const focusAreas: FocusArea[] = []

  // Sort pillars by score (lowest first)
  const sortedPillars = [...pillars].sort((a, b) => a.score - b.score)

  // Identify top 3 areas needing improvement
  for (let i = 0; i < Math.min(3, sortedPillars.length); i++) {
    const pillar = sortedPillars[i]

    // Skip if score is already high
    if (pillar.score >= 70) {
      continue
    }

    // Determine severity
    let severity: 'high' | 'medium' | 'low' = 'medium'
    if (pillar.score < 40) {
      severity = 'high'
    } else if (pillar.score < 60) {
      severity = 'medium'
    } else {
      severity = 'low'
    }

    // Check task completion for this pillar
    const pillarTasks = tasks.byPillar.find((p) => p.pillarId === pillar.id)
    const hasLowTaskCompletion =
      pillarTasks &&
      pillarTasks.total > 0 &&
      pillarTasks.completed / pillarTasks.total < 0.5

    // Generate rationale
    let rationale = pillar.insight
    if (hasLowTaskCompletion) {
      rationale += ` Inoltre, hai completato solo ${pillarTasks.completed}/${pillarTasks.total} task per questo pilastro.`
    }

    focusAreas.push({
      pillarId: pillar.id,
      title: pillar.label,
      severity,
      rationale,
      suggestedActionLabel: `Vai ai task ${pillar.label}`,
      suggestedActionHref: `/dashboard/coaching?pillar=${pillar.id}`,
    })
  }

  // If no critical areas, suggest consolidating strengths
  if (focusAreas.length === 0) {
    const bestPillar = pillars.reduce((best, current) =>
      current.score > best.score ? current : best,
    )

    focusAreas.push({
      pillarId: bestPillar.id,
      title: 'Consolidare i punti di forza',
      severity: 'low',
      rationale: `Il tuo pilastro più forte è ${bestPillar.label} (${bestPillar.score}/100). Continua a lavorare per mantenere questo livello e migliorare gli altri pilastri.`,
      suggestedActionLabel: 'Vai ai task',
      suggestedActionHref: '/dashboard/coaching',
    })
  }

  return focusAreas.slice(0, 3) // Max 3 focus areas
}
