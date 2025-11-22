/**
 * FZTH User Types
 *
 * Types for user management and active player account
 */

export type ActivePlayerMode = 'demo' | 'steam'

export interface ActivePlayerAccount {
  mode: ActivePlayerMode // 'demo' se nessun login, 'steam' se utente reale
  dotaAccountId: number // id Dota2 usato per TUTTE le query
  fzthUserId?: string | null // uuid da fzth_users se mode = 'steam'
  steamId?: string | null // steamId64 se mode = 'steam'
}

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
