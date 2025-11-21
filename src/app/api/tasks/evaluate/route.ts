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
import { evaluateTaskStatus } from '@/services/dota/taskEngine'

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

      // Usa il task engine per valutare lo status
      const { isCompleted, isFailed } = evaluateTaskStatus(
        taskType,
        originalKpiPayload,
        currentKpiValues,
        params,
      )

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
      error: null,
    })
  } catch (error: any) {
    console.error('Error in tasks/evaluate:', error)
    return NextResponse.json({
      message: 'Errore nella valutazione dei task',
      completed: 0,
      failed: 0,
      stillOpen: 0,
      tasks: [],
      error: error?.message ?? 'Error evaluating tasks',
    })
  }
}
