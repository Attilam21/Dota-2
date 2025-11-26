'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ImportMatchButton() {
  const [matchId, setMatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleImport = async () => {
    if (!matchId || isNaN(Number(matchId))) {
      setError('Inserisci un Match ID valido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Import match
      const importResponse = await fetch(`/api/opendota/import-match?match_id=${matchId}`);
      if (!importResponse.ok) throw new Error('Errore import match');

      // Build digest
      const digestResponse = await fetch('/api/opendota/build-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: Number(matchId) }),
      });

      if (!digestResponse.ok) throw new Error('Errore build digest');

      // Refresh page
      router.refresh();
      setMatchId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={matchId}
        onChange={(e) => setMatchId(e.target.value)}
        placeholder="Match ID"
        className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        onKeyPress={(e) => e.key === 'Enter' && handleImport()}
      />
      <button
        onClick={handleImport}
        disabled={loading}
        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
      >
        {loading ? 'Import...' : 'Importa Partita'}
      </button>
      {error && (
        <span className="text-red-400 text-sm">{error}</span>
      )}
    </div>
  );
}

