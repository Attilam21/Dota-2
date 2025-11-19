export default function DashboardHeader() {
	return (
		<header className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between">
			<div className="flex items-center gap-3">
				<h2 className="text-sm font-semibold text-neutral-200 tracking-wide">
					FZTH Dota 2 Dashboard
				</h2>
			</div>
			<div className="flex items-center gap-4 text-neutral-400 text-xs">
				<div className="hidden md:block">
					{/* futura selezione account Dota (ID giocatore) */}
					Account: (seleziona giocatore)
				</div>
				<div className="hidden md:block">
					{/* futura selezione periodo (es. ultimi 30 giorni / ultimi 100 match) */}
					Periodo: Ultimi 30 giorni
				</div>
			</div>
		</header>
	)
}


