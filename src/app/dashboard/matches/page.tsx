/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="next" />
'use client'

import Link from 'next/link'
import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import { getHeroIconUrl, getHeroName } from '@/lib/dotaHeroes'

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
  const [filterHero, setFilterHero] = useState<number | null>(null)
  const [filterDuration, setFilterDuration] = useState<string>('all') // 'all', 'short', 'medium', 'long'

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        // SYNC DISABILITATO — ora usiamo solo OpenDota come sorgente dati tramite l'adapter
        // I dati vengono letti direttamente da OpenDota via /api/matches/list che usa opendotaAdapter
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
    <div className="space-y-4 text-white">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Partite recenti</h1>
        <p className="text-sm text-neutral-400">
          Dati letti direttamente da OpenDota tramite API.
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
        <>
          {/* Filtri */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
            <div className="mb-3 text-sm font-medium text-neutral-300">
              Filtri
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="mb-1 block text-xs text-neutral-400">
                  Durata
                </label>
                <select
                  value={filterDuration}
                  onChange={(e) => setFilterDuration(e.target.value)}
                  className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
                >
                  <option value="all">Tutte</option>
                  <option value="short">Corte (&lt;30 min)</option>
                  <option value="medium">Medie (30-50 min)</option>
                  <option value="long">Lunghe (&gt;50 min)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-400">
                  Eroe
                </label>
                <select
                  value={filterHero || ''}
                  onChange={(e) =>
                    setFilterHero(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
                >
                  <option value="">Tutti gli eroi</option>
                  {Array.from(new Set(data.map((m) => m.hero_id))).map(
                    (heroId) => (
                      <option key={heroId} value={heroId}>
                        {getHeroName(heroId)}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Tabella con filtri applicati */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
            <div className="border-b border-neutral-800 px-4 py-2">
              <p className="text-xs text-neutral-400">
                Suggerimento: clicca sul Match ID o su &quot;Vedi partita&quot;
                per aprire il dettaglio della partita.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-neutral-900/95 text-neutral-300 backdrop-blur-sm">
                  <tr>
                    <th className="h-9 px-2 py-1.5 text-left font-medium">
                      Match ID
                    </th>
                    <th className="h-9 px-2 py-1.5 text-left font-medium">
                      Eroe
                    </th>
                    <th className="h-9 px-2 py-1.5 text-left font-medium">
                      K / D / A
                    </th>
                    <th className="h-9 px-2 py-1.5 text-left font-medium">
                      Durata (min)
                    </th>
                    <th className="h-9 px-2 py-1.5 text-left font-medium">
                      Risultato
                    </th>
                    <th className="h-9 px-2 py-1.5 text-left font-medium">
                      Data
                    </th>
                    <th className="h-9 px-2 py-1.5 text-left font-medium">
                      Dettagli
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter((m) => {
                      if (filterHero && m.hero_id !== filterHero) return false
                      const durationMinutes = Math.round(
                        m.duration_seconds / 60,
                      )
                      if (filterDuration === 'short' && durationMinutes >= 30)
                        return false
                      if (
                        filterDuration === 'medium' &&
                        (durationMinutes < 30 || durationMinutes > 50)
                      )
                        return false
                      if (filterDuration === 'long' && durationMinutes <= 50)
                        return false
                      return true
                    })
                    .map((m: MatchRow) => {
                      const durationMinutes = Math.round(
                        m.duration_seconds / 60,
                      )
                      const result = renderResult(m.result)
                      return (
                        <tr
                          key={m.match_id}
                          className="h-9 cursor-pointer border-t border-neutral-800 transition-colors hover:bg-neutral-900/60"
                        >
                          <td className="px-2 py-1">
                            <Link
                              href={`/dashboard/matches/${m.match_id}?playerId=${playerId}`}
                              className="text-blue-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {m.match_id}
                            </Link>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const name = getHeroName(m.hero_id)
                                const icon = getHeroIconUrl(m.hero_id)
                                if (icon) {
                                  return (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={icon}
                                      alt={name}
                                      width={20}
                                      height={20}
                                      className="h-5 w-5 rounded"
                                      loading="lazy"
                                      onError={(e) => {
                                        ;(
                                          e.currentTarget as HTMLImageElement
                                        ).style.display = 'none'
                                      }}
                                    />
                                  )
                                }
                                const initial = name.charAt(0) || '?'
                                return (
                                  <div className="flex h-5 w-5 items-center justify-center rounded bg-neutral-700 text-[9px]">
                                    {initial}
                                  </div>
                                )
                              })()}
                              <span
                                className="max-w-[120px] truncate text-xs"
                                title={getHeroName(m.hero_id)}
                              >
                                {getHeroName(m.hero_id)}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-1 text-xs">
                            {m.kills} / {m.deaths} / {m.assists}
                          </td>
                          <td className="px-2 py-1 text-xs">
                            {durationMinutes}
                          </td>
                          <td className="px-2 py-1">
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
                          <td className="px-2 py-1 text-xs">
                            {new Date(m.start_time).toLocaleString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-2 py-1">
                            <Link
                              href={`/dashboard/matches/${m.match_id}?playerId=${playerId}`}
                              className="inline-flex items-center rounded border border-neutral-700 bg-neutral-800/50 px-2 py-1 text-xs font-medium text-neutral-200 transition-colors hover:border-blue-500/50 hover:bg-blue-950/30 hover:text-blue-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Vedi partita
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Mostrate{' '}
              {
                data.filter((m) => {
                  if (filterHero && m.hero_id !== filterHero) return false
                  const durationMinutes = Math.round(m.duration_seconds / 60)
                  if (filterDuration === 'short' && durationMinutes >= 30)
                    return false
                  if (
                    filterDuration === 'medium' &&
                    (durationMinutes < 30 || durationMinutes > 50)
                  )
                    return false
                  if (filterDuration === 'long' && durationMinutes <= 50)
                    return false
                  return true
                }).length
              }{' '}
              di {data.length} partite
            </div>
          </div>
        </>
      )}
    </div>
  )
}
