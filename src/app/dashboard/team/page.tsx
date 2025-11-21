'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'

type TeammateSummary = {
  accountId: number | null
  label: string
  matches: number
  winrate: number
  avgKda: number
}

type TeammatesSummaryResponse = {
  totalMatchesConsidered: number
  uniqueTeammates: number
  topByMatches: TeammateSummary | null
  topByWinrate: TeammateSummary | null
  worstByWinrate: TeammateSummary | null
  teammates: TeammateSummary[]
}

export default function TeamPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">Caricamento dati compagni…</div>
      }
    >
      <TeamContent />
    </Suspense>
  )
}

function TeamContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [data, setData] = useState<TeammatesSummaryResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/teammates/summary?playerId=${playerId}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }
        const json: TeammatesSummaryResponse = await res.json()
        if (!active) return
        setData(json)
      } catch (e: any) {
        console.error('Team summary load error:', e)
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

  const teammates = useMemo(() => data?.teammates ?? [], [data])

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team & compagni</h1>
          <p className="text-sm text-neutral-400">
            {data?.totalMatchesConsidered
              ? `Analisi delle performance per compagno (campione: ultime ${data.totalMatchesConsidered} partite).`
              : 'Analisi delle performance per compagno sulle ultime partite disponibili (dataset di test).'}
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-neutral-400">Caricamento dati compagni…</div>
      )}
      {error && (
        <div className="text-red-400">
          Errore nel caricamento dei dati Team & compagni: {error}
        </div>
      )}

      {!loading && !error && data && data.totalMatchesConsidered === 0 && (
        <div className="rounded-lg border border-neutral-800 p-6 text-neutral-300">
          Nessun dato disponibile per questo giocatore sul campione di partite
          analizzato.
        </div>
      )}

      {!loading && !error && data && data.totalMatchesConsidered > 0 && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiCard
              label="Compagni diversi"
              value={`${data.uniqueTeammates}`}
            />
            <KpiCard
              label="Compagno più frequente"
              value={
                data.topByMatches
                  ? `${data.topByMatches.label} • ${data.topByMatches.matches}`
                  : '—'
              }
            />
            <KpiCard
              label="Miglior compagno (WR)"
              value={
                data.topByWinrate
                  ? `${data.topByWinrate.label} • ${data.topByWinrate.winrate}%`
                  : '—'
              }
            />
            <KpiCard
              label="Peggior compagno (WR)"
              value={
                data.worstByWinrate
                  ? `${data.worstByWinrate.label} • ${data.worstByWinrate.winrate}%`
                  : '—'
              }
            />
          </div>

          {/* Tabella compagni */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm text-neutral-300">
              Performance con i compagni
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-900/60 text-neutral-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      Compagno
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Partite insieme
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Affidabilità
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Winrate</th>
                    <th className="px-3 py-2 text-left font-medium">
                      KDA medio (giocatore)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teammates.map((t) => (
                    <tr
                      key={`${t.accountId ?? 'anon'}-${t.label}`}
                      className="border-t border-neutral-800"
                    >
                      <td className="px-3 py-2">{t.label}</td>
                      <td className="px-3 py-2">{t.matches}</td>
                      <td className="px-3 py-2">
                        {(() => {
                          const lvl =
                            t.matches >= 10
                              ? 'alta'
                              : t.matches >= 5
                                ? 'media'
                                : 'bassa'
                          const cls =
                            lvl === 'alta'
                              ? 'bg-green-900/40 text-green-300'
                              : lvl === 'media'
                                ? 'bg-yellow-900/40 text-yellow-300'
                                : 'bg-neutral-800 text-neutral-300'
                          return (
                            <span
                              className={`rounded px-2 py-0.5 text-xs ${cls}`}
                            >
                              {lvl}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            t.winrate >= 60
                              ? 'text-green-400'
                              : t.winrate < 45
                                ? 'text-red-400'
                                : 'text-neutral-300'
                          }
                        >
                          {t.winrate}%
                        </span>
                      </td>
                      <td className="px-3 py-2">{t.avgKda.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {teammates.length === 0 && (
            <div className="rounded-lg border border-neutral-800 p-6 text-neutral-300">
              Nessun compagno con partite insieme nel campione analizzato.
            </div>
          )}
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
