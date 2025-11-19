import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const playerIdParam = searchParams.get('playerId')

	if (!playerIdParam) {
		return NextResponse.json({ error: 'Missing playerId' }, { status: 400 })
	}

	const playerId = Number(playerIdParam)

	try {
		const supabase = createServerClient(cookies())
		const { data, error } = await supabase
			.from('matches_digest')
			.select('*')
			.eq('player_account_id', playerId)
			.order('start_time', { ascending: false })

		if (error) throw new Error(error.message)
		return NextResponse.json(data ?? [])
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? 'List error' }, { status: 500 })
	}
}


