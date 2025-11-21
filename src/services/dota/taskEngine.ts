/**
 * Task Engine - Motore statico per generazione e valutazione Task
 *
 * Questo modulo contiene le logiche statiche (non IA) per:
 * - Generare task basati sui KPI
 * - Valutare task rispetto ai progressi del giocatore
 */

import type {
  PlayerOverviewKPI,
  StyleOfPlayKPI,
  HeroPoolKPI,
} from './kpiService'
import type { TaskEvaluationKPIs } from '@/domain/dota/tasks/taskKpiMappings'
import { buildTaskFromKpi } from '@/domain/dota/tasks/taskKpiMappings'
import type { DotaTask } from '@/domain/dota/tasks/taskKpiMappings'

/**
 * Snapshot aggregato dei KPI per un giocatore
 * Usato per generare task
 */
export interface PlayerKpiSnapshot {
  overview: PlayerOverviewKPI
  styleOfPlay: StyleOfPlayKPI
  heroPool: HeroPoolKPI
  // Aggiungi altri KPI se necessario
}

/**
 * Genera task per un giocatore basandosi sui KPI
 *
 * @param playerId - Account ID Dota 2 del giocatore
 * @param kpiSnapshot - Snapshot aggregato dei KPI
 * @returns Array di definizioni Task pronte per essere salvate
 */
export function buildTasksFromKpi(
  playerId: string,
  kpiSnapshot: TaskEvaluationKPIs,
): DotaTask[] {
  // Usa la funzione esistente buildTaskFromKpi
  return buildTaskFromKpi(playerId, kpiSnapshot)
}

/**
 * Valuta se un task è completato o fallito basandosi sui KPI attuali
 *
 * @param taskType - Tipo di task da valutare
 * @param originalKpiPayload - KPI al momento della creazione del task
 * @param currentKpiValues - KPI attuali
 * @param params - Parametri/soglie del task
 * @returns Oggetto con isCompleted e isFailed
 */
export function evaluateTaskStatus(
  taskType: string,
  originalKpiPayload: Record<string, number>,
  currentKpiValues: Record<string, number>,
  params: Record<string, number>,
): { isCompleted: boolean; isFailed: boolean } {
  let isCompleted = false
  let isFailed = false

  switch (taskType) {
    case 'REDUCE_EARLY_DEATHS': {
      const current = currentKpiValues.earlyDeathsAvg ?? 0
      const target = params.earlyDeathsAvg ?? 1.5
      const original = originalKpiPayload.earlyDeathsAvg ?? 0

      // Completato se raggiunge il target
      isCompleted = current <= target
      // Fallito se peggiora significativamente
      isFailed = !isCompleted && current > original + 1.0
      break
    }

    case 'INCREASE_KP': {
      const current = currentKpiValues.fightParticipation ?? 0
      const target = params.fightParticipation ?? 50
      const original = originalKpiPayload.fightParticipation ?? 0

      isCompleted = current >= target
      isFailed = !isCompleted && current < original - 5 && current < 30
      break
    }

    case 'IMPROVE_FARMING': {
      const currentGpm = currentKpiValues.avgGpm ?? 0
      const currentXpm = currentKpiValues.avgXpm ?? 0
      const targetGpm = params.avgGpm ?? 400
      const targetXpm = params.avgXpm ?? 500
      const originalGpm = originalKpiPayload.avgGpm ?? 0
      const originalXpm = originalKpiPayload.avgXpm ?? 0

      isCompleted = currentGpm >= targetGpm && currentXpm >= targetXpm
      isFailed =
        !isCompleted &&
        ((currentGpm < originalGpm - 50 && currentGpm < 300) ||
          (currentXpm < originalXpm - 50 && currentXpm < 400))
      break
    }

    case 'PLAY_MAIN_HERO': {
      const current = currentKpiValues.heroWinrate ?? 0
      const target = params.heroWinrate ?? 55
      const original = originalKpiPayload.heroWinrate ?? 0

      isCompleted = current >= target
      isFailed = !isCompleted && current < original - 10 && current < 40
      break
    }

    case 'IMPROVE_WINRATE': {
      const current = currentKpiValues.winRate ?? 0
      const target = params.winRate ?? 50
      const original = originalKpiPayload.winRate ?? 0

      isCompleted = current >= target
      isFailed = !isCompleted && current < original - 5 && current < 40
      break
    }

    case 'IMPROVE_CONSISTENCY': {
      // Logica per consistenza: confronta winrate recente vs globale
      const recentWinrate = currentKpiValues.winrateRecent ?? 0
      const globalWinrate = currentKpiValues.winrateGlobal ?? 0
      const kdaStdDev = currentKpiValues.kdaStdDev ?? 0

      // Completato se winrate recente >= globale e varianza KDA è bassa
      isCompleted = recentWinrate >= globalWinrate && kdaStdDev < 1.0
      // Fallito se winrate recente è molto peggio
      isFailed = recentWinrate < globalWinrate - 10
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
      const original = originalKpiPayload.kdaAvg ?? 0

      isCompleted = current >= target
      isFailed = !isCompleted && current < original - 0.5 && current < 1.0
      break
    }

    case 'REDUCE_DEATHS': {
      const current = currentKpiValues.avgDeaths ?? 0
      const target = params.avgDeaths ?? 5
      const original = originalKpiPayload.avgDeaths ?? 0

      isCompleted = current <= target
      isFailed = !isCompleted && current > original + 2 && current > 8
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
      // Task type non riconosciuto
      break
  }

  return { isCompleted, isFailed }
}
