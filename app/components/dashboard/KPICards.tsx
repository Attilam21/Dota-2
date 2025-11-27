import { createClient } from '@/lib/supabase/server';

interface KPICardsProps {
  userId: string;
}

export async function KPICards({ userId }: KPICardsProps) {
  const supabase = await createClient();

  const { data: stats } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 text-sm">Winrate</h3>
          <span className="text-green-400 text-sm">+2.5%</span>
        </div>
        <p className="text-3xl font-bold text-white mb-1">
          {stats?.winrate && typeof stats.winrate === 'number' ? `${stats.winrate.toFixed(1)}%` : '0%'}
        </p>
        <p className="text-xs text-gray-500">Ultime 20 partite incluse</p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 text-sm">KDA Medio</h3>
          <span className="text-green-400 text-sm">+0.3</span>
        </div>
        <p className="text-3xl font-bold text-white mb-1">
          {stats?.avg_kda && typeof stats.avg_kda === 'number' ? stats.avg_kda.toFixed(2) : '0.00'}
        </p>
        <p className="text-xs text-gray-500">Ultime 20 partite incluse</p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 text-sm">GPM Medio</h3>
          <span className="text-red-400 text-sm">-15</span>
        </div>
        <p className="text-3xl font-bold text-white mb-1">
          {stats?.avg_gpm ? Math.round(stats.avg_gpm) : '0'}
        </p>
        <p className="text-xs text-gray-500">Ultime 20 partite incluse</p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 text-sm">XPM Medio</h3>
          <span className="text-green-400 text-sm">+25</span>
        </div>
        <p className="text-3xl font-bold text-white mb-1">
          {stats?.avg_xpm ? Math.round(stats.avg_xpm) : '0'}
        </p>
        <p className="text-xs text-gray-500">Ultime 20 partite incluse</p>
      </div>
    </div>
  );
}

