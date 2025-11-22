/**
 * Login Page
 *
 * Entry point for Demo mode (no login required)
 *
 * TODO: In futuro qui potrà essere reintrodotto un login reale (Steam/email).
 * Ora l'app gira solo in modalità demo.
 */

import { redirect } from 'next/navigation'

export default function Login({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  const enterDemoMode = async () => {
    'use server'
    // Redirect to dashboard - always uses demo mode
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-neutral-800 bg-neutral-900/80 p-8 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-100">
            FZTH Dota 2 Dashboard
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Esplora la dashboard in modalità demo
          </p>
        </div>

        {searchParams?.message && (
          <div className="rounded-lg border border-yellow-800/50 bg-yellow-900/20 p-3 text-sm text-yellow-300">
            {searchParams.message}
          </div>
        )}

        <div className="space-y-4">
          {/* Demo Mode Button */}
          <form action={enterDemoMode}>
            <button
              type="submit"
              className="w-full rounded-md border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-sm font-semibold text-neutral-300 transition-all hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-200"
            >
              Entra in modalità demo
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-xs text-neutral-400">
          <p className="mb-2 font-semibold text-neutral-300">Informazioni:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>Modalità Demo:</strong> Usa un profilo di test
              pre-caricato per esplorare la dashboard
            </li>
            <li>
              <strong>Nessun login richiesto:</strong> L&apos;app funziona
              completamente in modalità demo
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
