/**
 * Get Active Player Account
 *
 * Centralized function to determine the active player account.
 * Handles both Steam login and Demo mode.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { ActivePlayerAccount } from './types'
import { getOrCreateFzthUserFromSteam } from './getOrCreateFzthUserFromSteam'

/**
 * Get the active player account (Steam user or Demo)
 */
export async function getActivePlayerAccount(): Promise<ActivePlayerAccount> {
  // 1. Read DEMO_DOTA_ACCOUNT_ID from env
  const demoAccountId = process.env.DEMO_DOTA_ACCOUNT_ID

  if (!demoAccountId) {
    console.error(
      '[FZTH-USER] DEMO_DOTA_ACCOUNT_ID environment variable is not set',
    )
    throw new Error(
      'DEMO_DOTA_ACCOUNT_ID environment variable is required. Please set it in your .env.local file.',
    )
  }

  const demoAccountIdNum = Number(demoAccountId)
  if (!Number.isFinite(demoAccountIdNum) || demoAccountIdNum <= 0) {
    console.error('[FZTH-USER] DEMO_DOTA_ACCOUNT_ID must be a positive number')
    throw new Error('DEMO_DOTA_ACCOUNT_ID must be a valid positive number')
  }

  // 2. Check Supabase Auth session
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.warn('[FZTH-USER] Error getting session:', sessionError)
      // Fallback to demo mode
      return {
        mode: 'demo',
        dotaAccountId: demoAccountIdNum,
        fzthUserId: null,
        steamId: null,
      }
    }

    // 3. If no session, return demo mode
    if (!session || !session.user) {
      return {
        mode: 'demo',
        dotaAccountId: demoAccountIdNum,
        fzthUserId: null,
        steamId: null,
      }
    }

    // 4. Check if user has Steam ID in user metadata
    // TODO: When Steam OAuth is implemented, the steam_id will be in session.user.user_metadata
    // For now, we check if there's a custom claim or metadata field
    const steamId =
      session.user.user_metadata?.steam_id ||
      session.user.user_metadata?.provider_id ||
      null

    if (!steamId) {
      // No Steam ID in session, use demo mode
      // TODO: In the future, we might want to check if user has linked Steam account
      return {
        mode: 'demo',
        dotaAccountId: demoAccountIdNum,
        fzthUserId: null,
        steamId: null,
      }
    }

    // 5. Get or create FZTH user from Steam
    try {
      const fzthUser = await getOrCreateFzthUserFromSteam(steamId, {
        displayName: session.user.user_metadata?.display_name,
        avatarUrl: session.user.user_metadata?.avatar_url,
        country: session.user.user_metadata?.country,
        language: session.user.user_metadata?.language,
      })

      // 6. Check if user has dota_account_id
      if (!fzthUser.dota_account_id) {
        // User hasn't completed Dota onboarding yet
        // TODO: Redirect to onboarding page in the future
        // For now, fallback to demo mode
        console.warn(
          `[FZTH-USER] User ${fzthUser.id} has no dota_account_id, using demo mode`,
        )
        return {
          mode: 'demo',
          dotaAccountId: demoAccountIdNum,
          fzthUserId: fzthUser.id,
          steamId: fzthUser.steam_id || null,
        }
      }

      // 7. Return Steam mode with user's Dota account
      return {
        mode: 'steam',
        dotaAccountId: fzthUser.dota_account_id,
        fzthUserId: fzthUser.id,
        steamId: fzthUser.steam_id || null,
      }
    } catch (error: any) {
      console.error('[FZTH-USER] Error getting/creating FZTH user:', error)
      // Fallback to demo mode on error
      return {
        mode: 'demo',
        dotaAccountId: demoAccountIdNum,
        fzthUserId: null,
        steamId: null,
      }
    }
  } catch (error: any) {
    console.error('[FZTH-USER] Unexpected error:', error)
    // Fallback to demo mode on any error
    return {
      mode: 'demo',
      dotaAccountId: demoAccountIdNum,
      fzthUserId: null,
      steamId: null,
    }
  }
}
