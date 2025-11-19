import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import { fetchFromOpenDota, type RecentMatch } from '@/utils/opendota'

function computeResult(m: RecentMatch): 'win' | 'lose' {
	const isRadiant = m.player_slot < 128
	return isRadiant === m.radiant_win ? 'win' : 'lose'
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const playerId = searchParams.get('playerId')

	if (!playerId) {
		return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
	}

	try {
		const recent = await fetchFromOpenDota<RecentMatch[]>(`/players/${playerId}/recentMatches`)

		const rows = recent.map((m) => ({
			player_account_id: Number(playerId),
			match_id: m.match_id,
			hero_id: m.hero_id,
			kills: m.kills,
			deaths: m.deaths,
			assists: m.assists,
			duration_seconds: m.duration,
			start_time: new Date(m.start_time * 1000).toISOString(),
			result: computeResult(m),
			lane: null as string | null,
			role: null as string | null,
			kda: (m.kills + m.assists) / Math.max(1, m.deaths),
			updated_at: new Date().toISOString(),
		}))

		const supabase = createServerClient(cookies())
		const { error } = await supabase
			.from('matches_digest')
			.upsert(rows, { onConflict: 'player_account_id,match_id' })

		if (error) {
			throw new Error(error.message)
		}

		return NextResponse.json({ count: rows.length, playerId })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? 'Sync error' }, { status: 500 })
	}
}


