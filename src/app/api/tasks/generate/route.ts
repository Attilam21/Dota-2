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
import { buildTaskFromKpi } from '@/domain/dota/tasks/taskKpiMappings'
import type { TaskEvaluationKPIs } from '@/domain/dota/tasks/taskKpiMappings'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const playerId = body.playerId || String(DEFAULT_PLAYER_ID)
    const limit = body.limit || 20 // Numero di partite da considerare per i KPI

    // Calcola snapshot KPI sulle ultime N partite
    const [overview, momentum, heroPool, styleOfPlay] = await Promise.all([
      getPlayerOverviewKPI(Number(playerId), { limit }),
      getMomentumKPI(Number(playerId), { limit }),
      getHeroPoolKPI(Number(playerId), { limit }),
      getStyleOfPlayKPI(Number(playerId), { limit }),
    ])

    const kpiSnapshot: TaskEvaluationKPIs = {
      overview,
      momentum,
      heroPool,
      styleOfPlay,
    }

    // Genera Task dai KPI
    const taskDefinitions = buildTaskFromKpi(playerId, kpiSnapshot)

    if (taskDefinitions.length === 0) {
      return NextResponse.json({
        message: 'Nessun task da generare in base ai KPI attuali',
        tasks: [],
      })
    }

    const supabase = createServerClient(cookies())
    const createdTasks = []

    // Per ogni task, verifica se esiste già uno open dello stesso tipo
    for (const taskDef of taskDefinitions) {
      // Verifica se esiste già un task open dello stesso tipo
      const { data: existing } = await supabase
        .from('dota_tasks')
        .select('id')
        .eq('player_id', playerId)
        .eq('type', taskDef.type)
        .eq('status', 'open')
        .limit(1)

      // Se non esiste, crea il nuovo task
      if (!existing || existing.length === 0) {
        const { data: newTask, error } = await supabase
          .from('dota_tasks')
          .insert({
            player_id: playerId,
            type: taskDef.type,
            title: taskDef.title,
            description: taskDef.description,
            status: 'open',
            kpi_payload: taskDef.kpiPayload,
            params: taskDef.params,
          })
          .select()
          .single()

        if (error) {
          console.error(`Error creating task ${taskDef.type}:`, error)
          continue
        }

        createdTasks.push(newTask)
      }
    }

    // Recupera tutti i task open per questo player (inclusi quelli appena creati)
    const { data: allOpenTasks } = await supabase
      .from('dota_tasks')
      .select('*')
      .eq('player_id', playerId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      message: `Generati ${createdTasks.length} nuovi task, ${
        allOpenTasks?.length ?? 0
      } task aperti totali`,
      created: createdTasks.length,
      tasks: allOpenTasks || [],
    })
  } catch (error: any) {
    console.error('Error in tasks/generate:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Error generating tasks' },
      { status: 500 },
    )
  }
}
