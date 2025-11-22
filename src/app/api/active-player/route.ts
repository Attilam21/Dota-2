/**
 * API Route: Active Player Account
 *
 * GET /api/active-player
 *
 * Returns the active player account (Steam or Demo)
 */

import { NextResponse } from 'next/server'
import { getActivePlayerAccount } from '@/lib/fzth/user/getActivePlayerAccount'

export async function GET() {
  try {
    const activePlayer = await getActivePlayerAccount()
    return NextResponse.json(activePlayer)
  } catch (e: any) {
    console.error('[API/ACTIVE-PLAYER] Error:', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Failed to get active player account' },
      { status: 500 },
    )
  }
}
