import { computePerformanceIndex } from '@/lib/analytics/overview'

export type ProfileMatch = {
  matchId: number
  heroId: number
  result: 'win' | 'lose'
  k: number
  d: number
  a: number
  durationMinutes: number
  startTime: string
  lane?: string | null
  role?: string | null
}

export type PrimaryRoleResult = {
  primaryRole: string
  roleCounts: Array<{ role: string; matches: number }>
}

export function inferPrimaryRole(matches: ProfileMatch[]): PrimaryRoleResult {
  const counts = new Map<string, number>()
  for (const m of matches) {
    const key = (m.role ?? m.lane ?? 'N/D') as string
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const roleCounts = Array.from(counts.entries())
    .map(([role, matches]) => ({ role, matches }))
    .sort((a, b) => b.matches - a.matches)
  const primaryRole = roleCounts[0]?.role ?? 'Ruolo principale non determinato'
  return { primaryRole, roleCounts }
}

export function topHeroes(
  matches: ProfileMatch[],
  limit = 3,
): Array<{ heroId: number; matches: number; wins: number }> {
  const map = new Map<number, { matches: number; wins: number }>()
  for (const m of matches) {
    const cur = map.get(m.heroId) ?? { matches: 0, wins: 0 }
    cur.matches += 1
    if (m.result === 'win') cur.wins += 1
    map.set(m.heroId, cur)
  }
  const list = Array.from(map.entries()).map(([heroId, v]) => ({
    heroId,
    matches: v.matches,
    wins: v.wins,
  }))
  list.sort((a, b) => b.matches - a.matches)
  return list.slice(0, limit)
}

export function estimateFzthLevel(
  performanceScore: number,
  totalMatches: number,
): { level: number; progressPct: number } {
  const logBonus = Math.log10(Math.max(1, totalMatches) + 1) * 15
  const est = Math.min(100, Math.floor(performanceScore * 0.7 + logBonus))
  const progressPct = Math.max(0, Math.min(100, (est % 1) * 100))
  return { level: est, progressPct }
}

export function buildPerMatchPerformanceSeries(
  matchesDesc: ProfileMatch[],
  limit = 30,
): Array<{ idx: number; score: number }> {
  const sliced = matchesDesc.slice(0, limit).reverse()
  return sliced.map((m, i) => {
    const winComponent = m.result === 'win' ? 1 : 0
    const kdaNorm = Math.max(
      0,
      Math.min(1, (m.k + m.a) / Math.max(1, m.d) / 10),
    )
    const score = Math.round((winComponent * 0.6 + kdaNorm * 0.4) * 100)
    return { idx: i + 1, score }
  })
}

export function buildKdaRollingAverage(
  matchesDesc: ProfileMatch[],
  window = 5,
  limit = 30,
): Array<{ idx: number; kda: number }> {
  const sliced = matchesDesc.slice(0, limit).reverse()
  const res: Array<{ idx: number; kda: number }> = []
  for (let i = 0; i < sliced.length; i++) {
    const from = Math.max(0, i - window + 1)
    const seg = sliced.slice(from, i + 1)
    const k = seg.reduce((a, m) => a + m.k, 0)
    const d = seg.reduce((a, m) => a + m.d, 0)
    const a = seg.reduce((a, m) => a + m.a, 0)
    const kda = (k + a) / Math.max(1, d)
    res.push({ idx: i + 1, kda: Number(kda.toFixed(2)) })
  }
  return res
}

export type RoleSkillRow = {
  role: string
  matches: number
  winRate: number
  kdaAvg: number
}

export function buildRoleSkillIndex(matches: ProfileMatch[]): {
  rows: RoleSkillRow[]
  recommendedRole: string | null
} {
  const roles = new Map<
    string,
    { matches: number; wins: number; sumK: number; sumD: number; sumA: number }
  >()
  for (const m of matches) {
    const key = (m.role ?? m.lane ?? 'N/D') as string
    const cur = roles.get(key) ?? {
      matches: 0,
      wins: 0,
      sumK: 0,
      sumD: 0,
      sumA: 0,
    }
    cur.matches += 1
    if (m.result === 'win') cur.wins += 1
    cur.sumK += m.k
    cur.sumD += m.d
    cur.sumA += m.a
    roles.set(key, cur)
  }
  const rows: RoleSkillRow[] = Array.from(roles.entries()).map(([role, v]) => ({
    role,
    matches: v.matches,
    winRate: Math.round((v.wins / Math.max(1, v.matches)) * 100),
    kdaAvg: Number(((v.sumK + v.sumA) / Math.max(1, v.sumD)).toFixed(2)),
  }))
  rows.sort((a, b) => b.matches - a.matches)
  const recommendedRole = rows.length > 0 ? rows[0].role : null
  return { rows, recommendedRole }
}

export type Achievement = {
  code: string
  name: string
  description: string
  unlocked: boolean
}

export function buildAchievements(matchesDesc: ProfileMatch[]): Achievement[] {
  const list: Achievement[] = []
  const anyClutch = matchesDesc.some(
    (m) => (m.k + m.a) / Math.max(1, m.d) >= 10 && m.result === 'win',
  )
  list.push({
    code: 'clutch',
    name: 'Clutch Player',
    description: 'Almeno una partita vinta con KDA ≥ 10',
    unlocked: anyClutch,
  })
  const anyZeroDeath = matchesDesc.some((m) => m.d === 0)
  list.push({
    code: 'iron_wall',
    name: 'Iron Wall',
    description: 'Una partita senza morti',
    unlocked: anyZeroDeath,
  })
  const lastN = matchesDesc.slice(0, 20)
  const distinctHeroes = new Set(lastN.map((m) => m.heroId)).size
  list.push({
    code: 'versatile',
    name: 'Versatile',
    description: 'Almeno 6 eroi diversi nelle ultime 20 partite',
    unlocked: distinctHeroes >= 6,
  })
  let streak = 0
  let maxStreak = 0
  for (const m of matchesDesc) {
    if (m.result === 'win') {
      streak += 1
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 0
    }
  }
  list.push({
    code: 'streaker',
    name: 'Streaker',
    description: '3 o più vittorie consecutive',
    unlocked: maxStreak >= 3,
  })
  return list
}
