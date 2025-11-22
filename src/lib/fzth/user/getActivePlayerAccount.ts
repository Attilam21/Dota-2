/**
 * Get Active Player Account
 *
 * Centralized function to determine the active player account.
 * Currently only supports DEMO mode.
 *
 * TODO: In futuro qui potrà essere reintrodotto un login reale (Steam/email).
 * Ora l'app gira solo in modalità demo.
 */

import type { ActivePlayerAccount } from './types'
import { getDemoPlayerId } from '../demoPlayer'

/**
 * Get the active player account (always DEMO mode for now)
 */
export async function getActivePlayerAccount(): Promise<ActivePlayerAccount> {
  const demoAccountId = getDemoPlayerId()

  // Always return demo mode - no login/auth required
  return {
    mode: 'demo',
    dotaAccountId: demoAccountId,
    fzthUserId: null,
    steamId: null,
  }
}
