'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import type { HeroPoolProfile, HeroPerformanceRow } from '@/types/heroPool'
import HeroPoolTable from '@/components/dota/heroes/HeroPoolTable'
import HeroPoolChart from '@/components/dota/heroes/HeroPoolChart'
import HeroFocusCard from '@/components/dota/heroes/HeroFocusCard'

export default function HeroesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">
          Caricamento statistiche per eroe…
        </div>
      }
    >
      <HeroesContent />
    </Suspense>
  )
}

function HeroesContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [profile, setProfile] = useState<HeroPoolProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'matches' | 'winrate'>('matches')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedHero, setSelectedHero] = useState<HeroPerformanceRow | null>(
    null,
  )

  useEffect(() => {
    let active = true
    async function load() {
      if (!playerId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await fetch(
          `/api/heroes/pool?playerId=${playerId}&limit=100`,
          {
            cache: 'no-store',
          },
        )
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }
        const data: HeroPoolProfile = await res.json()
        if (active) {
          setProfile(data)
        }
      } catch (e: any) {
        console.error('Heroes load error:', e)
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

  function toggleSort(key: 'matches' | 'winrate') {
    if (sortBy !== key) {
      setSortBy(key)
      setSortDir('desc')
    } else {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    }
  }

  function handleHeroSelect(hero: HeroPerformanceRow) {
    setSelectedHero(hero)
  }

  return (
    <div className="space-y-4 text-white">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Hero Pool</h1>
        <p className="text-sm text-neutral-400">
          Panoramica delle performance per eroe su tutte le partite disponibili
          (dataset di test).
        </p>
        {playerId && (
          <p className="text-xs text-neutral-500">Player #{playerId}</p>
        )}
      </div>

      {loading && (
        <div className="text-neutral-400">
          Caricamento statistiche per eroe…
        </div>
      )}
      {error && (
        <div className="text-red-400">Errore nel caricamento: {error}</div>
      )}

      {!loading && !error && profile && profile.heroes.length === 0 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 text-neutral-300 backdrop-blur-sm">
          Nessuna partita trovata per questo giocatore nel dataset disponibile.
        </div>
      )}

      {!loading && !error && profile && profile.heroes.length > 0 && (
        <div className="space-y-6">
          {/* BLOCCO 1: Overview Hero Pool + Tabella */}
          <div className="space-y-6">
            {/* KPI Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <KpiCard
                label="Hero pool"
                value={`${profile.summary.heroPoolCount}`}
              />
              <KpiCard
                label="Eroe più giocato"
                value={
                  profile.summary.mostPlayedHero
                    ? `${profile.summary.mostPlayedHero.heroName} • ${profile.summary.mostPlayedHero.matches}`
                    : '—'
                }
              />
              <KpiCard
                label="Miglior WR (≥3)"
                value={
                  profile.summary.bestHero
                    ? `${profile.summary.bestHero.heroName} • ${profile.summary.bestHero.winrate}%`
                    : '—'
                }
              />
              <KpiCard
                label="Peggior WR (≥3)"
                value={
                  profile.summary.worstHero
                    ? `${profile.summary.worstHero.heroName} • ${profile.summary.worstHero.winrate}%`
                    : '—'
                }
              />
            </div>

            {/* Tabella principale */}
            <HeroPoolTable
              heroes={profile.heroes}
              playerId={playerId}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={toggleSort}
              onHeroSelect={handleHeroSelect}
            />
          </div>

          {/* BLOCCO 2: Grafico Winrate vs Utilizzo */}
          <HeroPoolChart
            heroes={profile.heroes}
            onHeroSelect={handleHeroSelect}
          />

          {/* BLOCCO 3: Hero Focus Card */}
          <HeroFocusCard hero={selectedHero} />
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  )
}
