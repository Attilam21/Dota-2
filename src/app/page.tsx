import Link from 'next/link'

export default function Home() {
	return (
		<div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
			<div className="max-w-2xl text-center">
				<h1 className="text-3xl md:text-5xl font-bold tracking-tight">
					FZTH – Dota 2 Dashboard (MVP)
				</h1>
				<p className="mt-3 text-neutral-300 md:text-lg">
					Piattaforma di analisi e coaching per giocatori di Dota 2.
				</p>
				<div className="mt-8 flex items-center justify-center gap-4">
					<Link
						href="/dashboard"
						className="inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 font-medium text-neutral-900 hover:bg-neutral-200 transition-colors"
					>
						Entra nella Dashboard
					</Link>
					<Link
						href="/login"
						className="inline-flex items-center justify-center rounded-md border border-neutral-700 px-5 py-2.5 font-medium text-white hover:bg-neutral-900 transition-colors"
					>
						Login / Registrati
					</Link>
				</div>
			</div>
		</div>
	)
}
