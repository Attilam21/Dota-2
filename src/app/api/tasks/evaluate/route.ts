import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { DEFAULT_PLAYER_ID } from '@/lib/playerId'
import {
  getPlayerOverviewKPI,
  getMomentumKPI,
  getHeroPoolKPI,
  getStyleOfPlayKPI,
} from '@/services/dota/kpiService'
import type { TaskEvaluationKPIs } from '@/domain/dota/tasks/taskKpiMappings'
import { getKpiValuesForTask } from '@/domain/dota/tasks/taskKpiMappings'
import type { DotaTaskType } from '@/domain/dota/tasks/taskTypes'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const playerId = body.playerId || String(DEFAULT_PLAYER_ID)
    const limit = body.limit || 20

    const supabase = createServerClient(cookies())

    // Recupera tutti i task open per questo player
    const { data: openTasks, error: fetchError } = await supabase
      .from('dota_tasks')
      .select('*')
      .eq('player_id', playerId)
      .eq('status', 'open')

    if (fetchError) {
      console.error('Error fetching open tasks:', fetchError)
      return NextResponse.json(
        { error: 'Error fetching tasks', details: fetchError.message },
        { status: 500 },
      )
    }

    if (!openTasks || openTasks.length === 0) {
      return NextResponse.json({
        message: 'Nessun task aperto da valutare',
        completed: 0,
        failed: 0,
        stillOpen: 0,
        tasks: [],
      })
    }

    // Calcola KPI attuali (sulle ultime partite)
    const [overview, momentum, heroPool, styleOfPlay] = await Promise.all([
      getPlayerOverviewKPI(Number(playerId), { limit }),
      getMomentumKPI(Number(playerId), { limit }),
      getHeroPoolKPI(Number(playerId), { limit }),
      getStyleOfPlayKPI(Number(playerId), { limit }),
    ])

    const currentKpis: TaskEvaluationKPIs = {
      overview,
      momentum,
      heroPool,
      styleOfPlay,
    }

    let completedCount = 0
    let failedCount = 0
    const updatedTasks = []

    // Valuta ogni task
    for (const task of openTasks) {
      const taskType = task.type as DotaTaskType
      const originalKpiPayload =
        (task.kpi_payload as Record<string, number>) || {}
      const params = (task.params as Record<string, number>) || {}

      // Ottieni i valori KPI attuali per questo task
      const currentKpiValues = getKpiValuesForTask(taskType, currentKpis)

      // Valuta se il task è completato o fallito in base al tipo
      let isCompleted = false
      let isFailed = false

      switch (taskType) {
        case 'REDUCE_EARLY_DEATHS': {
          const current = currentKpiValues.earlyDeathsAvg ?? 0
          const target = params.earlyDeathsAvg ?? 1.5
          isCompleted = current <= target
          // Fallito se è peggiorato significativamente
          const original = originalKpiPayload.earlyDeathsAvg ?? 0
          isFailed = current > original + 1.0
          break
        }

        case 'INCREASE_KP': {
          const current = currentKpiValues.fightParticipation ?? 0
          const target = params.fightParticipation ?? 50
          isCompleted = current >= target
          const original = originalKpiPayload.fightParticipation ?? 0
          isFailed = current < original - 5 && current < 30
          break
        }

        case 'IMPROVE_FARMING': {
          const currentGpm = currentKpiValues.avgGpm ?? 0
          const currentXpm = currentKpiValues.avgXpm ?? 0
          const targetGpm = params.avgGpm ?? 400
          const targetXpm = params.avgXpm ?? 500
          isCompleted = currentGpm >= targetGpm && currentXpm >= targetXpm
          const originalGpm = originalKpiPayload.avgGpm ?? 0
          const originalXpm = originalKpiPayload.avgXpm ?? 0
          isFailed =
            (currentGpm < originalGpm - 50 && currentGpm < 300) ||
            (currentXpm < originalXpm - 50 && currentXpm < 400)
          break
        }

        case 'PLAY_MAIN_HERO': {
          const current = currentKpiValues.heroWinrate ?? 0
          const target = params.heroWinrate ?? 55
          isCompleted = current >= target
          const original = originalKpiPayload.heroWinrate ?? 0
          isFailed = current < original - 10 && current < 40
          break
        }

        case 'IMPROVE_WINRATE': {
          const current = currentKpiValues.winRate ?? 0
          const target = params.winRate ?? 50
          isCompleted = current >= target
          const original = originalKpiPayload.winRate ?? 0
          isFailed = current < original - 5 && current < 40
          break
        }

        case 'INCREASE_AGGRESSIVITY': {
          const current = currentKpiValues.killsPerMinute ?? 0
          const target = params.killsPerMinute ?? 0.4
          isCompleted = current >= target
          break
        }

        case 'IMPROVE_KDA': {
          const current = currentKpiValues.kdaAvg ?? 0
          const target = params.kdaAvg ?? 2.0
          isCompleted = current >= target
          const original = originalKpiPayload.kdaAvg ?? 0
          isFailed = current < original - 0.5 && current < 1.0
          break
        }

        case 'REDUCE_DEATHS': {
          const current = currentKpiValues.avgDeaths ?? 0
          const target = params.avgDeaths ?? 5
          isCompleted = current <= target
          const original = originalKpiPayload.avgDeaths ?? 0
          isFailed = current > original + 2 && current > 8
          break
        }

        case 'INCREASE_OBJECTIVE_DAMAGE': {
          const current = currentKpiValues.avgTowerDamage ?? 0
          const target = params.avgTowerDamage ?? 2000
          isCompleted = current >= target
          break
        }

        case 'IMPROVE_HERO_POOL': {
          const current = currentKpiValues.distinctHeroes ?? 0
          const target = params.distinctHeroes ?? 10
          isCompleted = current >= target
          break
        }

        default:
          // Task type non riconosciuto, non valutare
          continue
      }

      // Aggiorna il task se completato o fallito
      if (isCompleted || isFailed) {
        const { data: updated, error: updateError } = await supabase
          .from('dota_tasks')
          .update({
            status: isCompleted ? 'completed' : 'failed',
            resolved_at: new Date().toISOString(),
            kpi_payload: currentKpiValues, // Aggiorna con i KPI attuali
          })
          .eq('id', task.id)
          .select()
          .single()

        if (updateError) {
          console.error(`Error updating task ${task.id}:`, updateError)
          continue
        }

        if (isCompleted) completedCount++
        if (isFailed) failedCount++

        updatedTasks.push(updated)
      }
    }

    // Recupera i task ancora aperti
    const { data: stillOpen } = await supabase
      .from('dota_tasks')
      .select('*')
      .eq('player_id', playerId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      message: `Valutati ${
        openTasks.length
      } task: ${completedCount} completati, ${failedCount} falliti, ${
        stillOpen?.length ?? 0
      } ancora aperti`,
      completed: completedCount,
      failed: failedCount,
      stillOpen: stillOpen?.length ?? 0,
      tasks: updatedTasks,
    })
  } catch (error: any) {
    console.error('Error in tasks/evaluate:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Error evaluating tasks' },
      { status: 500 },
    )
  }
}
