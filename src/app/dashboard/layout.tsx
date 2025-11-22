import type { ReactNode } from 'react'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/Header'
import { getActivePlayerAccount } from '@/lib/fzth/user/getActivePlayerAccount'
import { UserModeSwitcher } from '@/components/layout/UserModeSwitcher'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  // Get active player account (always Demo mode)
  const activePlayer = await getActivePlayerAccount()

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      <Sidebar />
      <div className="relative flex flex-1 flex-col">
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/assets/fzth-dota-hero-bg.jpg)',
            backgroundPosition: 'center top',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'rgb(10, 10, 10)', // Fallback color
          }}
        >
          {/* Dark overlay for readability - ridotto opacità per mostrare l'immagine */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 via-neutral-950/40 to-neutral-950/50" />
        </div>

        {/* Content above background */}
        <div className="relative z-10 flex flex-1 flex-col">
          <Suspense
            fallback={
              <div className="flex h-16 items-center border-b border-neutral-800 px-6">
                Caricamento…
              </div>
            }
          >
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <DashboardHeader />
              <UserModeSwitcher activePlayer={activePlayer} />
            </div>
          </Suspense>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
