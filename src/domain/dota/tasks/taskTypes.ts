/**
 * Tipi di Task per il sistema di coaching Dota 2
 *
 * Questi task sono "Task-ready" e possono essere generati automaticamente
 * in base ai KPI calcolati dal kpiService.
 */

export type DotaTaskType =
  | 'REDUCE_EARLY_DEATHS'
  | 'INCREASE_KP'
  | 'IMPROVE_FARMING'
  | 'PLAY_MAIN_HERO'
  | 'IMPROVE_WINRATE'
  | 'INCREASE_AGGRESSIVITY'
  | 'IMPROVE_KDA'
  | 'REDUCE_DEATHS'
  | 'INCREASE_OBJECTIVE_DAMAGE'
  | 'IMPROVE_HERO_POOL'

export interface DotaTaskDefinition {
  type: DotaTaskType
  title: string
  description: string
  kpiKeys: string[] // Chiavi KPI che alimentano questo task
  suggestedThresholds?: Record<string, number> // Soglie consigliate per valutare il task
  priority?: 'high' | 'medium' | 'low'
}

/**
 * Mappa dei tipi di task con le loro definizioni base
 */
export const TASK_DEFINITIONS: Record<
  DotaTaskType,
  Omit<DotaTaskDefinition, 'kpiKeys'>
> = {
  REDUCE_EARLY_DEATHS: {
    type: 'REDUCE_EARLY_DEATHS',
    title: 'Riduci le morti early game',
    description:
      'Migliora la tua sopravvivenza nei primi 10 minuti di gioco per avere un impatto maggiore nella partita.',
    suggestedThresholds: {
      earlyDeathsAvg: 1.5, // Obiettivo: meno di 1.5 morti early per partita
    },
    priority: 'high',
  },
  INCREASE_KP: {
    type: 'INCREASE_KP',
    title: 'Aumenta la partecipazione ai fight',
    description:
      'Partecipa di più agli scontri di squadra per aumentare le tue possibilità di vittoria.',
    suggestedThresholds: {
      fightParticipation: 50, // Obiettivo: almeno 50% di KP
    },
    priority: 'high',
  },
  IMPROVE_FARMING: {
    type: 'IMPROVE_FARMING',
    title: 'Migliora il farming',
    description:
      'Aumenta GPM e XPM per essere più efficace nelle partite e avere più impatto.',
    suggestedThresholds: {
      avgGpm: 400, // Obiettivo: almeno 400 GPM
      avgXpm: 500, // Obiettivo: almeno 500 XPM
    },
    priority: 'medium',
  },
  PLAY_MAIN_HERO: {
    type: 'PLAY_MAIN_HERO',
    title: 'Gioca i tuoi eroi migliori',
    description:
      'Concentrati sugli eroi con cui hai le migliori prestazioni per massimizzare le vittorie.',
    suggestedThresholds: {
      heroWinrate: 55, // Obiettivo: almeno 55% winrate sugli eroi principali
    },
    priority: 'medium',
  },
  IMPROVE_WINRATE: {
    type: 'IMPROVE_WINRATE',
    title: 'Migliora il winrate generale',
    description:
      'Aumenta la percentuale di vittorie complessiva per migliorare il tuo ranking.',
    suggestedThresholds: {
      winRate: 50, // Obiettivo: almeno 50% winrate
    },
    priority: 'high',
  },
  INCREASE_AGGRESSIVITY: {
    type: 'INCREASE_AGGRESSIVITY',
    title: "Aumenta l'aggressività",
    description:
      'Essere più aggressivo può portare a più kill e a controllare meglio la mappa.',
    suggestedThresholds: {
      killsPerMinute: 0.4, // Obiettivo: almeno 0.4 kill/minuto
    },
    priority: 'low',
  },
  IMPROVE_KDA: {
    type: 'IMPROVE_KDA',
    title: 'Migliora il KDA',
    description:
      'Un KDA migliore indica prestazioni più consistenti e un impatto maggiore nelle partite.',
    suggestedThresholds: {
      kdaAvg: 2.0, // Obiettivo: almeno 2.0 KDA medio
    },
    priority: 'medium',
  },
  REDUCE_DEATHS: {
    type: 'REDUCE_DEATHS',
    title: 'Riduci le morti',
    description:
      'Meno morti significano meno gold dato al nemico e più tempo in campo per avere impatto.',
    suggestedThresholds: {
      avgDeaths: 5, // Obiettivo: meno di 5 morti medie per partita
    },
    priority: 'high',
  },
  INCREASE_OBJECTIVE_DAMAGE: {
    type: 'INCREASE_OBJECTIVE_DAMAGE',
    title: 'Aumenta i danni agli obiettivi',
    description:
      'Focalizzati su torri e obiettivi per chiudere le partite più velocemente.',
    suggestedThresholds: {
      avgTowerDamage: 2000, // Obiettivo: almeno 2000 danni alle torri per partita
    },
    priority: 'medium',
  },
  IMPROVE_HERO_POOL: {
    type: 'IMPROVE_HERO_POOL',
    title: 'Amplia il pool di eroi',
    description:
      'Avere più eroi competenti ti rende più versatile e difficile da contrastare.',
    suggestedThresholds: {
      distinctHeroes: 10, // Obiettivo: almeno 10 eroi diversi giocati
    },
    priority: 'low',
  },
}
