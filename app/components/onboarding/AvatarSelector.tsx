'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const AVATARS = [
  '👤', '🎮', '⚔️', '🛡️', '🏹', '🔮', '⚡', '🔥', '💎', '🌟', '🎯', '⚙️'
];

export function AvatarSelector() {
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!selectedAvatar) {
      setError('Seleziona un avatar');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const { error: updateError } = await supabase
        .from('user_profile')
        .update({
          avatar: selectedAvatar,
          onboarding_status: 'import_pending',
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/onboarding/import');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mb-6">
        {AVATARS.map((avatar) => (
          <button
            key={avatar}
            type="button"
            onClick={() => setSelectedAvatar(avatar)}
            className={`p-6 text-4xl rounded-lg border-2 transition-all ${
              selectedAvatar === avatar
                ? 'border-purple-500 bg-purple-500/20 scale-110'
                : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
            }`}
          >
            {avatar}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !selectedAvatar}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
      >
        {loading ? 'Salvataggio...' : 'Continua'}
      </button>
    </div>
  );
}

