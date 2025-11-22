import type { ReadonlyURLSearchParams } from 'next/navigation'
import { getDemoPlayerId } from '@/lib/fzth/demoPlayer'

export const DEFAULT_PLAYER_ID = 86745912 // Legacy constant, use getDemoPlayerId() instead

/**
 * Get player ID from search params or fallback to demo player
 *
 * TODO: In futuro qui potrà essere reintrodotto un login reale (Steam/email).
 * Ora l'app gira solo in modalità demo.
 */
export function getPlayerIdFromSearchParams(
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): number {
  const fromQuery = searchParams.get('playerId')
  const parsed = fromQuery ? Number(fromQuery) : NaN
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return getDemoPlayerId()
  }
  return parsed
}
