/**
 * Compute Progress Timeline (TIER 1 ONLY)
 *
 * Calculates FZTH Score progression over time periods
 */

import type { ProgressPoint } from './types'
import type { MatchWithAnalysis } from '@/types/playerPerformance'
import { safeNumber } from './utils'
import { calculateFzthLevel } from './utils'

/**
 * Compute progress timeline from matches grouped by period
 */
export function computeProgressTimeline(
  matches: MatchWithAnalysis[],
  tasksCompletedByPeriod: Map<string, number> = new Map(),
): ProgressPoint[] {
  if (matches.length === 0) {
    return []
  }

  // Group matches by week (simplified: last 4 weeks)
  const now = new Date()
  const weeks: Array<{ label: string; startDate: Date; endDate: Date }> = []

  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i + 1) * 7)
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - i * 7)

    weeks.push({
      label: i === 0 ? 'Ultimi 7 gg' : `Settimana ${now.getWeek() - i}`,
      startDate: weekStart,
      endDate: weekEnd,
    })
  }

  // Calculate metrics per period
  const progressPoints: ProgressPoint[] = []

  weeks.forEach((week) => {
    const weekMatches = matches.filter((m) => {
      const matchDate = new Date(m.startTime || Date.now())
      return matchDate >= week.startDate && matchDate < week.endDate
    })

    if (weekMatches.length === 0) {
      return // Skip empty periods
    }

    // Calculate averages
    const wins = weekMatches.filter((m) => m.result === 'win').length
    const winrate = (wins / weekMatches.length) * 100

    const kdas = weekMatches.map((m) => {
      const deaths = safeNumber(m.deaths, 1)
      return (safeNumber(m.kills, 0) + safeNumber(m.assists, 0)) / deaths
    })
    const avgKda =
      kdas.length > 0 ? kdas.reduce((a, b) => a + b, 0) / kdas.length : null

    // Calculate FZTH Score for this period (simplified)
    // Use same formula as computeProfileIdentity
    const avgGpm =
      weekMatches
        .map((m) => safeNumber(m.gpm, 400))
        .reduce((a, b) => a + b, 0) / weekMatches.length
    const avgXpm =
      weekMatches
        .map((m) => safeNumber(m.xpm, 500))
        .reduce((a, b) => a + b, 0) / weekMatches.length

    // Simplified FZTH Score calculation
    const performanceScore = Math.min(100, ((avgGpm - 200) / 300) * 100)
    const consistencyScore = 50 // Placeholder
    const macroScore = Math.min(100, ((avgXpm - 300) / 400) * 100)

    const fzthScore = Math.round(
      performanceScore * 0.4 + consistencyScore * 0.3 + macroScore * 0.3,
    )

    const tasksCompleted = tasksCompletedByPeriod.get(week.label) ?? null

    progressPoints.push({
      periodLabel: week.label,
      fzthScore,
      winrate: Math.round(winrate * 10) / 10,
      avgKda: avgKda ? Math.round(avgKda * 100) / 100 : null,
      tasksCompleted,
    })
  })

  // Reverse to show oldest first
  return progressPoints.reverse()
}

// Helper to get week number
declare global {
  interface Date {
    getWeek(): number
  }
}

Date.prototype.getWeek = function () {
  const d = new Date(
    Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()),
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
