import Link from 'next/link'
import { getRecentMatches, type RecentMatch, formatUnixSecondsToLocaleString } from '@/utils/opendota'

const DEMO_DOTA_ACCOUNT_ID = 86745912

function computeResult(match: RecentMatch): 'win' | 'lose' {
	const isRadiant = match.player_slot < 128
	return isRadiant === match.radiant_win ? 'win' : 'lose'
}

export default async function MatchesPage() {
	const recentMatches = await getRecentMatches(DEMO_DOTA_ACCOUNT_ID, 10)

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-semibold">Partite recenti (OpenDota – placeholder)</h1>
				<p className="text-neutral-300 text-sm">
					Dati reali, nessun caching o stato. In futuro useremo TanStack Query.
				</p>
			</div>

			<div className="overflow-x-auto rounded-lg border border-neutral-800">
				<table className="min-w-full text-sm">
					<thead className="bg-neutral-900/60 text-neutral-300">
						<tr>
							<th className="px-3 py-2 text-left font-medium">Match ID</th>
							<th className="px-3 py-2 text-left font-medium">Eroe</th>
							<th className="px-3 py-2 text-left font-medium">K / D / A</th>
							<th className="px-3 py-2 text-left font-medium">Durata (min)</th>
							<th className="px-3 py-2 text-left font-medium">Inizio</th>
							<th className="px-3 py-2 text-left font-medium">Risultato</th>
						</tr>
					</thead>
					<tbody>
						{recentMatches.map((m) => {
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
									<td className="px-3 py-2">{formatUnixSecondsToLocaleString(m.start_time)}</td>
									<td className="px-3 py-2">
										<span className={result === 'win' ? 'text-green-400' : 'text-red-400'}>
											{result}
										</span>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</div>
	)
}


