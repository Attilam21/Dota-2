'use client';

import { useEffect, useState } from 'react';

interface MatchData {
  match_id: number;
  duration: number;
  radiant_win: boolean;
  start_time: string | null;
  radiant_score: number | null;
  dire_score: number | null;
}

interface PlayerData {
  account_id: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  hero_damage: number;
  tower_damage: number;
}

export function DashboardClient() {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Log immediately when component mounts
    console.log('[DashboardClient] ✅ Client component mounted - Dashboard is rendering!');
    console.log('[DashboardClient] Current URL:', window.location.href);
    console.log('[DashboardClient] Current pathname:', window.location.pathname);
    
    // Get data from sessionStorage
    try {
      const storedMatchId = sessionStorage.getItem('demo_match_id');
      const storedAccountId = sessionStorage.getItem('demo_account_id');
      
      if (storedMatchId) {
        setMatchId(storedMatchId);
        console.log('[DashboardClient] ✅ Match ID from sessionStorage:', storedMatchId);
      }
      
      if (storedAccountId) {
        setAccountId(storedAccountId);
        console.log('[DashboardClient] ✅ Account ID from sessionStorage:', storedAccountId);
      }
      
      if (!storedMatchId && !storedAccountId) {
        console.log('[DashboardClient] ℹ️ No demo data in sessionStorage - this is OK for direct access');
      } else {
        console.log('[DashboardClient] ✅ Demo data loaded successfully from sessionStorage');
        
        // Load match data from Supabase
        if (storedMatchId) {
          loadMatchData(storedMatchId, storedAccountId);
        }
      }
    } catch (error) {
      console.warn('[DashboardClient] Could not access sessionStorage:', error);
    }
  }, []);

  const loadMatchData = async (matchIdStr: string | null, accountIdStr: string | null) => {
    if (!matchIdStr) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ match_id: matchIdStr });
      if (accountIdStr) {
        params.append('account_id', accountIdStr);
      }

      const apiUrl = `/api/demo/get-match-data?${params.toString()}`;
      console.log('[DashboardClient] Fetching match data from:', apiUrl);

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load match data');
      }

      if (data.status === 'ok' && data.match) {
        setMatchData(data.match);
        console.log('[DashboardClient] ✅ Match data loaded:', data.match);
      }

      if (data.player) {
        setPlayerData(data.player);
        console.log('[DashboardClient] ✅ Player data loaded:', data.player);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[DashboardClient] Error loading match data:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Status Card */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-sm font-semibold mb-2">
          🔗 Collegamento Verificato - Demo Mode Attivo
        </p>
        <div className="space-y-1 text-xs text-gray-400">
          <p className="text-green-400">✅ Dashboard caricata correttamente</p>
          <p className="text-green-400">✅ Client component funzionante</p>
          <p className="text-green-400">✅ Routing funziona - Collegamento Form → Dashboard OK</p>
          {matchId && (
            <div className="mt-2 pt-2 border-t border-blue-500/20">
              <p className="text-blue-300 font-semibold">📊 Dati Match Caricati:</p>
              <p>✅ Match ID: <span className="text-white font-mono font-bold">{matchId}</span></p>
              {accountId && (
                <p>✅ Account ID: <span className="text-white font-mono font-bold">{accountId}</span></p>
              )}
            </div>
          )}
          {!matchId && !accountId && (
            <p className="text-gray-500">ℹ️ Accesso diretto alla dashboard (senza dati demo dal form)</p>
          )}
        </div>
      </div>

      {/* Match Data Card */}
      {matchId && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-purple-400 text-sm font-semibold mb-3">
            📊 Dettagli Partita
          </p>
          {loading && (
            <p className="text-gray-400 text-xs">Caricamento dati partita...</p>
          )}
          {error && (
            <p className="text-red-400 text-xs">Errore: {error}</p>
          )}
          {matchData && !loading && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-500">Durata:</p>
                  <p className="text-white font-semibold">
                    {Math.floor(matchData.duration / 60)}:{(matchData.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Risultato:</p>
                  <p className={`font-semibold ${matchData.radiant_win ? 'text-green-400' : 'text-red-400'}`}>
                    {matchData.radiant_win ? 'Radiant Win' : 'Dire Win'}
                  </p>
                </div>
                {matchData.radiant_score !== null && matchData.dire_score !== null && (
                  <>
                    <div>
                      <p className="text-gray-500">Radiant Score:</p>
                      <p className="text-white font-semibold">{matchData.radiant_score}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Dire Score:</p>
                      <p className="text-white font-semibold">{matchData.dire_score}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Player Data Card */}
      {playerData && !loading && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm font-semibold mb-3">
            🎮 Statistiche Giocatore
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500">KDA:</p>
              <p className="text-white font-semibold">
                {playerData.kills}/{playerData.deaths}/{playerData.assists}
              </p>
            </div>
            <div>
              <p className="text-gray-500">GPM:</p>
              <p className="text-white font-semibold">{playerData.gpm}</p>
            </div>
            <div>
              <p className="text-gray-500">XPM:</p>
              <p className="text-white font-semibold">{playerData.xpm}</p>
            </div>
            <div>
              <p className="text-gray-500">Hero Damage:</p>
              <p className="text-white font-semibold">{playerData.hero_damage.toLocaleString()}</p>
            </div>
            {playerData.tower_damage > 0 && (
              <div>
                <p className="text-gray-500">Tower Damage:</p>
                <p className="text-white font-semibold">{playerData.tower_damage.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

