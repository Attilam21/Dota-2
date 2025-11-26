import { createClient } from '@/lib/supabase/server';

interface GamePhaseAnalysisProps {
  userId: string;
}

export async function GamePhaseAnalysis({ userId }: GamePhaseAnalysisProps) {
  const supabase = await createClient();

  // Fetch phase data from player_match_metrics
  const { data: metrics } = await supabase
    .from('player_match_metrics')
    .select('early_kda, early_gpm, early_xpm, mid_kda, mid_gpm, mid_xpm, late_kda, late_gpm, late_xpm')
    .eq('user_id', userId)
    .limit(20);

  // Calculate averages
  const phases = {
    early: {
      kda: 0,
      gpm: 0,
      xpm: 0,
    },
    mid: {
      kda: 0,
      gpm: 0,
      xpm: 0,
    },
    late: {
      kda: 0,
      gpm: 0,
      xpm: 0,
    },
  };

  if (metrics && metrics.length > 0) {
    const count = metrics.length;
    phases.early = {
      kda: metrics.reduce((sum, m) => sum + (m.early_kda || 0), 0) / count,
      gpm: metrics.reduce((sum, m) => sum + (m.early_gpm || 0), 0) / count,
      xpm: metrics.reduce((sum, m) => sum + (m.early_xpm || 0), 0) / count,
    };
    phases.mid = {
      kda: metrics.reduce((sum, m) => sum + (m.mid_kda || 0), 0) / count,
      gpm: metrics.reduce((sum, m) => sum + (m.mid_gpm || 0), 0) / count,
      xpm: metrics.reduce((sum, m) => sum + (m.mid_xpm || 0), 0) / count,
    };
    phases.late = {
      kda: metrics.reduce((sum, m) => sum + (m.late_kda || 0), 0) / count,
      gpm: metrics.reduce((sum, m) => sum + (m.late_gpm || 0), 0) / count,
      xpm: metrics.reduce((sum, m) => sum + (m.late_xpm || 0), 0) / count,
    };
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Analisi per Fase di Gioco</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Fase</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">KDA</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">GPM</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">XPM</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Impact Score</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700/50">
              <td className="py-4 px-4 text-white font-medium">Early (0-10 min)</td>
              <td className="py-4 px-4 text-gray-300">{phases.early.kda.toFixed(2)}</td>
              <td className="py-4 px-4 text-gray-300">{Math.round(phases.early.gpm)}</td>
              <td className="py-4 px-4 text-gray-300">{Math.round(phases.early.xpm)}</td>
              <td className="py-4 px-4 text-green-400 font-semibold">
                {((phases.early.kda + phases.early.gpm / 100 + phases.early.xpm / 100) / 3 * 100).toFixed(0)}
              </td>
            </tr>
            <tr className="border-b border-gray-700/50">
              <td className="py-4 px-4 text-white font-medium">Mid (10-30 min)</td>
              <td className="py-4 px-4 text-gray-300">{phases.mid.kda.toFixed(2)}</td>
              <td className="py-4 px-4 text-gray-300">{Math.round(phases.mid.gpm)}</td>
              <td className="py-4 px-4 text-gray-300">{Math.round(phases.mid.xpm)}</td>
              <td className="py-4 px-4 text-green-400 font-semibold">
                {((phases.mid.kda + phases.mid.gpm / 100 + phases.mid.xpm / 100) / 3 * 100).toFixed(0)}
              </td>
            </tr>
            <tr>
              <td className="py-4 px-4 text-white font-medium">Late (30+ min)</td>
              <td className="py-4 px-4 text-gray-300">{phases.late.kda.toFixed(2)}</td>
              <td className="py-4 px-4 text-gray-300">{Math.round(phases.late.gpm)}</td>
              <td className="py-4 px-4 text-gray-300">{Math.round(phases.late.xpm)}</td>
              <td className="py-4 px-4 text-green-400 font-semibold">
                {((phases.late.kda + phases.late.gpm / 100 + phases.late.xpm / 100) / 3 * 100).toFixed(0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

