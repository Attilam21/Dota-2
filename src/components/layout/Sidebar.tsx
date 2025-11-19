'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
	{ label: 'Panoramica', href: '/dashboard' },
	{ label: 'Profilo giocatore', href: '/dashboard/player-profile' },
	{ label: 'Partite', href: '/dashboard/matches' },
	{ label: 'Eroi', href: '/dashboard/heroes' },
	{ label: 'Team & compagni', href: '/dashboard/teams-peers' },
	{ label: 'Storico & progressi', href: '/dashboard/progression' },
	{ label: 'Esplora dati', href: '/dashboard/explorer' },
	{ label: 'Profilazione FZTH', href: '/dashboard/profiling' },
	{ label: 'Coaching & task', href: '/dashboard/coaching' },
	{ label: 'Impostazioni account', href: '/dashboard/settings' },
]

export default function Sidebar() {
	const pathname = usePathname()

	return (
		<aside className="w-64 border-r border-neutral-800 px-4 py-6">
			<div className="mb-6 px-2 text-sm font-semibold tracking-wide text-neutral-300">
				Sezioni
			</div>
			<nav className="space-y-1">
				{navItems.map((item) => {
					const isActive = pathname === item.href
					return (
						<Link
							key={item.href}
							href={item.href}
							aria-current={isActive ? 'page' : undefined}
							className={[
								'block rounded-md px-3 py-2 text-sm transition-colors',
								isActive
									? 'bg-neutral-900 text-white'
									: 'text-neutral-300 hover:text-white hover:bg-neutral-900/60',
							].join(' ')}
						>
							{item.label}
						</Link>
					)
				})}
			</nav>
		</aside>
	)
}


