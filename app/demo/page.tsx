'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoPage() {
  const [playerId, setPlayerId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLoadPlayer = async () => {
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
      // Salva in sessionStorage
      sessionStorage.setItem('demo_player_id', playerId);
      sessionStorage.setItem('demo_account_id', playerId); // Per compatibilità

      // Vai direttamente a dashboard senza API call
      router.push(`/dashboard?demo=true&player_id=${playerId}`);
    } catch (err) {
      setError('Errore: ' + (err instanceof Error ? err.message : 'Unknown'));
      setLoading(false);
    }
  };

  const handleLoadMatch = async () => {
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
      router.push(`/dashboard?demo=true&match_id=${matchId}`);
    } catch (err) {
      setError('Errore: ' + (err instanceof Error ? err.message : 'Unknown'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">🎮 DOTA 2 Analytics Demo</h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          Accedi direttamente senza login - Inserisci un ID per iniziare
        </p>

        {/* Option 1: Player ID */}
        <div className="space-y-6 mb-8 pb-8 border-b border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              OpenDota Player ID
            </label>
            <input
              type="text"
              placeholder="es: 957204049"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleLoadPlayer();
                }
              }}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Trova il tuo ID su: <a href="https://www.opendota.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">opendota.com</a>
            </p>
          </div>
          <button
            onClick={handleLoadPlayer}
            disabled={loading || !playerId}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Caricamento...' : '📊 Analizza Giocatore'}
          </button>
        </div>

        {/* Option 2: Match ID */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Match ID (alternativa)
            </label>
            <input
              type="text"
              placeholder="es: 3559037317"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleLoadMatch();
                }
              }}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              ID della partita su OpenDota
            </p>
          </div>
          <button
            onClick={handleLoadMatch}
            disabled={loading || !matchId}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Caricamento...' : '🎯 Analizza Partita'}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-500">
            🚀 Demo mode - Nessun login richiesto
          </p>
          <a
            href="/login"
            className="text-xs text-purple-400 hover:text-purple-300 underline"
          >
            Oppure accedi con account
          </a>
        </div>
      </div>
    </div>
  );
}

