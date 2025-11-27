'use client';

import { useEffect, useState } from 'react';

export function DashboardClient() {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

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
      }
    } catch (error) {
      console.warn('[DashboardClient] Could not access sessionStorage:', error);
    }
  }, []);

  return (
    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
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
            <p className="text-yellow-400 text-xs mt-2">
              💡 I dati sono stati salvati correttamente in sessionStorage dal form demo.
            </p>
          </div>
        )}
        {!matchId && !accountId && (
          <p className="text-gray-500">ℹ️ Accesso diretto alla dashboard (senza dati demo dal form)</p>
        )}
      </div>
    </div>
  );
}

