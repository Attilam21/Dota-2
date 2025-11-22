/**
 * Compute Coaching Impact (PLACEHOLDER)
 *
 * TODO: Implement calculation based on fzth_player_profile_snapshots
 * to compare FZTH Score and winrate before/after task completion.
 *
 * This will require:
 * 1. Fetching profile snapshots before task completion date
 * 2. Fetching profile snapshots after task completion date
 * 3. Calculating averages and comparing
 * 4. Generating summary text based on improvements
 */

import type { CoachingImpact } from './types'

/**
 * Compute coaching impact from profile snapshots
 *
 * PLACEHOLDER: Returns placeholder data for now.
 * Future implementation will:
 * - Query fzth_player_profile_snapshots for periods before/after task completions
 * - Calculate average FZTH Score and winrate for each period
 * - Generate insights based on improvements
 */
export async function computeCoachingImpact(
  playerAccountId: number,
  completedTasksCount: number,
): Promise<CoachingImpact> {
  // TODO: Implement actual calculation
  // For now, return placeholder
  return {
    periodLabel: 'Ultimi 30 giorni',
    matchesConsidered: 0,
    tasksCompleted: completedTasksCount,
    avgFzthScoreBefore: null,
    avgFzthScoreAfter: null,
    winrateBefore: null,
    winrateAfter: null,
    summaryText:
      "L'impatto del coaching verrà calcolato non appena saranno disponibili dati sufficienti.",
  }
}
