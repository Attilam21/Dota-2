/**
 * Profile Utility Functions
 */

/**
 * Normalize value to 0-100 scale
 */
export function normalizeTo100(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) return 50
  const normalized = ((value - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, normalized))
}

/**
 * Calculate trend from two values
 */
export function calculateTrend(
  current: number,
  previous: number,
  threshold: number = 2,
): 'up' | 'flat' | 'down' {
  const diff = current - previous
  if (diff > threshold) return 'up'
  if (diff < -threshold) return 'down'
  return 'flat'
}

/**
 * Generate insight text from score and trend
 */
export function generatePillarInsight(
  pillarId: string,
  score: number,
  trend: 'up' | 'flat' | 'down',
): string {
  const trendText =
    trend === 'up'
      ? 'in miglioramento'
      : trend === 'down'
        ? 'in calo'
        : 'stabile'

  if (score >= 80) {
    return `Eccellente: ${trendText}. Mantieni questo livello.`
  } else if (score >= 60) {
    return `Buono: ${trendText}. Continua a lavorare su piccoli miglioramenti.`
  } else if (score >= 40) {
    return `Nella media: ${trendText}. Focus su miglioramenti mirati.`
  } else {
    return `Da migliorare: ${trendText}. Priorità alta per questo pilastro.`
  }
}

/**
 * Calculate FZTH Level from score (1-10)
 */
export function calculateFzthLevel(score: number): {
  level: number
  nextLevelScore: number
  progressToNext: number
} {
  // Level 1: 0-10, Level 2: 10-20, ..., Level 10: 90-100
  const level = Math.min(10, Math.max(1, Math.floor(score / 10) + 1))
  const nextLevelScore = level < 10 ? level * 10 : 100
  const currentLevelMin = (level - 1) * 10
  const progressToNext =
    level < 10
      ? ((score - currentLevelMin) / (nextLevelScore - currentLevelMin)) * 100
      : 100

  return {
    level,
    nextLevelScore,
    progressToNext: Math.max(0, Math.min(100, progressToNext)),
  }
}

/**
 * Safe number with fallback
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value
  }
  return fallback
}
