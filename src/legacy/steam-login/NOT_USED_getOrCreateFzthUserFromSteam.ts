/**
 * LEGACY: integrazione Steam disattivata.
 * Non importare questo file finché il login reale non viene riprogettato.
 *
 * Get or Create FZTH User from Steam
 *
 * Given a Steam ID, find or create the user in fzth_users table
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { FzthUser } from '@/lib/fzth/user/types'

export async function getOrCreateFzthUserFromSteam(
  steamId: string,
  profileData?: {
    displayName?: string
    avatarUrl?: string
    country?: string
    language?: string
  },
): Promise<FzthUser> {
  const supabase = createServerClient(cookies())

  // 1. Try to find existing user
  const { data: existingUser, error: selectError } = await supabase
    .from('fzth_users')
    .select('*')
    .eq('steam_id', steamId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine
    console.error('[FZTH-USER] Error fetching user:', selectError)
    throw new Error(`Failed to fetch user: ${selectError.message}`)
  }

  // 2. If user exists, update last_login_at and return
  if (existingUser) {
    const { data: updatedUser, error: updateError } = await supabase
      .from('fzth_users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Optionally update profile data if provided
        ...(profileData?.displayName && {
          display_name: profileData.displayName,
        }),
        ...(profileData?.avatarUrl && { avatar_url: profileData.avatarUrl }),
        ...(profileData?.country && { country_code: profileData.country }),
        ...(profileData?.language && {
          language_code: profileData.language,
        }),
      })
      .eq('id', existingUser.id)
      .select()
      .single()

    if (updateError) {
      console.error('[FZTH-USER] Error updating user:', updateError)
      // Return existing user even if update fails
      return existingUser as FzthUser
    }

    return updatedUser as FzthUser
  }

  // 3. If user doesn't exist, create new one
  const now = new Date().toISOString()
  const { data: newUser, error: insertError } = await supabase
    .from('fzth_users')
    .insert({
      steam_id: steamId,
      dota_account_id: null, // Will be set during onboarding
      display_name: profileData?.displayName || null,
      avatar_url: profileData?.avatarUrl || null,
      country_code: profileData?.country || null,
      language_code: profileData?.language || null,
      created_at: now,
      updated_at: now,
      last_login_at: now,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[FZTH-USER] Error creating user:', insertError)
    throw new Error(`Failed to create user: ${insertError.message}`)
  }

  return newUser as FzthUser
}
