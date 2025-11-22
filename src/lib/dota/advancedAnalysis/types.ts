/**
 * Types for Advanced Analysis module
 */

export interface LaneAnalysis {
  // KPI
  laneWinrate: number // % di lane "vinte"
  avgCsAt10: number // CS medio a 10 minuti
  avgXpAt10: number // XP medio a 10 minuti
  firstBloodInvolvement: number // % match con first blood involvement
  // Data per grafici
  csTimeline: Array<{ matchId: number; csAt10: number; date: string }>
  laneResults: Array<{
    lane: string
    result: 'win' | 'even' | 'loss'
    count: number
  }>
}

export interface FarmEconomyAnalysis {
  // KPI
  avgGpm: number // GPM medio ultimi N match
  avgXpm: number // XPM medio
  deadGold: number // Gold perso in morte (stimato)
  avgItemTiming: number | null // Tempo medio per 3 item core (se disponibile)
  // Data per grafici
  gpmTimeline: Array<{ minute: number; avgGpm: number }> // Profilo GPM per minuto
  gpmComparison: Array<{ period: string; gpm: number; xpm: number }>
}

export interface FightsDamageAnalysis {
  // KPI
  killParticipation: number // % media
  damageShare: number // % del damage totale del team
  avgTowerDamage: number // Tower damage medio per match
  avgTeamfightsParticipated: number // Numero medio teamfight/match
  // Data per grafici
  damageVsKp: Array<{ matchId: number; damage: number; kp: number }>
  teamfightImpact: Array<{
    phase: string
    participation: number
    impact: number
  }>
  damageProfile: { damageDone: number; damageTaken: number }
}

export interface VisionMapAnalysis {
  // KPI
  avgWardsPlaced: number // Wards piazzate/match
  avgWardsRemoved: number // Wards rimosse/match
  wardsByPhase: { early: number; mid: number; late: number }
  // Data per grafici
  wardsTimeline: Array<{ date: string; wardsPlaced: number }>
  wardsHeatmap: Array<{ x: number; y: number; count: number }> // Grid 10x10
}
