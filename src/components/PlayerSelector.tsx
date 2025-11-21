'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DEFAULT_PLAYER_ID, getPlayerIdFromSearchParams } from '@/lib/playerId'

type PlayerSummary = {
  playerId: number
  matchesCount: number
  lastMatchTime: string | null
  winrate: number
}

export default function PlayerSelector(): React.JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [players, setPlayers] = useState<PlayerSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const currentId = getPlayerIdFromSearchParams(searchParams)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/players/list', { cache: 'no-store' })
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }
        const json: PlayerSummary[] = await res.json()
        if (!active) return
        setPlayers(json)

        // Se non c'è playerId in URL e abbiamo giocatori, scegli il primo
        const fromUrl = searchParams.get('playerId')
        if (
          (!fromUrl || !Number.isFinite(Number(fromUrl))) &&
          json.length > 0
        ) {
          const first = json[0].playerId
          const p = new URLSearchParams(searchParams.toString())
          p.set('playerId', String(first))
          router.replace(`${pathname}?${p.toString()}`)
        }
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Errore caricamento giocatori')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [pathname, router, searchParams])

  const options = useMemo(() => {
    return (players ?? []).map((p) => {
      const winPct = Math.round((p.winrate || 0) * 100)
      return {
        value: String(p.playerId),
        label: `Player #${p.playerId} (${p.matchesCount} partite, ${winPct}%)`,
      }
    })
  }, [players])

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value
    const p = new URLSearchParams(searchParams.toString())
    p.set('playerId', newId)
    router.push(`${pathname}?${p.toString()}`)
  }

  if (loading) return <span>Caricamento giocatori…</span>
  if (error)
    return (
      <span className="text-red-400">Errore nel caricamento dei giocatori</span>
    )

  // Se non ci sono giocatori, mostra un messaggio informativo invece di nulla
  if (!players || players.length === 0) {
    return (
      <span className="text-neutral-500 italic">
        Nessun giocatore. Sincronizza dati.
      </span>
    )
  }

  return (
    <select
      className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
      value={String(currentId)}
      onChange={onChange}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
