'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function RegisterForm() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Crea utente in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Il trigger handle_new_user() crea automaticamente user_profile
        // Aspettiamo che il trigger esegua, poi aggiorniamo solo il nickname
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Aggiorna solo il nickname (il profilo esiste già grazie al trigger)
        const { error: updateError } = await supabase
          .from('user_profile')
          .update({
            nickname,
            onboarding_status: 'profile_pending',
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('[RegisterForm] Profile update error:', updateError);
          // Se fallisce, potrebbe essere che il trigger non sia ancora eseguito
          // Aspettiamo ancora e riproviamo
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { error: retryError } = await supabase
            .from('user_profile')
            .update({
              nickname,
              onboarding_status: 'profile_pending',
            })
            .eq('id', authData.user.id);
          
          if (retryError) {
            console.error('[RegisterForm] Retry update error:', retryError);
            // Se fallisce ancora, usa l'endpoint API come fallback
            const response = await fetch('/api/user/create-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: authData.user.id,
                nickname,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              throw new Error(errorData.error || 'Errore durante la creazione del profilo');
            }
          }
        }

        // Redirect a onboarding
        router.push('/onboarding/profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
            Nickname
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Il tuo nickname"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="la-tua-email@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Minimo 6 caratteri"
          />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 text-blue-400 text-sm">
          Dopo la registrazione completerai il tuo profilo e importerai le prime partite.
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registrazione in corso...' : 'Registrati'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Hai già un account?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}

