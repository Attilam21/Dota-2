import type { ReactNode } from 'react'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/Header'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Suspense
          fallback={
            <div className="flex h-16 items-center border-b border-neutral-800 px-6">
              Caricamento…
            </div>
          }
        >
          <DashboardHeader />
        </Suspense>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
