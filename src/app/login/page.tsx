/**
 * Login Page
 *
 * Entry point for Steam login and Demo mode
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'

export default function Login({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  const enterDemoMode = async () => {
    'use server'
    // Redirect to dashboard - getActivePlayerAccount() will automatically use demo mode
    redirect('/dashboard')
  }

  const signInWithSteam = async () => {
    'use server'
    // TODO: Implement Steam OAuth login
    // For now, this is a placeholder
    // When Steam OAuth is configured, this should:
    // 1. Redirect to Steam OAuth URL
    // 2. Handle callback in /api/auth/callback
    // 3. Create/update fzth_users record
    // 4. Redirect to dashboard

    // Placeholder: show message that Steam login is not yet configured
    redirect('/login?message=Steam login is not yet configured')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-neutral-800 bg-neutral-900/80 p-8 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-100">
            FZTH Dota 2 Dashboard
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Accedi per vedere le tue analisi e migliorare le tue performance
          </p>
        </div>

        {searchParams?.message && (
          <div className="rounded-lg border border-yellow-800/50 bg-yellow-900/20 p-3 text-sm text-yellow-300">
            {searchParams.message}
          </div>
        )}

        <div className="space-y-4">
          {/* Steam Login Button */}
          <form action={signInWithSteam}>
            <button
              type="submit"
              disabled
              className="w-full rounded-md border border-blue-600/50 bg-blue-950/30 px-4 py-3 text-sm font-semibold text-blue-300 transition-all hover:border-blue-500 hover:bg-blue-950/50 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Accedi con Steam
            </button>
            <p className="mt-1 text-center text-xs text-neutral-500">
              Login Steam in configurazione
            </p>
          </form>

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
              <strong>Login Steam:</strong> Accedi con il tuo account Steam per
              vedere le tue partite reali
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
