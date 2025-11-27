'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoPage() {
  const [playerId, setPlayerId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLoadPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) {
      setError('Inserisci un ID giocatore');
      return;
    }

    const playerIdNum = parseInt(playerId, 10);
    if (isNaN(playerIdNum) || playerIdNum <= 0) {
      setError('Inserisci un ID giocatore valido (numero positivo)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      sessionStorage.setItem('demo_player_id', playerId);
      sessionStorage.setItem('demo_mode', 'true');
      router.push(`/dashboard?mode=demo&player_id=${playerId}`);
    } catch (err) {
      setError('Errore: ' + (err instanceof Error ? err.message : 'Unknown'));
      setLoading(false);
    }
  };

  const handleLoadMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId) {
      setError('Inserisci un ID partita');
      return;
    }

    const matchIdNum = parseInt(matchId, 10);
    if (isNaN(matchIdNum) || matchIdNum <= 0) {
      setError('Inserisci un ID partita valido (numero positivo)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      sessionStorage.setItem('demo_match_id', matchId);
      sessionStorage.setItem('demo_mode', 'true');
      router.push(`/dashboard?mode=demo&match_id=${matchId}`);
    } catch (err) {
      setError('Errore: ' + (err instanceof Error ? err.message : 'Unknown'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">🎮 DOTA 2 Analytics</h1>
        <p className="text-gray-400 text-center mb-8">Modalità Demo - Nessun Login Richiesto</p>

        {/* Player ID Section */}
        <form onSubmit={handleLoadPlayer} className="space-y-4 mb-8 pb-8 border-b border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📊 OpenDota Player ID
            </label>
            <input
              type="text"
              placeholder="es: 957204049"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Trova il tuo ID su:{' '}
              <a
                href="https://www.opendota.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                opendota.com
              </a>
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 transition-all"
          >
            {loading ? '⏳ Caricamento...' : '📊 Analizza Giocatore'}
          </button>
        </form>

        {/* Match ID Section */}
        <form onSubmit={handleLoadMatch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🎯 Match ID (alternativa)
            </label>
            <input
              type="text"
              placeholder="es: 3559037317"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">ID della partita su OpenDota</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 transition-all"
          >
            {loading ? '⏳ Caricamento...' : '🎯 Analizza Partita'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            ❌ {error}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-500 space-y-1">
          <p>✅ Demo mode attiva</p>
          <p>✅ Dati da OpenDota API</p>
          <p>✅ Costruisci UI pezzo a pezzo</p>
        </div>
      </div>
    </div>
  );
}
