import { createClient } from '@/lib/supabase/server';

interface AdvancedMetricsProps {
  userId: string;
}

export async function AdvancedMetrics({ userId }: AdvancedMetricsProps) {
  const supabase = await createClient();

  const { data: stats } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single();

  const metrics = [
    {
      name: 'Aggressività',
      value: stats?.avg_aggressiveness || 0,
      description: 'Basato su kill participation e damage per minute',
      color: 'from-red-600 to-orange-600',
    },
    {
      name: 'Farm Efficiency',
      value: stats?.avg_farm_efficiency || 0,
      description: 'Efficienza nel farming e gestione risorse',
      color: 'from-green-600 to-emerald-600',
    },
    {
      name: 'Macro Gameplay',
      value: stats?.avg_macro || 0,
      description: 'Decisioni macro, visione mappa, timing',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'Survivability',
      value: stats?.avg_survivability || 0,
      description: 'Capacità di evitare morti evitabili',
      color: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Metriche Avanzate</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-gray-900/50 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-gray-400 text-sm mb-2">{metric.name}</h3>
            <div className="flex items-baseline space-x-2 mb-3">
              <span className="text-4xl font-bold text-white">
                {Math.round(metric.value)}
              </span>
              <span className="text-gray-500 text-sm">/ 100</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full bg-gradient-to-r ${metric.color}`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{metric.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

