/**
 * User Mode Switcher Component
 *
 * Displays current user mode (always DEMO for now)
 *
 * TODO: In futuro qui potrà essere reintrodotto un login reale (Steam/email).
 * Ora l'app gira solo in modalità demo.
 */

'use client'

import type { ActivePlayerAccount } from '@/lib/fzth/user/types'

interface UserModeSwitcherProps {
  activePlayer: ActivePlayerAccount
}

export function UserModeSwitcher({
  activePlayer,
}: UserModeSwitcherProps): React.JSX.Element {
  // Always show DEMO mode
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border border-yellow-800/50 bg-yellow-900/30 px-2 py-1 text-xs font-semibold text-yellow-300">
        DEMO
      </span>
      <span className="text-xs text-neutral-400">
        Account: {activePlayer.dotaAccountId}
      </span>
    </div>
  )
}
