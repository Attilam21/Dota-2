'use client'

import { useEffect, useState } from 'react'
import { useActivePlayer } from '@/hooks/useActivePlayer'
import MultiLineChart from '@/components/charts/MultiLineChart'
import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { FarmEconomyAnalysis } from '@/lib/dota/advancedAnalysis/types'

export default function FarmAndEconomyPage() {
  const { activePlayer, loading: playerLoading } = useActivePlayer()
  const [data, setData] = useState<FarmEconomyAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (playerLoading || !activePlayer?.dotaAccountId) {
      if (!playerLoading && !activePlayer) setLoading(false)
      return
    }

    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(
          `/api/dota/advanced/economy?playerId=${
            activePlayer?.dotaAccountId || 0
          }`,
        )
        if (!res.ok) throw new Error('Failed to load economy analysis')
        const json = await res.json()
        setData(json.data)
      } catch (e: any) {
        setError(e?.message || 'Errore nel caricamento dati')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [activePlayer, playerLoading])

  if (loading || playerLoading) {
    return (
      <div className="p-6">
        <div className="text-neutral-400">Caricamento analisi economy...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-400">Errore: {error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-neutral-400">Nessun dato disponibile</div>
      </div>
    )
  }

  // Prepare chart data
  const gpmTimelineData = data.gpmTimeline.map((d) => ({
    x: d.minute,
    gpm: d.avgGpm,
  }))

  const comparisonChart = data.gpmComparison.map((c) => ({
    label: c.period,
    value: c.gpm,
    color: c.period.includes('Ultimi') ? '#22c55e' : '#60a5fa',
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Farm & Economy</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Analisi dell&apos;efficienza di farm e economy: GPM, XPM, dead gold,
          item timing.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs text-neutral-400">GPM Medio</div>
          <div className="text-2xl font-semibold text-white">
            {data.avgGpm.toFixed(0)}
          </div>
        </div>
        <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs text-neutral-400">XPM Medio</div>
          <div className="text-2xl font-semibold text-white">
            {data.avgXpm.toFixed(0)}
          </div>
        </div>
        <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs text-neutral-400">
            Dead Gold (medio/match)
          </div>
          <div className="text-2xl font-semibold text-white">
            {data.deadGold.toFixed(0)}
          </div>
        </div>
        <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs text-neutral-400">Item Timing (3 core)</div>
          <div className="text-2xl font-semibold text-white">N/A</div>
          <div className="text-[10px] text-neutral-500">Non disponibile</div>
        </div>
      </div>

      {/* GPM Timeline Chart */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Profilo GPM per minuto (approssimato)
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Nota: Profilo sintetico basato su GPM medio (OpenDota Tier-1 non
          fornisce dati per minuto)
        </p>
        {gpmTimelineData.length > 0 ? (
          <div className="h-64">
            <MultiLineChart
              data={gpmTimelineData}
              width={800}
              height={256}
              lines={[{ key: 'gpm', color: '#f59e0b', label: 'GPM' }]}
            />
          </div>
        ) : (
          <div className="text-sm text-neutral-400">
            Dati non disponibili per questa metrica nel dataset di test.
          </div>
        )}
      </div>

      {/* GPM Comparison Chart */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Confronto GPM: Ultimi 10 match vs Media generale
        </h2>
        {comparisonChart.length > 0 ? (
          <div className="h-64">
            <BarChart
              data={comparisonChart}
              width={800}
              height={256}
              showValues={true}
            />
          </div>
        ) : (
          <div className="text-sm text-neutral-400">
            Dati non disponibili per questa metrica nel dataset di test.
          </div>
        )}
      </div>

      {/* Interpretation */}
      <ExplanationCard
        title="Come interpretare questi dati"
        description="Analisi dell'efficienza di farm e economy"
        interpretation="GPM: Efficienza di farm. Soglie: Pos1: >550, Pos2: >500, Pos3: >450, Pos4/5: >300. GPM basso indica problemi di farm o troppe morti. XPM: Esperienza per minuto. XPM basso rispetto al GPM indica guadagno gold ma non esperienza. Dead Gold: Gold perso in morte. Target: <500 gold/match per core, <300 per support. Item Timing: Tempo per 3 item core. Timing lento indica farm inefficiente o morti eccessive."
      />
    </div>
  )
}
