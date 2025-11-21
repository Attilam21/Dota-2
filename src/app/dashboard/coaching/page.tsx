'use client'

import React, { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'

type TaskStatus = 'open' | 'completed' | 'failed'

interface DotaTask {
  id: string
  player_id: string
  type: string
  title: string
  description: string
  status: TaskStatus
  kpi_payload: Record<string, number>
  params: Record<string, number>
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export default function CoachingPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={<div className="p-6 text-neutral-400">Caricamento task…</div>}
    >
      <CoachingContent />
    </Suspense>
  )
}

function CoachingContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [tasks, setTasks] = useState<DotaTask[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [generating, setGenerating] = useState<boolean>(false)
  const [evaluating, setEvaluating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      setMessage(null)
      const res = await fetch(`/api/tasks/list?playerId=${playerId}`, {
        cache: 'no-store',
      })

      // Anche se la risposta non è ok, prova a leggere il JSON
      const responseData = await res
        .json()
        .catch(() => ({ tasks: [], error: 'Errore di parsing' }))

      // Il formato atteso è { tasks: [...], error: null | "..." }
      if (responseData.tasks !== undefined) {
        setTasks(responseData.tasks || [])
        // Mostra errore solo se c'è un errore E non ci sono task
        if (responseData.error && responseData.tasks.length === 0) {
          setError(responseData.error)
        } else if (responseData.error) {
          // Se ci sono task ma c'è anche un errore, mostra solo un warning
          setMessage(`Attenzione: ${responseData.error}`)
        }
      } else {
        // Fallback per formato vecchio (array diretto)
        if (Array.isArray(responseData)) {
          setTasks(responseData)
        } else {
          throw new Error(responseData?.error || `HTTP ${res.status}`)
        }
      }
    } catch (e: any) {
      console.error('Error loading tasks:', e)
      setError(e?.message ?? 'Errore nel caricamento dei task')
      setTasks([]) // Assicura che tasks sia sempre un array
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [playerId])

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError(null)
      setMessage(null)
      const res = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: String(playerId), limit: 20 }),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg?.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setMessage(data.message || 'Task generati con successo')
      await loadTasks()
    } catch (e: any) {
      setError(e?.message ?? 'Errore nella generazione dei task')
    } finally {
      setGenerating(false)
    }
  }

  const handleEvaluate = async () => {
    try {
      setEvaluating(true)
      setError(null)
      setMessage(null)
      const res = await fetch('/api/tasks/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: String(playerId), limit: 20 }),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg?.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setMessage(data.message || 'Task valutati con successo')
      await loadTasks()
    } catch (e: any) {
      setError(e?.message ?? 'Errore nella valutazione dei task')
    } finally {
      setEvaluating(false)
    }
  }

  const getStatusBadge = (status: TaskStatus) => {
    const styles = {
      open: 'bg-blue-900/40 text-blue-300',
      completed: 'bg-green-900/40 text-green-300',
      failed: 'bg-red-900/40 text-red-300',
    }
    const labels = {
      open: 'Aperto',
      completed: 'Completato',
      failed: 'Fallito',
    }
    return (
      <span className={`rounded px-2 py-1 text-xs ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const formatKpiSummary = (task: DotaTask): string => {
    const kpiKeys = Object.keys(task.kpi_payload || {})
    if (kpiKeys.length === 0) return 'Nessun KPI disponibile'

    const summaries = kpiKeys.map((key) => {
      const current = task.kpi_payload[key] ?? 0
      const target = task.params[key]
      if (target !== undefined) {
        // Formatta in modo più leggibile
        const keyLabel = getKpiLabel(key)
        return `${keyLabel}: ${formatKpiValue(
          key,
          current,
        )} → Target: ${formatKpiValue(key, target)}`
      }
      return `${getKpiLabel(key)}: ${formatKpiValue(key, current)}`
    })

    return summaries.join(' • ')
  }

  const getKpiLabel = (key: string): string => {
    const labels: Record<string, string> = {
      earlyDeathsAvg: 'Morti early (media)',
      fightParticipation: 'KP%',
      avgGpm: 'GPM medio',
      avgXpm: 'XPM medio',
      heroWinrate: 'Winrate eroe principale',
      winRate: 'Winrate generale',
      killsPerMinute: 'Kill/minuto',
      kdaAvg: 'KDA medio',
      avgDeaths: 'Morti medie',
      avgTowerDamage: 'Danni alle torri',
      distinctHeroes: 'Eroi distinti',
    }
    return labels[key] || key
  }

  const formatKpiValue = (key: string, value: number): string => {
    if (
      key.includes('winrate') ||
      key.includes('Winrate') ||
      key.includes('Participation')
    ) {
      return `${value.toFixed(1)}%`
    }
    if (key.includes('PerMin') || key.includes('PerMinute')) {
      return value.toFixed(2)
    }
    if (key.includes('Damage') || key.includes('Gpm') || key.includes('Xpm')) {
      return Math.round(value).toLocaleString('it-IT')
    }
    return value.toFixed(1)
  }

  // Raggruppa task per categoria
  const groupedTasks = useMemo(() => {
    const groups: Record<string, DotaTask[]> = {
      performance: [],
      farming: [],
      aggression: [],
      consistency: [],
      heroPool: [],
      other: [],
    }

    tasks.forEach((task) => {
      const type = task.type.toLowerCase()
      if (type.includes('early') || type.includes('death')) {
        groups.performance.push(task)
      } else if (
        type.includes('farm') ||
        type.includes('gpm') ||
        type.includes('lh')
      ) {
        groups.farming.push(task)
      } else if (
        type.includes('kp') ||
        type.includes('fight') ||
        type.includes('aggress')
      ) {
        groups.aggression.push(task)
      } else if (type.includes('consist') || type.includes('winrate')) {
        groups.consistency.push(task)
      } else if (type.includes('hero') || type.includes('pool')) {
        groups.heroPool.push(task)
      } else {
        groups.other.push(task)
      }
    })

    return groups
  }, [tasks])

  const categoryLabels: Record<string, string> = {
    performance: 'Performance & Sopravvivenza',
    farming: 'Farming & Economia',
    aggression: 'Aggressività & Fight',
    consistency: 'Consistenza & Winrate',
    heroPool: 'Hero Pool',
    other: 'Altri',
  }

  return (
    <div className="space-y-4 text-white">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Coaching & Task</h1>
        <p className="text-sm text-neutral-400">
          Piani di allenamento, checklist operative e task consigliati per il
          miglioramento continuo.
        </p>
        <p className="text-xs text-neutral-500">Player #{playerId}</p>
      </div>

      {/* Messaggi */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-800 bg-green-900/20 p-4 text-green-300">
          {message}
        </div>
      )}

      {/* Azioni */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          disabled={generating || evaluating}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? 'Generazione in corso...' : 'Genera nuovi Task'}
        </button>
        <button
          onClick={handleEvaluate}
          disabled={generating || evaluating}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {evaluating
            ? 'Valutazione in corso...'
            : 'Valuta Task con le ultime partite'}
        </button>
        <button
          onClick={loadTasks}
          disabled={loading || generating || evaluating}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Aggiorna lista
        </button>
      </div>

      {/* Lista Task */}
      {loading && <div className="text-neutral-400">Caricamento task…</div>}

      {!loading && !error && tasks.length === 0 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 text-center text-neutral-300 backdrop-blur-sm">
          <p className="mb-4">Nessun task disponibile.</p>
          <p className="text-sm text-neutral-400">
            Clicca su &quot;Genera nuovi Task&quot; per creare task basati sui
            tuoi KPI attuali.
          </p>
        </div>
      )}

      {!loading && error && tasks.length === 0 && (
        <div className="rounded-lg border border-yellow-800 bg-yellow-900/40 p-4 text-center backdrop-blur-sm">
          <p className="mb-2 font-medium text-yellow-300">
            ⚠️ Attenzione: {error}
          </p>
          <p className="text-sm text-yellow-200/80">
            Se la tabella dota_tasks non esiste, esegui la migration SQL in
            supabase/migrations/20251125_create_dota_tasks.sql
          </p>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(
            ([category, categoryTasks]: [string, DotaTask[]]) => {
              if (categoryTasks.length === 0) return null
              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-300">
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="space-y-3">
                    {categoryTasks.map((task: DotaTask) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-neutral-200">
                                {task.title}
                              </h3>
                              {getStatusBadge(task.status)}
                            </div>
                            <p className="mb-2 text-sm text-neutral-300">
                              {task.description}
                            </p>
                            <div className="mb-2 text-xs text-neutral-400">
                              Basato su KPI:{' '}
                              {Object.keys(task.kpi_payload || {})
                                .map((k) => getKpiLabel(k))
                                .join(', ')}
                            </div>
                            <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 backdrop-blur-sm">
                              <div className="mb-1 text-xs font-medium text-neutral-300">
                                Dettagli KPI:
                              </div>
                              <div className="text-xs text-neutral-400">
                                {formatKpiSummary(task)}
                              </div>
                            </div>
                            <div className="mt-3">
                              <Link
                                href="/dashboard/performance#style-of-play"
                                className="text-xs text-blue-400 hover:underline"
                              >
                                Vai al grafico correlato →
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-neutral-800 pt-3">
                          <div className="text-xs text-neutral-500">
                            Creato:{' '}
                            {new Date(task.created_at).toLocaleString('it-IT', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                            {task.resolved_at && (
                              <>
                                {' '}
                                · Risolto:{' '}
                                {new Date(task.resolved_at).toLocaleString(
                                  'it-IT',
                                  {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  },
                                )}
                              </>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500">
                            Tipo: {task.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            },
          )}
        </div>
      )}

      {/* Statistiche */}
      {!loading && tasks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="text-xs text-neutral-400">Task aperti</div>
            <div className="text-2xl font-semibold">
              {tasks.filter((t) => t.status === 'open').length}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="text-xs text-neutral-400">Task completati</div>
            <div className="text-2xl font-semibold text-green-400">
              {tasks.filter((t) => t.status === 'completed').length}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="text-xs text-neutral-400">Task falliti</div>
            <div className="text-2xl font-semibold text-red-400">
              {tasks.filter((t) => t.status === 'failed').length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
