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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Farm & Economy</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Analisi dell&apos;efficienza di farm e economy: GPM, XPM, dead gold,
          item timing.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">GPM Medio</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.avgGpm.toFixed(0)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">XPM Medio</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.avgXpm.toFixed(0)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">
            Dead Gold (medio/match)
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.deadGold.toFixed(0)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">Item Timing (3 core)</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.avgItemTiming
              ? `${data.avgItemTiming.toFixed(0)} min`
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* GPM Timeline Chart */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Profilo GPM per minuto (media)
        </h2>
        {gpmTimelineData.length > 0 ? (
          <MultiLineChart
            data={gpmTimelineData}
            width={800}
            height={200}
            lines={[{ key: 'gpm', color: '#f59e0b', label: 'GPM' }]}
          />
        ) : (
          <div className="text-sm text-neutral-500">Dati non disponibili</div>
        )}
      </div>

      {/* GPM Comparison Chart */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Confronto GPM: Ultimi 10 match vs Media generale
        </h2>
        {comparisonChart.length > 0 ? (
          <BarChart
            data={comparisonChart}
            width={800}
            height={200}
            showValues={true}
          />
        ) : (
          <div className="text-sm text-neutral-500">Dati non disponibili</div>
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
