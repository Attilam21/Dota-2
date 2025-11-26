'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ROLES = [
  { value: 'carry', label: 'Carry' },
  { value: 'mid', label: 'Mid' },
  { value: 'offlane', label: 'Offlane' },
  { value: 'support', label: 'Support' },
  { value: 'hard_support', label: 'Hard Support' },
];

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Medio' },
  { value: 'competitive', label: 'Competitivo' },
];

export function ProfileForm() {
  const [inGameName, setInGameName] = useState('');
  const [rolePreferred, setRolePreferred] = useState('');
  const [region, setRegion] = useState('');
  const [steamId, setSteamId] = useState('');
  const [skillSelfEval, setSkillSelfEval] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const { error: updateError } = await supabase
        .from('user_profile')
        .update({
          in_game_name: inGameName,
          role_preferred: rolePreferred,
          region,
          steam_id: steamId ? parseInt(steamId) : null,
          skill_self_eval: skillSelfEval,
          onboarding_status: 'avatar_pending',
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/onboarding/avatar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="inGameName" className="block text-sm font-medium text-gray-300 mb-2">
            Nome in-game
          </label>
          <input
            id="inGameName"
            type="text"
            value={inGameName}
            onChange={(e) => setInGameName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Il tuo nome in Dota 2"
          />
        </div>

        <div>
          <label htmlFor="rolePreferred" className="block text-sm font-medium text-gray-300 mb-2">
            Ruolo principale
          </label>
          <select
            id="rolePreferred"
            value={rolePreferred}
            onChange={(e) => setRolePreferred(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Seleziona un ruolo</option>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-300 mb-2">
            Server / Regione
          </label>
          <input
            id="region"
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Es. Europe West, US East, etc."
          />
        </div>

        <div>
          <label htmlFor="steamId" className="block text-sm font-medium text-gray-300 mb-2">
            ID Steam <span className="text-gray-500 text-xs">(facoltativo)</span>
          </label>
          <input
            id="steamId"
            type="text"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Il tuo Steam ID"
          />
        </div>

        <div>
          <label htmlFor="skillSelfEval" className="block text-sm font-medium text-gray-300 mb-2">
            Livello percepito
          </label>
          <select
            id="skillSelfEval"
            value={skillSelfEval}
            onChange={(e) => setSkillSelfEval(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Seleziona il tuo livello</option>
            {SKILL_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Salvataggio...' : 'Continua'}
        </button>
      </form>
    </div>
  );
}

