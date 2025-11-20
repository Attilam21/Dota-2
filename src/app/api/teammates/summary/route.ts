import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { fetchFromOpenDota } from '@/utils/opendota'

type DigestRow = {
  match_id: number
  player_account_id: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
  result?: 'win' | 'lose'
  start_time: string
}

type OpenDotaMatch = {
  match_id: number
  duration: number
  radiant_win: boolean
  players: Array<{
    account_id: number | null
    player_slot: number
    hero_id: number
    kills: number
    deaths: number
    assists: number
  }>
}

type TeammateAgg = {
  accountId: number | null
  matches: number
  wins: number
  totalKills: number
  totalDeaths: number
  totalAssists: number
}

type TeammateSummary = {
  accountId: number | null
  label: string
  matches: number
  winrate: number
  avgKda: number
}

type TeammatesSummaryResponse = {
  totalMatchesConsidered: number
  uniqueTeammates: number
  topByMatches: TeammateSummary | null
  topByWinrate: TeammateSummary | null
  worstByWinrate: TeammateSummary | null
  teammates: TeammateSummary[]
}

// Numero massimo di partite più recenti considerate per il riepilogo compagni.
// Usiamo un limite per contenere le chiamate a OpenDota, senza riferimento a giorni.
const MAX_TEAM_MATCHES = 50

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')
  const playerIdNum = Number(playerIdParam)
  if (!playerIdParam || !Number.isFinite(playerIdNum)) {
    return NextResponse.json(
      { error: 'Missing or invalid playerId' },
      { status: 400 },
    )
  }
  try {
    const supabase = createServerClient(cookies())
    const { data, error } = await supabase
      .from('matches_digest')
      .select('*')
      .eq('player_account_id', playerIdNum)
      .order('start_time', { ascending: false })
      .limit(MAX_TEAM_MATCHES)

    if (error) {
      throw new Error(error.message)
    }

    const rows = (data ?? []) as DigestRow[]
    if (rows.length === 0) {
      const empty: TeammatesSummaryResponse = {
        totalMatchesConsidered: 0,
        uniqueTeammates: 0,
        topByMatches: null,
        topByWinrate: null,
        worstByWinrate: null,
        teammates: [],
      }
      return NextResponse.json(empty)
    }

    const digestByMatchId = new Map<number, DigestRow>()
    for (const r of rows) digestByMatchId.set(r.match_id, r)

    const matchIds = rows.map((r) => r.match_id)

    // Fetch match details from OpenDota; simple concurrency control (batches of 10)
    const fetchMatch = async (id: number): Promise<OpenDotaMatch | null> => {
      try {
        const m = await fetchFromOpenDota<OpenDotaMatch>(`/matches/${id}`)
        return m ?? null
      } catch {
        return null
      }
    }
    const batchSize = 10
    const details: (OpenDotaMatch | null)[] = []
    for (let i = 0; i < matchIds.length; i += batchSize) {
      const slice = matchIds.slice(i, i + batchSize)
      // eslint-disable-next-line no-await-in-loop
      const chunk = await Promise.all(slice.map((id) => fetchMatch(id)))
      details.push(...chunk)
    }

    const aggByTeammate = new Map<number, TeammateAgg>()
    let matchesUsed = 0

    for (let i = 0; i < matchIds.length; i++) {
      const od = details[i]
      const digest = digestByMatchId.get(matchIds[i])
      if (!od || !digest) continue
      const player = od.players.find(
        (p) => (p.account_id ?? null) === playerIdNum,
      )
      if (!player) continue
      matchesUsed += 1
      const isRadiant = player.player_slot < 128
      const teammates = od.players.filter(
        (p) =>
          p.player_slot < 128 === isRadiant &&
          (p.account_id ?? null) !== playerIdNum,
      )
      const isWin = digest.result === 'win'
      for (const tm of teammates) {
        const key = (tm.account_id ?? -1) as number
        const cur =
          aggByTeammate.get(key) ??
          ({
            accountId: tm.account_id ?? null,
            matches: 0,
            wins: 0,
            totalKills: 0,
            totalDeaths: 0,
            totalAssists: 0,
          } as TeammateAgg)
        cur.matches += 1
        if (isWin) cur.wins += 1
        // accumulate our player's stats for the match
        cur.totalKills += player.kills ?? 0
        cur.totalDeaths += player.deaths ?? 0
        cur.totalAssists += player.assists ?? 0
        aggByTeammate.set(key, cur)
      }
    }

    const toSummary = (a: TeammateAgg): TeammateSummary => {
      const label =
        a.accountId && a.accountId > 0
          ? `Player #${a.accountId}`
          : 'Player anonimo'
      const winrate = Math.round((a.wins / Math.max(1, a.matches)) * 100)
      const avgKdaNum =
        (a.totalKills + a.totalAssists) / Math.max(1, a.totalDeaths)
      return {
        accountId: a.accountId,
        label,
        matches: a.matches,
        winrate,
        avgKda: Number(avgKdaNum.toFixed(2)),
      }
    }

    const teammates = Array.from(aggByTeammate.values())
      .map(toSummary)
      .sort((x, y) => y.matches - x.matches)

    const topByMatches = teammates[0] ?? null
    const eligible = teammates.filter((t) => t.matches >= 3)
    const topByWinrate =
      eligible.length > 0
        ? [...eligible].sort((a, b) => b.winrate - a.winrate)[0] ?? null
        : null
    const worstByWinrate =
      eligible.length > 0
        ? [...eligible].sort((a, b) => a.winrate - b.winrate)[0] ?? null
        : null

    const payload: TeammatesSummaryResponse = {
      totalMatchesConsidered: matchesUsed,
      uniqueTeammates: teammates.length,
      topByMatches,
      topByWinrate,
      worstByWinrate,
      teammates,
    }

    return NextResponse.json(payload)
  } catch (e: any) {
    // minimal logging for debug
    // eslint-disable-next-line no-console
    console.error('TEAMS_SUMMARY_ERROR', e)
    return NextResponse.json(
      {
        error: 'TEAMS_SUMMARY_ERROR',
        message: e?.message ?? 'Unexpected error',
      },
      { status: 502 },
    )
  }
}
