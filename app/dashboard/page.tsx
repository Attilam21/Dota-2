'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardClient } from './DashboardClient';

interface PlayerData {
  account_id: number;
  personaname: string;
  avatar: string;
  profile_stat?: {
    win: number;
    lose: number;
  };
}

interface MatchData {
  match_id: number;
  radiant_win: boolean;
  duration: number;
  start_time: number;
  players: any[];
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('mode') === 'demo';
  const playerId = searchParams?.get('player_id');
  const matchId = searchParams?.get('match_id');

  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      loadDemoData();
    } else {
      setLoading(false);
    }
  }, [isDemo, playerId, matchId]);

  const loadDemoData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (playerId) {
        const playerIdNum = parseInt(playerId, 10);
        if (isNaN(playerIdNum)) {
          throw new Error('Invalid player ID');
        }

        console.log('[DashboardPage] Loading player data for:', playerIdNum);
        const response = await fetch(`https://api.opendota.com/api/players/${playerIdNum}`);
        
        if (!response.ok) {
          throw new Error(`Player not found: ${response.status}`);
        }
        
        const data = await response.json();
        setPlayerData(data);
        console.log('✅ Player data loaded:', data);

        // Also load last match
        const matchesResponse = await fetch(
          `https://api.opendota.com/api/players/${playerIdNum}/matches?limit=1`
        );
        
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          if (matchesData && matchesData.length > 0) {
            const lastMatchId = matchesData[0].match_id;
            const matchResponse = await fetch(
              `https://api.opendota.com/api/matches/${lastMatchId}`
            );
            
            if (matchResponse.ok) {
              const matchData = await matchResponse.json();
              setMatchData(matchData);
              sessionStorage.setItem('demo_match_id', String(lastMatchId));
              sessionStorage.setItem('demo_account_id', playerId);
            }
          }
        }
      } else if (matchId) {
        const matchIdNum = parseInt(matchId, 10);
        if (isNaN(matchIdNum)) {
          throw new Error('Invalid match ID');
        }

        console.log('[DashboardPage] Loading match data for:', matchIdNum);
        const response = await fetch(`https://api.opendota.com/api/matches/${matchIdNum}`);
        
        if (!response.ok) {
          throw new Error(`Match not found: ${response.status}`);
        }
        
        const data = await response.json();
        setMatchData(data);
        console.log('✅ Match data loaded:', data);
        sessionStorage.setItem('demo_match_id', matchId);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMsg);
      console.error('❌ Error loading demo data:', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Demo Mode Dashboard
  if (isDemo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h1 className="text-3xl font-bold text-green-400 mb-2">🎮 DOTA 2 ANALYTICS DEMO</h1>
            <p className="text-gray-300 mt-2">
              {playerId && `📊 Player ID: ${playerId}`}
              {matchId && `🎯 Match ID: ${matchId}`}
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Dati caricati direttamente da OpenDota API - Nessun login richiesto
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-300 mt-4">Caricamento dati da OpenDota API...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              ❌ Errore: {error}
              <div className="mt-4">
                <a
                  href="/demo"
                  className="text-purple-400 hover:text-purple-300 underline text-sm"
                >
                  ← Torna alla Demo
                </a>
              </div>
            </div>
          )}

          {/* Data Display */}
          {!loading && !error && (playerData || matchData) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Player Card */}
              {playerData && (
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 col-span-1">
                  <h2 className="text-2xl font-bold text-white mb-4">👤 Giocatore</h2>
                  <div className="space-y-3">
                    <p>
                      <span className="text-gray-400">Nome:</span>{' '}
                      <span className="text-white font-semibold">{playerData.personaname || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Account ID:</span>{' '}
                      <span className="text-white font-mono">{playerData.account_id}</span>
                    </p>
                    {playerData.profile_stat && (
                      <>
                        <p>
                          <span className="text-gray-400">Vittorie:</span>{' '}
                          <span className="text-green-400 font-semibold">
                            {playerData.profile_stat.win || 0}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-400">Sconfitte:</span>{' '}
                          <span className="text-red-400 font-semibold">
                            {playerData.profile_stat.lose || 0}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Match Card */}
              {matchData && (
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 col-span-1">
                  <h2 className="text-2xl font-bold text-white mb-4">🎯 Partita</h2>
                  <div className="space-y-3">
                    <p>
                      <span className="text-gray-400">Match ID:</span>{' '}
                      <span className="text-white font-mono">{matchData.match_id}</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Durata:</span>{' '}
                      <span className="text-white font-semibold">
                        {Math.floor(matchData.duration / 60)}m {matchData.duration % 60}s
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-400">Vincitore:</span>{' '}
                      <span
                        className={`font-semibold ${
                          matchData.radiant_win ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {matchData.radiant_win ? 'RADIANT' : 'DIRE'}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-400">Giocatori:</span>{' '}
                      <span className="text-white font-semibold">
                        {matchData.players?.length || 0}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* JSON Debug */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 col-span-1 lg:col-span-1">
                <h2 className="text-xl font-bold text-white mb-4">📋 JSON Raw</h2>
                <pre className="text-gray-300 text-xs overflow-auto max-h-64 bg-gray-900/50 p-3 rounded">
                  {JSON.stringify(playerData || matchData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Client Component for Future Features */}
          <div className="mt-8">
            <DashboardClient />
          </div>
        </div>
      </div>
    );
  }

  // Non-demo dashboard - redirect to login or show message
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-gray-400 mb-4">
            Per accedere alla dashboard completa, effettua il login o usa la modalità demo.
          </p>
          <div className="flex gap-4">
            <a
              href="/demo"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              🎮 Accedi a Demo
            </a>
            <a
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              🔐 Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
