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
        setError('Inserisci un Account ID valido (numero positivo)');
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

      // Controlla lo status PRIMA di parsare JSON
      if (response.status === 404) {
        // Se è 404, potrebbe essere che l'endpoint non esiste o c'è un problema di routing
        const text = await response.text().catch(() => 'No response body');
        console.error('[DemoForm] 404 Error - Response text:', text);
        throw new Error('Endpoint non trovato (404). Verifica che il deployment sia completato e che la route esista.');
      }

      // Controlla se la risposta è JSON valida
      let data;
      try {
        const responseText = await response.text();
        console.log('[DemoForm] Response text (first 500 chars):', responseText.substring(0, 500));
        data = JSON.parse(responseText);
      } catch (jsonError) {
        // Se la risposta non è JSON, potrebbe essere un errore 500 generico
        console.error('[DemoForm] JSON parse error:', jsonError);
        throw new Error(`Errore del server (${response.status}). La risposta non è JSON valido.`);
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

      // Redirect alla dashboard demo con i dati della partita
      router.push(`/demo/match/${data.match_id}?account_id=${accountIdNum}`);
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
          Inserisci il tuo Steam Account ID per vedere l&apos;analisi della tua ultima partita senza registrazione
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="account_id" className="block text-sm font-medium text-gray-300 mb-2">
            Steam Account ID
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
            Trova il tuo Account ID su{' '}
            <a
              href="https://steamid.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              steamid.io
            </a>
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

