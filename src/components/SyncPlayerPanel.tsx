'use client'

import React, { useState } from 'react'

type SyncPlayerPanelProps = {
  onSyncCompleted?: () => void
}

export default function SyncPlayerPanel({
  onSyncCompleted,
}: SyncPlayerPanelProps) {
  const [playerId, setPlayerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSync() {
    if (!playerId.trim()) {
      setError('Inserisci un ID valido')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(
        `/api/fzth/sync-player?playerId=${encodeURIComponent(playerId)}`,
      )
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Errore durante la sincronizzazione')
      }

      setSuccess(true)
      setPlayerId('') // Clear input on success
      if (onSyncCompleted) {
        onSyncCompleted()
      }
    } catch (e: any) {
      setError(e.message || 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
      <h3 className="mb-4 text-lg font-medium text-white">
        Sincronizza dati giocatore
      </h3>
      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          placeholder="Inserisci ID Dota 2 (es. 36771694)"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          disabled={loading}
        />
        <button
          onClick={handleSync}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Sincronizzazione...' : 'Sincronizza'}
        </button>
      </div>

      {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

      {success && (
        <div className="mt-3 text-sm text-green-400">
          Sincronizzazione completata con successo!
        </div>
      )}
    </div>
  )
}
