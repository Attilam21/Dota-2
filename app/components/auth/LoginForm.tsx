'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function LoginForm() {
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[LoginForm] Sign in error:', {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name,
        });

        // Messaggi di errore specifici basati sul tipo di errore
        if (signInError.message.includes('Email not confirmed') || 
            signInError.message.includes('email_not_confirmed') ||
            signInError.status === 400) {
          setError('Email non confermata. Controlla la tua email per il link di conferma o registrati di nuovo.');
        } else if (signInError.message.includes('Invalid login credentials') ||
                   signInError.message.includes('invalid_credentials')) {
          setError('Email o password errate. Riprova.');
        } else if (signInError.message.includes('User not found')) {
          setError('Utente non trovato. Verifica l\'email o registrati.');
        } else {
          setError(signInError.message || 'Errore durante il login. Riprova.');
        }
        return;
      }

      if (data.user) {
        // Controlla onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('user_profile')
          .select('onboarding_status')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('[LoginForm] Profile fetch error:', profileError);
          // Se il profilo non esiste, potrebbe essere un utente vecchio senza profilo
          // Crea il profilo se non esiste
          const { error: createError } = await supabase
            .from('user_profile')
            .insert({
              id: data.user.id,
              onboarding_status: 'profile_pending',
            });

          if (createError) {
            console.error('[LoginForm] Profile creation error:', createError);
            setError('Errore nel caricamento del profilo. Riprova.');
            return;
          }
        }

        const onboardingStatus = profile?.onboarding_status || 'profile_pending';

        if (onboardingStatus === 'complete') {
          router.push('/dashboard/panoramica');
        } else if (onboardingStatus) {
          const route = onboardingStatus.replace('_', '/');
          router.push(`/onboarding/${route}`);
        } else {
          router.push('/onboarding/profile');
        }
      }
    } catch (err) {
      console.error('[LoginForm] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="••••••••"
          />
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
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Non hai un account?{' '}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

