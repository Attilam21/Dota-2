/**
 * Coaching Utility Functions
 */

import type { CoachingPillarId } from './types'

export const pillarLabels: Record<CoachingPillarId, string> = {
  laning: 'Laning & Farm',
  macro: 'Macro & Objectives',
  teamfight: 'Teamfight',
  consistency: 'Consistenza',
  hero_pool: 'Hero Pool & Meta',
}

export function getPillarLabel(pillarId: CoachingPillarId): string {
  return pillarLabels[pillarId] || pillarId
}

export function getStatusBadgeColor(
  status: 'pending' | 'in_progress' | 'completed' | 'blocked',
): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-900/20 border-yellow-800/50 text-yellow-300'
    case 'in_progress':
      return 'bg-blue-900/20 border-blue-800/50 text-blue-300'
    case 'completed':
      return 'bg-green-900/20 border-green-800/50 text-green-300'
    case 'blocked':
      return 'bg-red-900/20 border-red-800/50 text-red-300'
    default:
      return 'bg-neutral-900/20 border-neutral-800/50 text-neutral-300'
  }
}

export function getStatusLabel(
  status: 'pending' | 'in_progress' | 'completed' | 'blocked',
): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'blocked':
      return 'Blocked'
    default:
      return status
  }
}

export function getDifficultyStars(difficulty: 1 | 2 | 3): string {
  return '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty)
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}
