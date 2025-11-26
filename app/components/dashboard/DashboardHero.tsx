import { createClient } from '@/lib/supabase/server';
import { ImportMatchButton } from './ImportMatchButton';

interface DashboardHeroProps {
  profile: {
    avatar: string | null;
    nickname: string | null;
    role_preferred: string | null;
  };
  userId: string;
}

export async function DashboardHero({ profile, userId }: DashboardHeroProps) {
  const supabase = await createClient();

  // Fetch user statistics
  const { data: stats } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single();

  const roleLabels: Record<string, string> = {
    carry: 'Carry',
    mid: 'Mid',
    offlane: 'Offlane',
    support: 'Support',
    hard_support: 'Hard Support',
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-6">
          <div className="text-6xl">{profile.avatar || '👤'}</div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {profile.nickname || 'Player'}
            </h1>
            <p className="text-gray-400">
              {profile.role_preferred ? roleLabels[profile.role_preferred] : 'No role set'}
            </p>
          </div>
        </div>
        <ImportMatchButton />
      </div>

      {/* KPI Principali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">Winrate</p>
          <p className="text-2xl font-bold text-white">
            {stats?.winrate ? `${stats.winrate.toFixed(1)}%` : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ultime 20 partite</p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">KDA Medio</p>
          <p className="text-2xl font-bold text-white">
            {stats?.avg_kda ? stats.avg_kda.toFixed(2) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ultime 20 partite</p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">GPM Medio</p>
          <p className="text-2xl font-bold text-white">
            {stats?.avg_gpm ? Math.round(stats.avg_gpm) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ultime 20 partite</p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-1">XPM Medio</p>
          <p className="text-2xl font-bold text-white">
            {stats?.avg_xpm ? Math.round(stats.avg_xpm) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ultime 20 partite</p>
        </div>
      </div>

      {/* Stato Coaching */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Task Attivi</p>
            <p className="text-2xl font-bold text-white">
              {stats?.active_tasks_count || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Progressione Settimanale</p>
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                  style={{ width: `${stats?.weekly_progress_percentage || 0}%` }}
                />
              </div>
              <span className="text-white font-semibold">
                {stats?.weekly_progress_percentage || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

