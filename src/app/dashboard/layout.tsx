import type { ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/Header'

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-neutral-950 text-white flex">
			<Sidebar />
			<div className="flex-1 flex flex-col">
				<DashboardHeader />
				<main className="flex-1 p-6">
					{children}
				</main>
			</div>
		</div>
	)
}


