'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import type { PeersKPI } from '@/services/dota/kpiService'
import ExplanationCard from '@/components/charts/ExplanationCard'

export default function TeamsPeersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">
          Caricamento statistiche compagni…
        </div>
      }
    >
      <TeamsPeersContent />
    </Suspense>
  )
}

function TeamsPeersContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [peersKPI, setPeersKPI] = useState<PeersKPI | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!playerId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await fetch(`/api/kpi/peers?playerId=${playerId}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }
        const kpi: PeersKPI = await res.json()
        if (active) setPeersKPI(kpi)
      } catch (e: any) {
        console.error('Peers load error:', e)
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
    <div className="space-y-6 p-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold">Team & compagni</h1>
        <p className="text-sm text-neutral-400">
          Statistiche sui compagni abituali, winrate insieme e sinergie.
        </p>
        <p className="text-xs text-neutral-500">Player #{playerId}</p>
      </div>

      {loading && (
        <div className="text-neutral-400">
          Caricamento statistiche compagni…
        </div>
      )}
      {error && (
        <div className="text-red-400">Errore nel caricamento: {error}</div>
      )}

      {!loading && !error && (!peersKPI || peersKPI.peers.length === 0) && (
        <div className="rounded-lg border border-neutral-800 p-6 text-neutral-300">
          Nessun dato disponibile sui compagni. I dati vengono recuperati da
          OpenDota quando giochi in party con altri giocatori.
        </div>
      )}

      {!loading && !error && peersKPI && peersKPI.peers.length > 0 && (
        <>
          {/* KPI sintetici */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="text-xs text-neutral-400">Compagni totali</div>
              <div className="text-xl font-semibold">
                {peersKPI.peers.length}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="text-xs text-neutral-400">
                Compagni con winrate positivo
              </div>
              <div className="text-xl font-semibold">
                {peersKPI.peers.filter((p) => p.winRate >= 50).length}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="text-xs text-neutral-400">
                Compagni con winrate negativo
              </div>
              <div className="text-xl font-semibold">
                {peersKPI.peers.filter((p) => p.winRate < 50).length}
              </div>
            </div>
          </div>

          {/* Top 5 compagni con cui vinci di più */}
          {peersKPI.top5ByWinrate.length > 0 && (
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Top 5 compagni con cui vinci di più
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-900/60 text-neutral-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        Account ID
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Partite insieme
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Winrate
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Vittorie / Sconfitte
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {peersKPI.top5ByWinrate.map((p) => {
                      const wins = Math.round(
                        (p.winRate / 100) * p.matchesTogether,
                      )
                      const losses = p.matchesTogether - wins
                      return (
                        <tr
                          key={p.accountId}
                          className="border-t border-neutral-800"
                        >
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs">
                              {p.accountId}
                            </span>
                          </td>
                          <td className="px-3 py-2">{p.matchesTogether}</td>
                          <td className="px-3 py-2">
                            <span className="text-green-400">{p.winRate}%</span>
                          </td>
                          <td className="px-3 py-2">
                            {wins} / {losses}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <ExplanationCard
                title="Sinergie positive"
                description="Questi sono i compagni con cui performi meglio. Considera di giocare più spesso con loro per massimizzare le tue possibilità di vittoria."
                timeRange="Tutte le partite disponibili"
                interpretation="Se giochi spesso in party, valuta con chi performi meglio e organizza sessioni di gioco con questi compagni."
              />
            </div>
          )}

          {/* Top 5 compagni con winrate negativo */}
          {peersKPI.top5ByNegativeWinrate.length > 0 && (
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Compagni con cui hai rendimento negativo
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-900/60 text-neutral-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        Account ID
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Partite insieme
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Winrate
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Vittorie / Sconfitte
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {peersKPI.top5ByNegativeWinrate.map((p) => {
                      const wins = Math.round(
                        (p.winRate / 100) * p.matchesTogether,
                      )
                      const losses = p.matchesTogether - wins
                      return (
                        <tr
                          key={p.accountId}
                          className="border-t border-neutral-800"
                        >
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs">
                              {p.accountId}
                            </span>
                          </td>
                          <td className="px-3 py-2">{p.matchesTogether}</td>
                          <td className="px-3 py-2">
                            <span className="text-red-400">{p.winRate}%</span>
                          </td>
                          <td className="px-3 py-2">
                            {wins} / {losses}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <ExplanationCard
                title="Sinergie da migliorare"
                description="Questi sono i compagni con cui performi peggio. Potrebbe essere un problema di comunicazione, stili di gioco incompatibili o semplicemente bisogno di più pratica insieme."
                timeRange="Tutte le partite disponibili"
                interpretation="Considera di comunicare meglio con questi compagni o di provare strategie diverse quando giochi con loro."
              />
            </div>
          )}

          {/* Lista completa compagni */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm text-neutral-300">
              Tutti i compagni ({peersKPI.peers.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-900/60 text-neutral-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      Account ID
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Partite insieme
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Winrate</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Vittorie / Sconfitte
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {peersKPI.peers
                    .sort((a, b) => b.matchesTogether - a.matchesTogether)
                    .map((p) => (
                      <tr
                        key={p.accountId}
                        className="border-t border-neutral-800 hover:bg-neutral-900/40"
                      >
                        <td className="px-3 py-2">
                          <span className="font-mono text-xs">
                            {p.accountId}
                          </span>
                        </td>
                        <td className="px-3 py-2">{p.matchesTogether}</td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              p.winRate >= 50
                                ? 'text-green-400'
                                : 'text-red-400'
                            }
                          >
                            {p.winRate}%
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {p.wins} / {p.losses}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
