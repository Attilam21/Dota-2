'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'

type FzthProfileResponse = {
  playerId: number
  internalPlayerId: string
  kpi: {
    totalMatches: number
    winrate: number
    avgKda: number
    avgDurationMin: number
  }
  level: {
    currentLevel: number
    currentXp: number
    nextLevelXp: number | null
  } | null
  achievements: Array<{
    achievementId: string
    code: string
    title: string
    unlockedAt: string
  }>
  insights: Array<{
    type: string
    content: string
    createdAt: string
  }>
}

export default function FzthProfilePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">Caricamento profilo FZTH…</div>
      }
    >
      <FzthProfileContent />
    </Suspense>
  )
}

function FzthProfileContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [data, setData] = useState<FzthProfileResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/fzth/profile?playerId=${playerId}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || `HTTP ${res.status}`)
        }
        const j: FzthProfileResponse = await res.json()
        if (!active) return
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('FZTH profile data', j)
        }
        setData(j)
      } catch (e: any) {
        console.error('FZTH profile load error', e?.message ?? e)
        if (active) setError(e?.message ?? 'Errore profilo FZTH')
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
        <h1 className="text-2xl font-semibold">Profilazione FZTH</h1>
        <p className="text-sm text-neutral-400">
          Panoramica evolutiva del tuo percorso su FZTH, livelli, achievements e
          insight IA.
        </p>
      </div>

      {loading && (
        <div className="text-neutral-400">Caricamento profilo FZTH…</div>
      )}
      {error && (
        <div className="text-red-400">Errore nel caricamento: {error}</div>
      )}

      {!loading && !error && data && (
        <>
          {/* Identità FZTH */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-neutral-300">
                Player · ID #{data.playerId}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-neutral-400">Winrate</div>
                <div className="text-xl font-semibold">{data.kpi.winrate}%</div>
              </div>
            </div>
          </div>

          {/* Barra di progressione livello */}
          <div className="rounded-lg border border-neutral-800 p-4">
            {data.level ? (
              <div>
                <div className="mb-1 text-sm text-neutral-300">
                  Livello {data.level.currentLevel}
                </div>
                <div className="h-2 w-full rounded bg-neutral-900">
                  <div
                    className="h-2 rounded bg-blue-500"
                    style={{
                      width: `${(() => {
                        const next = data.level?.nextLevelXp
                        const cur = data.level?.currentXp ?? 0
                        if (next && next > 0) {
                          return Math.max(
                            0,
                            Math.min(100, Math.round((cur / next) * 100)),
                          )
                        }
                        return 0
                      })()}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  XP: {data.level.currentXp}
                  {data.level.nextLevelXp ? ` / ${data.level.nextLevelXp}` : ''}
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                Il sistema di progressione verrà inizializzato dopo le prossime
                partite. Continua a giocare per sbloccare il tuo percorso FZTH.
              </div>
            )}
          </div>

          {/* KPI sintetici */}
          <div className="rounded-lg border border-neutral-800 p-4">
            {!data.kpi && (
              <div className="mb-2 text-xs text-yellow-400">
                Nessuna partita disponibile per questo giocatore. I dati
                verranno mostrati quando saranno disponibili partite da
                OpenDota.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded bg-neutral-900/40 p-3">
                <div className="text-xs text-neutral-400">Partite</div>
                <div className="text-lg">
                  {data.kpi ? data.kpi.totalMatches : '–'}
                </div>
              </div>
              <div className="rounded bg-neutral-900/40 p-3">
                <div className="text-xs text-neutral-400">Winrate</div>
                <div className="text-lg">
                  {data.kpi ? `${data.kpi.winrate}%` : '–'}
                </div>
              </div>
              <div className="rounded bg-neutral-900/40 p-3">
                <div className="text-xs text-neutral-400">KDA medio</div>
                <div className="text-lg">
                  {data.kpi ? data.kpi.avgKda : '–'}
                </div>
              </div>
              <div className="rounded bg-neutral-900/40 p-3">
                <div className="text-xs text-neutral-400">Durata media</div>
                <div className="text-lg">
                  {data.kpi ? `${data.kpi.avgDurationMin}m` : '–'}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-2 text-sm text-neutral-300">Achievements</h2>
            {data.achievements.length === 0 ? (
              <div className="text-xs text-neutral-500">
                Gli achievement verranno sbloccati automaticamente man mano che
                giochi nuove partite.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data.achievements
                  .sort(
                    (a, b) => (a.unlockedAt ? -1 : 1) - (b.unlockedAt ? -1 : 1),
                  )
                  .map((a) => (
                    <div
                      key={a.achievementId}
                      className="rounded border border-green-800 bg-green-950/30 p-3 text-green-300"
                    >
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="text-xs text-neutral-300">
                        Code: {a.code}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-wide">
                        {a.unlockedAt
                          ? `Sbloccato il ${new Date(
                              a.unlockedAt,
                            ).toLocaleDateString('it-IT')}`
                          : ''}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Insight IA */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-2 text-sm text-neutral-300">Insight IA</h2>
            {data.insights.length === 0 ? (
              <div className="text-xs text-neutral-500">
                Gli insight IA verranno popolati quando attiveremo il modulo di
                coaching intelligente.
              </div>
            ) : (
              <div className="space-y-2">
                {data.insights.map((i) => (
                  <div
                    key={`${i.type}-${i.createdAt}`}
                    className="rounded bg-neutral-900/40 px-3 py-2"
                  >
                    <div className="text-[11px] text-neutral-500">
                      {new Date(i.createdAt).toLocaleString('it-IT')}
                    </div>
                    <div className="text-sm text-neutral-200">{i.type}</div>
                    <div className="text-xs text-neutral-300">{i.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA Coaching */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-300">
                Vuoi trasformare il tuo profilo FZTH in un piano operativo di
                miglioramento?
              </div>
              <a
                href="/dashboard/coaching"
                className="text-sm text-blue-400 hover:underline"
              >
                Vai al Coaching
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
