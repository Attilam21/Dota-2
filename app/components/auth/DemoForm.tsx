'use client';

import { useState, useTransition } from 'react';
import { loadPlayerLastMatch } from '@/app/actions/demo';

export function DemoForm() {
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    
    startTransition(async () => {
      try {
        const result = await loadPlayerLastMatch(formData);
        
        if (result?.error) {
          setError(result.error);
        }
        // Server action gestisce il redirect automaticamente
        // Se non c'è errore, redirect('/dashboard') viene eseguito
      } catch (err) {
        // Redirect errors are expected - Next.js redirect throws
        if (err && typeof err === 'object' && 'digest' in err) {
          // This is a redirect, ignore it
          return;
        }
        setError(err instanceof Error ? err.message : 'Errore durante il caricamento');
      }
    });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Demo - Prova Gratuita</h2>
        <p className="text-gray-400 text-sm">
          Inserisci il tuo OpenDota Account ID per vedere l&apos;analisi della tua ultima partita senza registrazione
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="account_id" className="block text-sm font-medium text-gray-300 mb-2">
            OpenDota Account ID
          </label>
          <input
            id="account_id"
            name="account_id"
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
          disabled={isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Caricamento partita...' : 'Carica Ultima Partita'}
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
