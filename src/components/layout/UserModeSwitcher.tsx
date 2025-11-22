/**
 * User Mode Switcher Component
 *
 * Displays current user mode (Demo/Steam) in the dashboard header
 */

'use client'

import type { ActivePlayerAccount } from '@/lib/fzth/user/types'

interface UserModeSwitcherProps {
  activePlayer: ActivePlayerAccount
}

export function UserModeSwitcher({
  activePlayer,
}: UserModeSwitcherProps): React.JSX.Element {
  if (activePlayer.mode === 'demo') {
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

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border border-blue-800/50 bg-blue-900/30 px-2 py-1 text-xs font-semibold text-blue-300">
        STEAM
      </span>
      {activePlayer.steamId && (
        <span className="text-xs text-neutral-400">
          Steam ID: {activePlayer.steamId}
        </span>
      )}
    </div>
  )
}
