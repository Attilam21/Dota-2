'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ImportedMatch {
  match_id: number;
  hero_id: number | null;
  duration: number;
  won: boolean;
  is_eligible: boolean;
  included: boolean;
  status: 'valid' | 'short' | 'incomplete';
}

const MIN_DURATION = 15 * 60; // 15 minuti in secondi

export function ImportMatchesForm() {
  const [matchIds, setMatchIds] = useState('');
  const [importedMatches, setImportedMatches] = useState<ImportedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleImport = async () => {
    const ids = matchIds
      .split(/[,\n\s]+/)
      .map(id => id.trim())
      .filter(id => id && !isNaN(Number(id)))
      .map(Number)
      .slice(0, 20); // Max 20 match

    if (ids.length === 0) {
      setError('Inserisci almeno un match ID valido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const results: ImportedMatch[] = [];

      // Importa ogni match
      for (const matchId of ids) {
        try {
          const response = await fetch(`/api/opendota/import-match?match_id=${matchId}&user_id=${user.id}`);
          if (!response.ok) throw new Error(`Errore import match ${matchId}`);

          const data = await response.json();
          
          // Build digest con user_id
          const digestResponse = await fetch('/api/opendota/build-digest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ match_id: matchId, user_id: user.id }),
          });

          if (!digestResponse.ok) throw new Error(`Errore build digest ${matchId}`);

          const digestData = await digestResponse.json();

          // Trova il player dell'utente (se presente)
          const player = digestData.players?.find((p: any) => 
            p.account_id && p.account_id.toString() === user.user_metadata?.steam_id?.toString()
          ) || digestData.players?.[0];

          const isEligible = digestData.match?.duration >= MIN_DURATION;
          const status = !digestData.match ? 'incomplete' 
            : digestData.match.duration < MIN_DURATION ? 'short' 
            : 'valid';

          results.push({
            match_id: matchId,
            hero_id: player?.hero_id || null,
            duration: digestData.match?.duration || 0,
            won: digestData.match?.radiant_win === (player?.player_slot < 128),
            is_eligible: isEligible,
            included: isEligible,
            status,
          });
        } catch (err) {
          console.error(`Errore import match ${matchId}:`, err);
          results.push({
            match_id: matchId,
            hero_id: null,
            duration: 0,
            won: false,
            is_eligible: false,
            included: false,
            status: 'incomplete',
          });
        }
      }

      setImportedMatches(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'import');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInclude = (index: number) => {
    const updated = [...importedMatches];
    updated[index].included = !updated[index].included;
    setImportedMatches(updated);
  };

  const handleComplete = async () => {
    if (importedMatches.filter(m => m.included).length === 0) {
      setError('Seleziona almeno una partita valida');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      // Aggiorna matches con user_id e flags
      for (const match of importedMatches) {
        if (match.included) {
          await supabase
            .from('matches_digest')
            .update({
              user_id: user.id,
              is_eligible_for_coaching: match.is_eligible,
              included_in_coaching: match.included,
            })
            .eq('match_id', match.match_id);
        }
      }

      // Completa onboarding
      await supabase
        .from('user_profile')
        .update({ onboarding_status: 'complete' })
        .eq('id', user.id);

      router.push('/dashboard/panoramica');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il completamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <div className="mb-4">
          <label htmlFor="matchIds" className="block text-sm font-medium text-gray-300 mb-2">
            Match IDs (separati da virgola, spazio o nuova riga)
          </label>
          <textarea
            id="matchIds"
            value={matchIds}
            onChange={(e) => setMatchIds(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="8576841486, 8576841487, 8576841488..."
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Importazione in corso...' : 'Importa Partite'}
        </button>
      </div>

      {importedMatches.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">Partite Importate</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-300">Match ID</th>
                  <th className="text-left py-2 text-gray-300">Eroe</th>
                  <th className="text-left py-2 text-gray-300">Durata</th>
                  <th className="text-left py-2 text-gray-300">Risultato</th>
                  <th className="text-left py-2 text-gray-300">Stato</th>
                  <th className="text-left py-2 text-gray-300">Includi</th>
                </tr>
              </thead>
              <tbody>
                {importedMatches.map((match, index) => (
                  <tr key={match.match_id} className="border-b border-gray-700/50">
                    <td className="py-3 text-white">{match.match_id}</td>
                    <td className="py-3 text-gray-400">{match.hero_id || 'N/A'}</td>
                    <td className="py-3 text-gray-400">
                      {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')}
                    </td>
                    <td className="py-3">
                      <span className={match.won ? 'text-green-400' : 'text-red-400'}>
                        {match.won ? 'Vittoria' : 'Sconfitta'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={
                        match.status === 'valid' ? 'text-green-400' :
                        match.status === 'short' ? 'text-yellow-400' :
                        'text-red-400'
                      }>
                        {match.status === 'valid' ? 'Valida' :
                         match.status === 'short' ? 'Partita corta' :
                         'Incompleta'}
                      </span>
                    </td>
                    <td className="py-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={match.included}
                          onChange={() => handleToggleInclude(index)}
                          disabled={!match.is_eligible}
                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <span className="ml-2 text-gray-300">
                          {match.included ? 'Inclusa' : 'Esclusa'}
                        </span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleComplete}
            disabled={loading || importedMatches.filter(m => m.included).length === 0}
            className="mt-6 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Completamento...' : 'Completa Onboarding'}
          </button>
        </div>
      )}
    </div>
  );
}

