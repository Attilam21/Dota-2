/**
 * FZTH User Types
 *
 * Types for user management and active player account
 *
 * TODO: In futuro qui potrà essere reintrodotto un login reale (Steam/email).
 * Ora l'app gira solo in modalità demo.
 */

export type ActivePlayerMode = 'demo' // Only 'demo' for now, 'steam' removed

export interface ActivePlayerAccount {
  mode: ActivePlayerMode // Always 'demo' for now
  dotaAccountId: number // id Dota2 usato per TUTTE le query
  fzthUserId?: string | null // Always null in demo mode
  steamId?: string | null // Always null in demo mode
}

// Legacy type - kept for potential future use
export interface FzthUser {
  id: string // UUID
  steam_id: string | null
  dota_account_id: number | null
  display_name: string | null
  avatar_url: string | null
  country_code: string | null
  language_code: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
}
