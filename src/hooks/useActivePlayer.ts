/**
 * useActivePlayer Hook
 *
 * Client-side hook to get the active player account
 */

import { useEffect, useState } from 'react'
import type { ActivePlayerAccount } from '@/lib/fzth/user/types'

export function useActivePlayer(): {
  activePlayer: ActivePlayerAccount | null
  loading: boolean
  error: string | null
} {
  const [activePlayer, setActivePlayer] = useState<ActivePlayerAccount | null>(
    null,
  )
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/active-player', { cache: 'no-store' })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const data: ActivePlayerAccount = await res.json()
        if (active) {
          setActivePlayer(data)
        }
      } catch (e: any) {
        console.error('[useActivePlayer] Error:', e)
        if (active) {
          setError(e?.message ?? 'Failed to load active player')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return { activePlayer, loading, error }
}
