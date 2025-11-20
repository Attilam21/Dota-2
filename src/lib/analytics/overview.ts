export type PerformanceIndexInput = {
  winRatePercent: number // 0..100
  kdaAvg: number
}

export function computePerformanceIndex(input: PerformanceIndexInput): number {
  const winRateNorm = Math.max(
    0,
    Math.min(1, (input.winRatePercent ?? 0) / 100),
  )
  const kdaNorm = Math.max(0, Math.min(1, (input.kdaAvg ?? 0) / 10)) // clamp KDA to 10
  const score = winRateNorm * 0.6 + kdaNorm * 0.4
  return Math.round(score * 100)
}

export function classifyPerformanceLevel(
  pi: number,
): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
  if (pi >= 80) return 'Platinum'
  if (pi >= 60) return 'Gold'
  if (pi >= 40) return 'Silver'
  return 'Bronze'
}

export type MomentumInfo = {
  last10: Array<'win' | 'lose'>
  last5Wr: number
  prev5Wr: number
  trend: 'up' | 'flat' | 'down' | 'na'
}

export function buildMomentum(
  resultsDesc: Array<'win' | 'lose'>,
): MomentumInfo {
  const last10 = resultsDesc.slice(0, 10)
  const last5 = last10.slice(0, 5)
  const prev5 = last10.slice(5, 10)
  const wr = (arr: Array<'win' | 'lose'>) =>
    arr.length === 0
      ? 0
      : Math.round((arr.filter((r) => r === 'win').length / arr.length) * 100)
  const last5Wr = wr(last5)
  const prev5Wr = wr(prev5)
  let trend: MomentumInfo['trend'] = 'na'
  if (last5.length < 5 || prev5.length < 5) {
    trend = 'na'
  } else if (last5Wr > prev5Wr + 5) {
    trend = 'up'
  } else if (last5Wr < prev5Wr - 5) {
    trend = 'down'
  } else {
    trend = 'flat'
  }
  return { last10, last5Wr, prev5Wr, trend }
}

export type StrengthCard = {
  type: 'strength' | 'weakness'
  title: string
  description: string
}

export function buildStrengthsAndWeaknesses(
  allMatches: Array<{
    kills: number
    deaths: number
    assists: number
    duration_seconds: number
    result: 'win' | 'lose'
  }>,
): StrengthCard[] {
  if (allMatches.length === 0) return []
  const total = allMatches.length
  const avgDeaths = allMatches.reduce((a, m) => a + (m.deaths ?? 0), 0) / total
  const avgKdaWin = averageKda(allMatches.filter((m) => m.result === 'win'))
  const avgKdaLose = averageKda(allMatches.filter((m) => m.result === 'lose'))
  const avgDurWin =
    allMatches
      .filter((m) => m.result === 'win')
      .reduce((a, m) => a + (m.duration_seconds ?? 0), 0) /
    Math.max(1, allMatches.filter((m) => m.result === 'win').length) /
    60
  const avgDurLose =
    allMatches
      .filter((m) => m.result === 'lose')
      .reduce((a, m) => a + (m.duration_seconds ?? 0), 0) /
    Math.max(1, allMatches.filter((m) => m.result === 'lose').length) /
    60

  const cards: StrengthCard[] = []
  if (avgDeaths > 8) {
    cards.push({
      type: 'weakness',
      title: 'Area da migliorare: sopravvivenza',
      description:
        'Numero medio di morti elevato: lavora su posizionamento e map awareness.',
    })
  } else {
    cards.push({
      type: 'strength',
      title: 'Punto di forza: gestione rischi',
      description:
        'Morti contenute: buona gestione del posizionamento negli scontri.',
    })
  }

  if (avgKdaWin > avgKdaLose * 1.6) {
    cards.push({
      type: 'weakness',
      title: 'Efficienza in calo nelle sconfitte',
      description:
        'La tua efficienza (KDA) cala molto quando perdi: prova a mantenere impatto anche da dietro.',
    })
  } else {
    cards.push({
      type: 'strength',
      title: 'Consistenza di performance',
      description:
        'Mantenimento di un KDA relativamente stabile tra vittorie e sconfitte.',
    })
  }

  if (avgDurWin + 8 < avgDurLose) {
    cards.push({
      type: 'strength',
      title: 'Chiudi in fretta per vincere',
      description:
        'Vinchi più spesso quando le partite sono brevi: spingi per obiettivi rapidi.',
    })
  } else if (avgDurLose + 8 < avgDurWin) {
    cards.push({
      type: 'weakness',
      title: 'Difficoltà a chiudere rapidamente',
      description:
        'Meglio gestire le fasi mid/late per evitare che le partite si allunghino troppo.',
    })
  }

  return cards.slice(0, 3)
}

function averageKda(
  ms: Array<{ kills: number; deaths: number; assists: number }>,
): number {
  if (ms.length === 0) return 0
  const sK = ms.reduce((a, m) => a + (m.kills ?? 0), 0)
  const sD = ms.reduce((a, m) => a + (m.deaths ?? 0), 0)
  const sA = ms.reduce((a, m) => a + (m.assists ?? 0), 0)
  return (sK + sA) / Math.max(1, sD)
}

export type HeroSnapshot = {
  heroId: number
  matches: number
  wins: number
  winRate: number
  kdaAvg: number
}

export function buildHeroSnapshot(
  allMatches: Array<{
    hero_id: number
    result: 'win' | 'lose'
    kills: number
    deaths: number
    assists: number
  }>,
  limit = 5,
): HeroSnapshot[] {
  const map = new Map<
    number,
    {
      matches: number
      wins: number
      sumKills: number
      sumDeaths: number
      sumAssists: number
    }
  >()
  for (const r of allMatches) {
    const cur = map.get(r.hero_id) ?? {
      matches: 0,
      wins: 0,
      sumKills: 0,
      sumDeaths: 0,
      sumAssists: 0,
    }
    cur.matches += 1
    if (r.result === 'win') cur.wins += 1
    cur.sumKills += r.kills ?? 0
    cur.sumDeaths += r.deaths ?? 0
    cur.sumAssists += r.assists ?? 0
    map.set(r.hero_id, cur)
  }
  const list: HeroSnapshot[] = Array.from(map.entries()).map(([heroId, v]) => ({
    heroId,
    matches: v.matches,
    wins: v.wins,
    winRate: Math.round((v.wins / Math.max(1, v.matches)) * 100),
    kdaAvg: Number(
      ((v.sumKills + v.sumAssists) / Math.max(1, v.sumDeaths)).toFixed(2),
    ),
  }))
  list.sort((a, b) => b.matches - a.matches)
  return list.slice(0, limit)
}
