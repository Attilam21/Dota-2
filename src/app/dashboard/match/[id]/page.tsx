export default function MatchDetailPage({ params }: { params: { id: string } }) {
	const { id } = params

	return (
		<div className="space-y-3">
			<h1 className="text-2xl font-semibold">Dettaglio partita – ID: {id}</h1>
			<p className="text-neutral-300">
				Qui verranno inseriti grafici, timeline, statistiche, item timings e analisi avanzate della partita.
			</p>
		</div>
	)
}


