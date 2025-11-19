'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const TEST_PLAYER_ID = 86745912

type RecentMatch = {
	match_id: number
	hero_id: number
	kills: number
	deaths: number
	assists: number
	duration: number
	start_time: number
	player_slot: number
	radiant_win: boolean
}

function computeResult(match: RecentMatch): 'Vittoria' | 'Sconfitta' {
	const isRadiant = match.player_slot < 128
	return isRadiant === match.radiant_win ? 'Vittoria' : 'Sconfitta'
}

export default function MatchesPage() {
	const [data, setData] = useState<RecentMatch[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {
		let active = true
		async function load() {
			try {
				setLoading(true)
				const res = await fetch(`/api/opendota/recent-matches?playerId=${TEST_PLAYER_ID}`, { cache: 'no-store' })
				if (!res.ok) {
					const msg = await res.json().catch(() => ({}))
					throw new Error(msg?.error || `HTTP ${res.status}`)
				}
				const json: RecentMatch[] = await res.json()
				if (active) setData(json)
			} catch (e: any) {
				if (active) setError(e?.message ?? 'Errore sconosciuto')
			} finally {
				if (active) setLoading(false)
			}
		}
		load()
		return () => {
			active = false
		}
	}, [])

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-semibold">Partite recenti</h1>
				<p className="text-neutral-300 text-sm">
					Dati caricati tramite API interna (server-side) che chiama OpenDota.
				</p>
			</div>

			{loading && <div className="text-neutral-400">Caricamento partite recenti...</div>}
			{error && <div className="text-red-400">Errore nel caricamento delle partite: {error}</div>}

			{!loading && !error && data && (
				<div className="overflow-x-auto rounded-lg border border-neutral-800">
					<table className="min-w-full text-sm">
						<thead className="bg-neutral-900/60 text-neutral-300">
							<tr>
								<th className="px-3 py-2 text-left font-medium">Match ID</th>
								<th className="px-3 py-2 text-left font-medium">Eroe</th>
								<th className="px-3 py-2 text-left font-medium">K / D / A</th>
								<th className="px-3 py-2 text-left font-medium">Durata (min)</th>
								<th className="px-3 py-2 text-left font-medium">Risultato</th>
								<th className="px-3 py-2 text-left font-medium">Data</th>
							</tr>
						</thead>
						<tbody>
							{data.map((m) => {
								const durationMinutes = Math.round(m.duration / 60)
								const result = computeResult(m)
								return (
									<tr key={m.match_id} className="border-t border-neutral-800">
										<td className="px-3 py-2">
											<Link href={`/dashboard/match/${m.match_id}`} className="text-blue-400 hover:underline">
												{m.match_id}
											</Link>
										</td>
										<td className="px-3 py-2">{m.hero_id}</td>
										<td className="px-3 py-2">
											{m.kills} / {m.deaths} / {m.assists}
										</td>
										<td className="px-3 py-2">{durationMinutes}</td>
										<td className="px-3 py-2">
											<span className={result === 'Vittoria' ? 'text-green-400' : 'text-red-400'}>{result}</span>
										</td>
										<td className="px-3 py-2">{new Date(m.start_time * 1000).toLocaleString('it-IT')}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}


