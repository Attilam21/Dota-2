'use client';

import { useEffect, useState } from 'react';

export function DashboardClient() {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    // Log immediately when component mounts
    console.log('[DashboardClient] ✅ Client component mounted - Dashboard is rendering!');
    
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
      }
    } catch (error) {
      console.warn('[DashboardClient] Could not access sessionStorage:', error);
    }
  }, []);

  return (
    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <p className="text-blue-400 text-sm font-semibold mb-2">
        🔗 Collegamento Verificato
      </p>
      <div className="space-y-1 text-xs text-gray-400">
        <p>✅ Dashboard caricata correttamente</p>
        <p>✅ Client component funzionante</p>
        {matchId && (
          <p>✅ Match ID: <span className="text-white font-mono">{matchId}</span></p>
        )}
        {accountId && (
          <p>✅ Account ID: <span className="text-white font-mono">{accountId}</span></p>
        )}
        {!matchId && !accountId && (
          <p>ℹ️ Accesso diretto alla dashboard (senza dati demo)</p>
        )}
      </div>
    </div>
  );
}

