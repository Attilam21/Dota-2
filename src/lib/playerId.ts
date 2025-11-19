import type { ReadonlyURLSearchParams } from 'next/navigation'

export const DEFAULT_PLAYER_ID = 86745912

export function getPlayerIdFromSearchParams(
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): number {
  const fromQuery = searchParams.get('playerId')
  const parsed = fromQuery ? Number(fromQuery) : NaN
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PLAYER_ID
  }
  return parsed
}
