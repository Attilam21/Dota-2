import { NextResponse } from 'next/server'
import { fetchFromOpenDota, type RecentMatch } from '@/utils/opendota'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const playerId = searchParams.get('playerId')

	if (!playerId) {
		return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
	}

	try {
		const data = await fetchFromOpenDota<RecentMatch[]>(`/players/${playerId}/recentMatches`)
		// TEMP LOG per audit
		console.log('DOTA2_RAW_RESPONSE', JSON.stringify(data?.slice?.(0, 3) ?? data, null, 2))
		return NextResponse.json(data)
	} catch (error: any) {
		return NextResponse.json(
			{ error: error?.message ?? 'OpenDota error' },
			{ status: 500 },
		)
	}
}


