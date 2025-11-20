'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'

type FzthProfileResponse = {
  player: { dotaAccountId: number; nickname: string | null }
  kpi: {
    totalMatches: number
    winrate: number
    avgKda: number
    fzthScore: number | null
  }
  level: {
    currentLevel: number
    title: string
    currentXp: number
    minXp: number
    maxXp: number
    xpRatio: number
    badgeColor?: string | null
  } | null
  achievements: {
    total: number
    unlocked: number
    items: Array<{
      code: string
      name: string
      description: string
      category: string
      rarity: string
      unlockedAt: string | null
    }>
  }
  playstyle: { tags: string[]; notes?: string }
  insights: Array<{
    id: string
    createdAt: string
    title: string
    message: string
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
                {data.player.nickname ?? 'Player'} · ID #
                {data.player.dotaAccountId}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-neutral-400">FZTH Score</div>
                <div className="text-xl font-semibold">
                  {data.kpi.fzthScore ?? '—'}
                </div>
                {data.level && (
                  <span
                    className="rounded px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: data.level.badgeColor ?? undefined,
                      color: '#fff',
                    }}
                  >
                    {data.level.title}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.playstyle.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Barra di progressione livello */}
          <div className="rounded-lg border border-neutral-800 p-4">
            {data.level ? (
              <div>
                <div className="mb-1 text-sm text-neutral-300">
                  Livello {data.level.currentLevel} – {data.level.title}
                </div>
                <div className="h-2 w-full rounded bg-neutral-900">
                  <div
                    className="h-2 rounded bg-blue-500"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, Math.round(data.level.xpRatio * 100)),
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  XP: {data.level.currentXp} / {data.level.maxXp}
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                Il sistema di progressione verrà inizializzato dopo le prossime
                partite. Continua a giocare per sbloccare il tuo percorso FZTH.
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm text-neutral-300">Achievements</h2>
              <div className="text-xs text-neutral-400">
                Sbloccati: {data.achievements.unlocked} /{' '}
                {data.achievements.total}
              </div>
            </div>
            {data.achievements.items.length === 0 ? (
              <div className="text-xs text-neutral-500">
                Gli achievement verranno sbloccati automaticamente man mano che
                giochi nuove partite.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data.achievements.items
                  .sort(
                    (a, b) => (a.unlockedAt ? -1 : 1) - (b.unlockedAt ? -1 : 1),
                  )
                  .map((a) => (
                    <div
                      key={a.code}
                      className={`rounded border p-3 ${
                        a.unlockedAt
                          ? 'border-green-800 bg-green-950/30 text-green-300'
                          : 'border-neutral-800 bg-neutral-900/40 text-neutral-400'
                      }`}
                    >
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs">{a.description}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wide">
                        {a.unlockedAt
                          ? `Sbloccato il ${new Date(
                              a.unlockedAt,
                            ).toLocaleDateString('it-IT')}`
                          : 'Non ancora sbloccato'}
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
                    key={i.id}
                    className="rounded bg-neutral-900/40 px-3 py-2"
                  >
                    <div className="text-[11px] text-neutral-500">
                      {new Date(i.createdAt).toLocaleString('it-IT')}
                    </div>
                    <div className="text-sm text-neutral-200">{i.title}</div>
                    <div className="text-xs text-neutral-300">{i.message}</div>
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
