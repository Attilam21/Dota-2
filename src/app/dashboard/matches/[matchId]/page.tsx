export default function MatchDetailPage({ params }: { params: { matchId: string } }) {
	const { matchId } = params

	return (
		<div className="space-y-3">
			<h1 className="text-2xl font-semibold">Dettaglio partita</h1>
			<p className="text-neutral-300">
				Dettaglio partita {matchId} – in costruzione. In futuro includerà analisi avanzate
				del match, grafici, timeline degli eventi e performance dei giocatori.
			</p>
		</div>
	)
}


