/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="next" />
'use client'

import Link from 'next/link'
import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'

const TEST_PLAYER_ID = 86745912

type MatchRow = {
  id: string
  player_account_id: number
  match_id: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
  duration_seconds: number
  start_time: string // ISO timestamptz
  result: 'win' | 'lose'
}

function renderResult(r: MatchRow['result']): 'Vittoria' | 'Sconfitta' {
  return r === 'win' ? 'Vittoria' : 'Sconfitta'
}

export default function MatchesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">Caricamento partite…</div>
      }
    >
      <MatchesPageContent />
    </Suspense>
  )
}

function MatchesPageContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [data, setData] = useState<MatchRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        // 1) sincronizza OpenDota -> Supabase
        const syncRes = await fetch(
          `/api/sync/recent-matches?playerId=${playerId}`,
          { cache: 'no-store' },
        )
        if (!syncRes.ok) {
          const msg = await syncRes.json().catch(() => ({}))
          throw new Error(msg?.error || `Sync HTTP ${syncRes.status}`)
        }
        // 2) leggi da Supabase tramite API interna
        const listRes = await fetch(`/api/matches/list?playerId=${playerId}`, {
          cache: 'no-store',
        })
        if (!listRes.ok) {
          const msg = await listRes.json().catch(() => ({}))
          throw new Error(msg?.error || `List HTTP ${listRes.status}`)
        }
        const json: MatchRow[] = await listRes.json()
        if (active) setData(json)
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Errore sconosciuto')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [playerId])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Partite recenti</h1>
        <p className="text-sm text-neutral-300">
          Dati sincronizzati da OpenDota e letti da Supabase (via API interne).
        </p>
        <p className="text-xs text-neutral-500">Player #{playerId}</p>
      </div>

      {loading && (
        <div className="text-neutral-400">Caricamento partite recenti...</div>
      )}
      {error && (
        <div className="text-red-400">
          Errore nel caricamento delle partite: {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-900/60 text-neutral-300">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Match ID</th>
                <th className="px-3 py-2 text-left font-medium">Eroe</th>
                <th className="px-3 py-2 text-left font-medium">K / D / A</th>
                <th className="px-3 py-2 text-left font-medium">
                  Durata (min)
                </th>
                <th className="px-3 py-2 text-left font-medium">Risultato</th>
                <th className="px-3 py-2 text-left font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {(data as MatchRow[]).map((m: MatchRow) => {
                const durationMinutes = Math.round(m.duration_seconds / 60)
                const result = renderResult(m.result)
                return (
                  <tr key={m.match_id} className="border-t border-neutral-800">
                    <td className="px-3 py-2">
                      <Link
                        href={`/dashboard/matches/${m.match_id}?playerId=${playerId}`}
                        className="text-blue-400 hover:underline"
                      >
                        {m.match_id}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{m.hero_id}</td>
                    <td className="px-3 py-2">
                      {m.kills} / {m.deaths} / {m.assists}
                    </td>
                    <td className="px-3 py-2">{durationMinutes}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          result === 'Vittoria'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }
                      >
                        {result}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {new Date(m.start_time).toLocaleString('it-IT')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
