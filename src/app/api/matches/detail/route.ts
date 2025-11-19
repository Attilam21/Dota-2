import { NextResponse } from 'next/server'
import { fetchFromOpenDota } from '@/utils/opendota'

type KillLog = { time: number }

type OpenDotaMatch = {
  match_id: number
  duration: number
  start_time: number
  lobby_type?: number
  game_mode?: number
  avg_rank_tier?: number
  radiant_win: boolean
  radiant_gold_adv?: number[] | null
  players: Array<{
    account_id: number | null
    player_slot: number
    hero_id: number
    kills: number
    deaths: number
    assists: number
    last_hits?: number
    denies?: number
    gold_per_min?: number
    xp_per_min?: number
    hero_damage?: number
    tower_damage?: number
    hero_healing?: number
    lane?: string | number | null
    role?: string | null
    kills_log?: KillLog[]
  }>
}

export type MatchDetailResponse = {
  match: {
    matchId: number
    durationSeconds: number
    startTime: string
    radiantWin: boolean
    mode?: number
    lobbyType?: number
    avgRankTier?: number
  }
  player: {
    accountId: number
    heroId: number
    kills: number
    deaths: number
    assists: number
    lastHits?: number
    denies?: number
    gpm?: number
    xpm?: number
    heroDamage?: number
    towerDamage?: number
    heroHealing?: number
    kda: number
    lane?: string | number | null
    role?: string | null
  }
  timeline: {
    goldDiffSeries: Array<{ minute: number; goldDiff: number }>
    killsByInterval: Array<{
      minuteFrom: number
      minuteTo: number
      teamKills: number
      enemyKills: number
    }>
  }
}

function toISO(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString()
}

function aggregateKillsByIntervals(
  players: OpenDotaMatch['players'],
  playerSlotOfTarget: number,
  durationSeconds: number,
) {
  const interval = 600 // seconds
  const numBuckets = Math.max(1, Math.ceil(durationSeconds / interval))
  const buckets = Array.from({ length: numBuckets }, (_, i) => ({
    minuteFrom: i * 10,
    minuteTo: Math.min((i + 1) * 10, Math.ceil(durationSeconds / 60)),
    teamKills: 0,
    enemyKills: 0,
  }))

  const isTargetRadiant = playerSlotOfTarget < 128

  players.forEach((p) => {
    const isSameTeam = p.player_slot < 128 === isTargetRadiant
    const logs = p.kills_log ?? []

    logs.forEach((log) => {
      // validate log structure
      if (
        !log ||
        typeof (log as any).time !== 'number' ||
        !Number.isFinite((log as any).time) ||
        (log as any).time < 0
      ) {
        return
      }

      const rawIdx = Math.floor((log as any).time / interval)
      if (!Number.isFinite(rawIdx)) {
        return
      }

      const bucketIdx = Math.max(0, Math.min(rawIdx, numBuckets - 1))
      const bucket = buckets[bucketIdx]
      if (!bucket) return

      if (isSameTeam) {
        bucket.teamKills += 1
      } else {
        bucket.enemyKills += 1
      }
    })
  })

  return buckets
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  const playerId = searchParams.get('playerId')

  if (!matchId || !playerId) {
    return NextResponse.json(
      { error: 'Missing matchId or playerId' },
      { status: 400 },
    )
  }

  try {
    const data = await fetchFromOpenDota<OpenDotaMatch>(`/matches/${matchId}`)

    const player = data.players.find((p) => p.account_id === Number(playerId))
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found in match' },
        { status: 404 },
      )
    }

    const kda = (player.kills + player.assists) / Math.max(1, player.deaths)

    const goldSeries =
      data.radiant_gold_adv?.map((g, idx) => ({
        minute: idx,
        goldDiff: g ?? 0,
      })) ?? []

    const killsTimeline = aggregateKillsByIntervals(
      data.players,
      player.player_slot,
      data.duration,
    )

    const response: MatchDetailResponse = {
      match: {
        matchId: data.match_id,
        durationSeconds: data.duration,
        startTime: toISO(data.start_time),
        radiantWin: data.radiant_win,
        mode: data.game_mode,
        lobbyType: data.lobby_type,
        avgRankTier: data.avg_rank_tier,
      },
      player: {
        accountId: Number(playerId),
        heroId: player.hero_id,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        lastHits: player.last_hits,
        denies: player.denies,
        gpm: player.gold_per_min,
        xpm: player.xp_per_min,
        heroDamage: player.hero_damage,
        towerDamage: player.tower_damage,
        heroHealing: player.hero_healing,
        kda,
        lane: player.lane,
        role: player.role,
      },
      timeline: {
        goldDiffSeries: goldSeries,
        killsByInterval: killsTimeline,
      },
    }

    return NextResponse.json(response)
  } catch (e: any) {
    console.error('MATCH_DETAIL_ERROR', e?.message ?? e)
    return NextResponse.json(
      { error: e?.message ?? 'Match detail error' },
      { status: 502 },
    )
  }
}
