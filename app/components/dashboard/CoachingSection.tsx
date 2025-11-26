import { createClient } from '@/lib/supabase/server';
import { GenerateAnalysisButton } from './GenerateAnalysisButton';

interface CoachingSectionProps {
  userId: string;
}

export async function CoachingSection({ userId }: CoachingSectionProps) {
  const supabase = await createClient();

  // Fetch active coaching tasks
  const { data: tasks } = await supabase
    .from('coaching_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('priority', { ascending: false })
    .limit(10);

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Coaching & Task</h2>
        <GenerateAnalysisButton userId={userId} />
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-900/50 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{task.title}</h3>
                  <p className="text-gray-400 text-sm">{task.description}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    task.priority === 'high'
                      ? 'bg-red-500/20 text-red-400'
                      : task.priority === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {task.priority.toUpperCase()}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progresso</span>
                  <span className="text-sm text-white font-semibold">
                    {task.progress_percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    style={{ width: `${task.progress_percentage}%` }}
                  />
                </div>
              </div>
              {task.target_value && task.current_value && (
                <div className="mt-3 text-sm text-gray-400">
                  Obiettivo: {task.target_value.toFixed(1)} | Attuale: {task.current_value.toFixed(1)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>Nessun task attivo al momento.</p>
          <p className="text-sm mt-2">Clicca su &quot;Richiedi nuova analisi AI&quot; per generare task personalizzati.</p>
        </div>
      )}
    </div>
  );
}

