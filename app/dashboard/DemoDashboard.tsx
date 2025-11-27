'use client';

import { useEffect, useState } from 'react';
import { DashboardClient } from './DashboardClient';

interface DemoData {
  type: 'player' | 'match';
  data: any;
}

export function DemoDashboard({ playerId, matchId }: { playerId: string | null; matchId: string | null }) {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playerId || matchId) {
      console.log('🎮 Demo Mode Attiva', { playerId, matchId });
      loadDemoData();
    } else {
      setLoading(false);
    }
  }, [playerId, matchId]);

  const loadDemoData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (playerId) {
        // Carica dati giocatore da OpenDota API
        const playerIdNum = parseInt(playerId, 10);
        if (isNaN(playerIdNum)) {
          throw new Error('Invalid player ID');
        }

        console.log('[DemoDashboard] Loading player data for:', playerIdNum);
        
        // Carica ultima partita del giocatore
        const matchesResponse = await fetch(
          `https://api.opendota.com/api/players/${playerIdNum}/matches?limit=1`
        );
        
        if (!matchesResponse.ok) {
          throw new Error(`Failed to load player matches: ${matchesResponse.status}`);
        }

        const matchesData = await matchesResponse.json();
        
        if (matchesData && matchesData.length > 0) {
          const lastMatchId = matchesData[0].match_id;
          
          // Carica dati partita
          const matchResponse = await fetch(
            `https://api.opendota.com/api/matches/${lastMatchId}`
          );
          
          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            setDemoData({ type: 'player', data: matchData });
            console.log('✅ Dati partita caricati:', matchData);
            
            // Salva match_id in sessionStorage per compatibilità
            sessionStorage.setItem('demo_match_id', String(lastMatchId));
            sessionStorage.setItem('demo_account_id', playerId);
          } else {
            setDemoData({ type: 'player', data: matchesData[0] });
          }
        } else {
          throw new Error('Nessuna partita trovata per questo giocatore');
        }
      } else if (matchId) {
        // Carica dati partita da OpenDota API
        const matchIdNum = parseInt(matchId, 10);
        if (isNaN(matchIdNum)) {
          throw new Error('Invalid match ID');
        }

        console.log('[DemoDashboard] Loading match data for:', matchIdNum);
        
        const response = await fetch(`https://api.opendota.com/api/matches/${matchIdNum}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load match: ${response.status}`);
        }

        const data = await response.json();
        setDemoData({ type: 'match', data });
        console.log('✅ Dati partita caricati:', data);
        
        // Salva in sessionStorage per compatibilità
        sessionStorage.setItem('demo_match_id', matchId);
      }
    } catch (err) {
      console.error('❌ Errore caricamento:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-white py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-xl">⏳ Caricamento dati da OpenDota...</p>
            <p className="text-gray-400 text-sm mt-2">
              {playerId ? `Player ID: ${playerId}` : `Match ID: ${matchId}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-2">❌ Errore</h2>
            <p className="text-red-300">{error}</p>
            <a
              href="/demo"
              className="mt-4 inline-block text-purple-400 hover:text-purple-300 underline"
            >
              ← Torna alla Demo
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Demo Mode */}
        <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <h1 className="text-3xl font-bold text-green-400 mb-2">🎮 DEMO MODE ATTIVA</h1>
          <div className="flex gap-4 text-sm text-gray-300">
            {playerId && (
              <span>
                👤 Player ID: <span className="text-white font-mono font-bold">{playerId}</span>
              </span>
            )}
            {matchId && (
              <span>
                🎯 Match ID: <span className="text-white font-mono font-bold">{matchId}</span>
              </span>
            )}
          </div>
          <p className="text-gray-400 text-xs mt-2">
            Dati caricati direttamente da OpenDota API - Nessun login richiesto
          </p>
        </div>

        {/* Dashboard Client Component */}
        <DashboardClient />

        {/* Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Dati Raw */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Dati Caricati</h2>
            <div className="text-xs text-gray-400 mb-2">
              Tipo: <span className="text-purple-400">{demoData?.type || 'N/A'}</span>
            </div>
            <pre className="text-gray-300 text-xs overflow-auto max-h-96 bg-gray-900/50 p-4 rounded">
              {demoData ? JSON.stringify(demoData.data, null, 2) : 'Nessun dato disponibile'}
            </pre>
          </div>

          {/* Componente Placeholder per UI */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">🎨 Dashboard Component</h2>
            <p className="text-gray-400 mb-4">
              Costruisci qui i tuoi componenti pezzo a pezzo...
            </p>
            {demoData?.data && (
              <div className="space-y-2 text-sm">
                {demoData.type === 'match' && (
                  <>
                    <p className="text-gray-300">
                      <span className="text-purple-400">Match ID:</span>{' '}
                      {demoData.data.match_id}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-purple-400">Durata:</span>{' '}
                      {demoData.data.duration ? `${Math.floor(demoData.data.duration / 60)}:${(demoData.data.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-purple-400">Radiant Win:</span>{' '}
                      {demoData.data.radiant_win ? '✅' : '❌'}
                    </p>
                  </>
                )}
                {demoData.type === 'player' && demoData.data.match_id && (
                  <p className="text-gray-300">
                    <span className="text-purple-400">Ultima Partita:</span>{' '}
                    {demoData.data.match_id}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

