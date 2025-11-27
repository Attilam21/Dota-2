'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DemoForm() {
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const accountIdNum = parseInt(accountId, 10);
      if (isNaN(accountIdNum) || accountIdNum <= 0) {
        setError('Inserisci un OpenDota Account ID valido (numero positivo)');
        return;
      }

      console.log('[DemoForm] Loading last match for account_id:', accountIdNum);

      // Costruisci l'URL assoluto per evitare problemi di routing in produzione
      const apiUrl = `${window.location.origin}/api/demo/load-player-last-match`;
      const requestBody = {
        account_id: accountIdNum,
      };

      console.log('[DemoForm] Making POST request to:', apiUrl);
      console.log('[DemoForm] Request body:', requestBody);

      // Chiama l'endpoint demo per caricare l'ultima partita
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[DemoForm] Response status:', response.status);
      console.log('[DemoForm] Response statusText:', response.statusText);
      console.log('[DemoForm] Response headers:', Object.fromEntries(response.headers.entries()));

      // Controlla se la risposta è JSON valida (anche per 404)
      let data;
      try {
        const responseText = await response.text();
        console.log('[DemoForm] Response text (first 500 chars):', responseText.substring(0, 500));
        
        // Prova a parsare JSON anche per 404, perché l'API potrebbe restituire JSON con dettagli
        if (responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          // Se non c'è testo, è probabilmente un 404 di routing
          if (response.status === 404) {
            throw new Error('Endpoint non trovato (404). Verifica che il deployment sia completato e che la route esista.');
          }
          throw new Error(`Errore del server (${response.status}). Nessuna risposta dal server.`);
        }
      } catch (jsonError) {
        // Se non è JSON valido, potrebbe essere un errore di routing
        if (response.status === 404 && !(jsonError instanceof Error && jsonError.message.includes('Endpoint'))) {
          console.error('[DemoForm] 404 Error - Response is not JSON:', jsonError);
          throw new Error('Endpoint non trovato (404). Verifica che il deployment sia completato e che la route esista.');
        }
        // Se è un altro errore di parsing
        console.error('[DemoForm] JSON parse error:', jsonError);
        throw new Error(`Errore del server (${response.status}). La risposta non è JSON valido.`);
      }

      // Se è 404 ma abbiamo JSON, è un errore logico dell'API (es. "no matches found")
      if (response.status === 404 && data) {
        // L'API ha restituito un errore logico, mostra il messaggio dell'API
        const errorMessage = data.details || data.error || 'Nessuna partita trovata';
        console.log('[DemoForm] API returned 404 with error:', data);
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        // Log dettagliato per debugging
        console.error('[DemoForm] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
        });
        throw new Error(data.details || data.error || `Errore nel caricamento della partita (${response.status})`);
      }

      console.log('[DemoForm] Match loaded successfully:', data);

      // Redirect to dashboard after successful digest creation
      router.push('/dashboard');
    } catch (err) {
      console.error('[DemoForm] Error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento della partita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Demo - Prova Gratuita</h2>
        <p className="text-gray-400 text-sm">
          Inserisci il tuo OpenDota Account ID per vedere l&apos;analisi della tua ultima partita senza registrazione
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="account_id" className="block text-sm font-medium text-gray-300 mb-2">
            OpenDota Account ID
          </label>
          <input
            id="account_id"
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="123456789"
          />
          <p className="mt-2 text-xs text-gray-500">
            Il tuo OpenDota Account ID è lo stesso del tuo Steam Account ID. Puoi trovarlo sul tuo profilo OpenDota.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Caricamento partita...' : 'Carica Ultima Partita'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-gray-400 text-xs text-center">
          La demo mostra solo l&apos;analisi della tua ultima partita. 
          <br />
          <span className="text-purple-400">Registrati</span> per accedere a tutte le funzionalità!
        </p>
      </div>
    </div>
  );
}

