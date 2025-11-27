import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProfileOverview } from '@/lib/services/profileService';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Main Dashboard Page
 * Displays user profile overview with performance scores and active tasks
 * Styled with dark theme and card-based layout
 * 
 * CRITICAL: This page is ALWAYS accessible for demo mode
 */
export default async function DashboardPage() {
  // CRITICAL: Log immediately to confirm page is being rendered
  console.log('[dashboard] ⚡ DashboardPage component STARTING - Route accessed successfully!');
  
  // DEMO MODE: This page is ALWAYS accessible without authentication
  // We completely skip auth checks to ensure demo mode works
  let user = null;
  let isDemoMode = true;
  
  // Try to get user, but NEVER block if it fails
  try {
    const supabase = await createClient();
    if (supabase) {
      try {
        const authResult = await supabase.auth.getUser();
        if (authResult?.data?.user && !authResult.error) {
          user = authResult.data.user;
          isDemoMode = false;
          console.log('[dashboard] ✅ Authenticated user found:', user.id);
        }
      } catch (authError) {
        // Ignore - demo mode (this is expected)
        console.log('[dashboard] ℹ️ No authenticated user - showing demo mode');
      }
    }
  } catch (error) {
    // Ignore all errors - always allow demo access
    console.log('[dashboard] ℹ️ Auth check failed - showing demo mode (expected for demo)');
  }
  
  // Always show dashboard - demo mode if no user, authenticated if user exists
  if (!user || isDemoMode) {
    console.log('[dashboard] ✅ Rendering demo dashboard - NO AUTHENTICATION REQUIRED');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Dashboard Demo
            </h1>
            <div className="space-y-2">
              <p className="text-green-400 font-semibold text-xl animate-pulse">
                ✅ Dashboard Demo Caricata con Successo!
              </p>
              <p className="text-blue-400 text-sm font-medium">
                🎮 Modalità Demo Attiva - Nessun Login Richiesto
              </p>
              <p className="text-gray-400 text-lg">
                Benvenuto, <span className="text-white font-semibold">Demo Player</span>
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Hai inserito l&apos;ID e caricato l&apos;analisi della partita. 
                <span className="text-purple-400 font-semibold"> Registrati</span> per salvare i tuoi dati e accedere a tutte le funzionalità.
              </p>
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-xs">
                  💡 La dashboard è accessibile senza autenticazione per la modalità demo.
                </p>
              </div>
              
              {/* Client Component for Verification */}
              <DashboardClient />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Performance Overview - Demo */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Performance Overview</h2>
                <p className="text-gray-400 text-sm">
                  Metriche aggregate basate sulle tue ultime partite
                </p>
              </div>
              <div className="text-center py-8 text-gray-400">
                <p>Registrati per vedere le tue performance aggregate.</p>
                <p className="text-sm mt-2">
                  La demo mostra solo l&apos;analisi della tua ultima partita.
                </p>
              </div>
            </div>

            {/* Card 2: Task Status - Demo */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Task Status</h2>
                <p className="text-gray-400 text-sm">
                  Le tue task di coaching attive
                </p>
              </div>
              <div className="text-center py-8 text-gray-400">
                <p>Nessun task attivo al momento.</p>
                <p className="text-sm mt-2">
                  <span className="text-purple-400">Registrati</span> per accedere alle task di coaching personalizzate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user - fetch profile overview
  let overview;
  try {
    overview = await getProfileOverview(user.id);
  } catch (error) {
    console.error('[dashboard] Error fetching overview:', error);
    // Redirect to onboarding if profile doesn't exist
    redirect('/onboarding/profile');
  }

  // Redirect to onboarding if not complete
  if (overview.profile.onboarding_status !== 'complete') {
    redirect('/onboarding/profile');
  }

  const stats = overview.statistics;
  const tasks = overview.recentTasks;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Dashboard
          </h1>
          <div className="space-y-2">
            <p className="text-gray-400">
              Benvenuto, <span className="text-white font-semibold">{overview.profile.in_game_name || overview.profile.nickname || 'Player'}</span>
            </p>
            {overview.profile.steam_id && (
              <p className="text-gray-500 text-sm">
                OpenDota Account ID: <span className="text-purple-400 font-mono">{overview.profile.steam_id}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Performance Overview */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Performance Overview</h2>
              <p className="text-gray-400 text-sm">
                Metriche aggregate basate sulle tue ultime partite
              </p>
            </div>

            {stats ? (
              <div className="space-y-6">
                {/* Aggressiveness Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-medium">Aggressiveness</span>
                    <span className="text-white font-bold text-xl">
                      {stats.avg_aggressiveness !== null
                        ? `${Math.round(stats.avg_aggressiveness)}/100`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500"
                      style={{
                        width: `${stats.avg_aggressiveness !== null ? stats.avg_aggressiveness : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Farm Efficiency Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-medium">Farm Efficiency</span>
                    <span className="text-white font-bold text-xl">
                      {stats.avg_farm_efficiency !== null
                        ? `${Math.round(stats.avg_farm_efficiency)}/100`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all duration-500"
                      style={{
                        width: `${stats.avg_farm_efficiency !== null ? stats.avg_farm_efficiency : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Macro Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-medium">Macro</span>
                    <span className="text-white font-bold text-xl">
                      {stats.avg_macro !== null ? `${Math.round(stats.avg_macro)}/100` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                      style={{
                        width: `${stats.avg_macro !== null ? stats.avg_macro : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Survivability Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-medium">Survivability</span>
                    <span className="text-white font-bold text-xl">
                      {stats.avg_survivability !== null
                        ? `${Math.round(stats.avg_survivability)}/100`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500"
                      style={{
                        width: `${stats.avg_survivability !== null ? stats.avg_survivability : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Nessuna statistica disponibile.</p>
                <p className="text-sm mt-2">
                  Importa alcune partite per vedere le tue performance aggregate.
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Task Status */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Task Status</h2>
              <p className="text-gray-400 text-sm">
                Le tue task di coaching attive
              </p>
            </div>

            {tasks && tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gray-900/50 rounded-lg p-6 border border-gray-700 hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-gray-400 text-sm">{task.description}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-3 ${
                          task.priority === 'high'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : task.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Progresso</span>
                        <span className="text-sm text-white font-semibold">
                          {task.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                          style={{ width: `${task.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Target vs Current */}
                    {task.target_value !== null && task.current_value !== null && (
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          Obiettivo: <span className="text-white font-medium">
                            {typeof task.target_value === 'number' ? task.target_value.toFixed(1) : 'N/A'}
                          </span>
                        </span>
                        <span className="text-gray-400">
                          Attuale: <span className="text-white font-medium">
                            {typeof task.current_value === 'number' ? task.current_value.toFixed(1) : 'N/A'}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Nessun task attivo al momento.</p>
                <p className="text-sm mt-2">
                  Le tue task di coaching appariranno qui quando saranno disponibili.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats Row (Optional) */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Winrate</p>
              <p className="text-2xl font-bold text-white">
                {stats.winrate !== null ? `${stats.winrate.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">KDA Medio</p>
              <p className="text-2xl font-bold text-white">
                {stats.avg_kda !== null ? stats.avg_kda.toFixed(2) : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">GPM Medio</p>
              <p className="text-2xl font-bold text-white">
                {stats.avg_gpm !== null ? Math.round(stats.avg_gpm) : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Task Attivi</p>
              <p className="text-2xl font-bold text-white">{stats.active_tasks_count}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

