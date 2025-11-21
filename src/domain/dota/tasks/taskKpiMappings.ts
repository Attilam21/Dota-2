/**
 * Mapping tra KPI calcolati e definizioni di Task
 *
 * Questo file mappa i KPI prodotti da kpiService alle tipologie di Task
 * che possono essere generati automaticamente in base ai valori dei KPI.
 */

import {
  TASK_DEFINITIONS,
  type DotaTaskType,
  type DotaTaskDefinition,
} from './taskTypes'
import type {
  PlayerOverviewKPI,
  MomentumKPI,
  HeroPoolKPI,
  StyleOfPlayKPI,
} from '@/services/dota/kpiService'

/**
 * Interfaccia per i KPI aggregati necessari per valutare i Task
 */
export interface TaskEvaluationKPIs {
  overview?: PlayerOverviewKPI
  momentum?: MomentumKPI
  heroPool?: HeroPoolKPI
  styleOfPlay?: StyleOfPlayKPI
}

/**
 * Valuta quali Task dovrebbero essere generati in base ai KPI
 */
export function evaluateTasks(
  kpis: TaskEvaluationKPIs,
): Array<DotaTaskDefinition> {
  const tasks: Array<DotaTaskDefinition> = []

  const { overview, momentum, heroPool, styleOfPlay } = kpis

  // REDUCE_EARLY_DEATHS
  if (styleOfPlay?.earlyDeathsAvg && styleOfPlay.earlyDeathsAvg > 1.5) {
    tasks.push({
      ...TASK_DEFINITIONS.REDUCE_EARLY_DEATHS,
      kpiKeys: ['earlyDeathsAvg'],
    })
  }

  // INCREASE_KP
  if (styleOfPlay?.fightParticipation && styleOfPlay.fightParticipation < 50) {
    tasks.push({
      ...TASK_DEFINITIONS.INCREASE_KP,
      kpiKeys: ['fightParticipation'],
    })
  }

  // IMPROVE_FARMING
  if (
    styleOfPlay?.farmingEfficiency &&
    (styleOfPlay.farmingEfficiency.avgGpm < 400 ||
      styleOfPlay.farmingEfficiency.avgXpm < 500)
  ) {
    tasks.push({
      ...TASK_DEFINITIONS.IMPROVE_FARMING,
      kpiKeys: ['avgGpm', 'avgXpm'],
    })
  }

  // PLAY_MAIN_HERO
  if (heroPool?.top5ByWinrate && heroPool.top5ByWinrate.length > 0) {
    const topHero = heroPool.top5ByWinrate[0]
    if (topHero.winRate < 55 && topHero.matches >= 5) {
      tasks.push({
        ...TASK_DEFINITIONS.PLAY_MAIN_HERO,
        kpiKeys: ['heroWinrate'],
      })
    }
  }

  // IMPROVE_WINRATE
  if (overview?.winRate && overview.winRate < 50) {
    tasks.push({
      ...TASK_DEFINITIONS.IMPROVE_WINRATE,
      kpiKeys: ['winRate'],
    })
  }

  // INCREASE_AGGRESSIVITY
  if (styleOfPlay?.killsPerMinute && styleOfPlay.killsPerMinute < 0.4) {
    tasks.push({
      ...TASK_DEFINITIONS.INCREASE_AGGRESSIVITY,
      kpiKeys: ['killsPerMinute'],
    })
  }

  // IMPROVE_KDA
  if (overview?.kdaAvg && overview.kdaAvg < 2.0) {
    tasks.push({
      ...TASK_DEFINITIONS.IMPROVE_KDA,
      kpiKeys: ['kdaAvg'],
    })
  }

  // REDUCE_DEATHS
  if (overview?.avgDeaths && overview.avgDeaths > 5) {
    tasks.push({
      ...TASK_DEFINITIONS.REDUCE_DEATHS,
      kpiKeys: ['avgDeaths'],
    })
  }

  // INCREASE_OBJECTIVE_DAMAGE
  if (styleOfPlay?.avgTowerDamage && styleOfPlay.avgTowerDamage < 2000) {
    tasks.push({
      ...TASK_DEFINITIONS.INCREASE_OBJECTIVE_DAMAGE,
      kpiKeys: ['avgTowerDamage'],
    })
  }

  // IMPROVE_HERO_POOL
  if (heroPool?.heroes && heroPool.heroes.length < 10) {
    tasks.push({
      ...TASK_DEFINITIONS.IMPROVE_HERO_POOL,
      kpiKeys: ['distinctHeroes'],
    })
  }

  // Ordina per priorità
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  tasks.sort((a, b) => {
    const aPriority = a.priority || 'medium'
    const bPriority = b.priority || 'medium'
    return priorityOrder[aPriority] - priorityOrder[bPriority]
  })

  return tasks
}

/**
 * Ottiene i valori KPI necessari per valutare un task specifico
 */
export function getKpiValuesForTask(
  taskType: DotaTaskType,
  kpis: TaskEvaluationKPIs,
): Record<string, number> {
  const values: Record<string, number> = {}
  // Ottieni i kpiKeys dal task valutato (non dalla definizione base)
  const evaluatedTasks = evaluateTasks(kpis)
  const taskDef = evaluatedTasks.find((t) => t.type === taskType)

  if (!taskDef) {
    return values
  }

  for (const kpiKey of taskDef.kpiKeys || []) {
    // Mappa le chiavi KPI ai valori effettivi
    switch (kpiKey) {
      case 'earlyDeathsAvg':
        values[kpiKey] = kpis.styleOfPlay?.earlyDeathsAvg ?? 0
        break
      case 'fightParticipation':
        values[kpiKey] = kpis.styleOfPlay?.fightParticipation ?? 0
        break
      case 'avgGpm':
        values[kpiKey] = kpis.styleOfPlay?.farmingEfficiency?.avgGpm ?? 0
        break
      case 'avgXpm':
        values[kpiKey] = kpis.styleOfPlay?.farmingEfficiency?.avgXpm ?? 0
        break
      case 'heroWinrate':
        values[kpiKey] = kpis.heroPool?.top5ByWinrate?.[0]?.winRate ?? 0
        break
      case 'winRate':
        values[kpiKey] = kpis.overview?.winRate ?? 0
        break
      case 'killsPerMinute':
        values[kpiKey] = kpis.styleOfPlay?.killsPerMinute ?? 0
        break
      case 'kdaAvg':
        values[kpiKey] = kpis.overview?.kdaAvg ?? 0
        break
      case 'avgDeaths':
        values[kpiKey] = kpis.overview?.avgDeaths ?? 0
        break
      case 'avgTowerDamage':
        values[kpiKey] = kpis.styleOfPlay?.avgTowerDamage ?? 0
        break
      case 'distinctHeroes':
        values[kpiKey] = kpis.heroPool?.heroes?.length ?? 0
        break
      default:
        values[kpiKey] = 0
    }
  }

  return values
}

/**
 * Interfaccia per un Task completo pronto per essere salvato
 */
export interface DotaTask {
  type: DotaTaskType
  title: string
  description: string
  kpiKeys: string[]
  kpiPayload: Record<string, number> // Snapshot dei valori KPI al momento della creazione
  params: Record<string, number> // Parametri/soglie del task
  priority?: 'high' | 'medium' | 'low'
}

/**
 * Costruisce una lista di Task da uno snapshot di KPI
 *
 * @param playerId - Account ID Dota 2 del giocatore
 * @param kpiSnapshot - Snapshot aggregato dei KPI calcolati
 * @returns Array di Task pronti per essere salvati
 */
export function buildTaskFromKpi(
  playerId: string,
  kpiSnapshot: TaskEvaluationKPIs,
): DotaTask[] {
  // Usa evaluateTasks per ottenere le definizioni
  const taskDefinitions = evaluateTasks(kpiSnapshot)

  // Converti le definizioni in Task completi con payload KPI
  const tasks: DotaTask[] = taskDefinitions.map((def) => {
    // Ottieni i valori KPI attuali per questo task
    const kpiValues = getKpiValuesForTask(def.type, kpiSnapshot)

    // Costruisci il payload KPI
    const kpiPayload: Record<string, number> = {}
    for (const key of def.kpiKeys || []) {
      kpiPayload[key] = kpiValues[key] ?? 0
    }

    // Costruisci i parametri (soglie target)
    const params: Record<string, number> = {}
    if (def.suggestedThresholds) {
      for (const [key, value] of Object.entries(def.suggestedThresholds)) {
        params[key] = value
      }
    }

    return {
      type: def.type,
      title: def.title,
      description: def.description,
      kpiKeys: def.kpiKeys || [],
      kpiPayload,
      params,
      priority: def.priority,
    }
  })

  return tasks
}
