/**
 * Utility functions for advanced match analysis
 */

import type { MatchDetail } from '@/services/dota/opendotaAdapter'
import { getGamePhase } from '@/types/dotaAnalysis'

/**
 * Get game phase from time in seconds
 */
export function getPhase(timeSeconds: number): 'early' | 'mid' | 'late' {
  return getGamePhase(timeSeconds)
}

/**
 * Format duration as mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100 * 10) / 10
}

/**
 * Safe number access with fallback
 */
export function safeNumber(
  value: number | null | undefined,
  fallback = 0,
): number {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback
  }
  return value
}
