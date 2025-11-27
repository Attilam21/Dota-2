import { createClient } from '@/lib/supabase/server';

/**
 * Profile Service
 * Handles profile-related operations including Steam account linking
 * and fetching profile overview data.
 */

export interface ProfileOverview {
  profile: {
    id: string;
    nickname: string | null;
    in_game_name: string | null;
    steam_id: number | null;
    role_preferred: string | null;
    region: string | null;
    skill_self_eval: string | null;
    avatar: string | null;
    onboarding_status: string;
  };
  statistics: {
    winrate: number | null;
    avg_kda: number | null;
    avg_gpm: number | null;
    avg_xpm: number | null;
    avg_aggressiveness: number | null;
    avg_farm_efficiency: number | null;
    avg_macro: number | null;
    avg_survivability: number | null;
    active_tasks_count: number;
    completed_tasks_count: number;
    weekly_progress_percentage: number;
  } | null;
  recentTasks: Array<{
    id: string;
    task_type: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    progress_percentage: number;
    target_value: number | null;
    current_value: number | null;
    created_at: string;
  }>;
}

/**
 * Links a Steam account to a user profile
 * @param userId - The user's UUID
 * @param steamId - The Steam account ID (BIGINT)
 * @returns Success status and updated profile
 */
export async function linkSteamAccount(
  userId: string,
  steamId: number
): Promise<{ success: boolean; error?: string; profile?: any }> {
  try {
    const supabase = await createClient();

    // Validate steamId is a positive number
    if (!steamId || steamId <= 0 || !Number.isInteger(steamId)) {
      return {
        success: false,
        error: 'Invalid Steam ID. Must be a positive integer.',
      };
    }

    // Update user profile with steam_id
    // Table mapping: profiles → user_profile
    const { data, error } = await supabase
      .from('user_profile')
      .update({
        steam_id: steamId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[profileService] Error linking Steam account:', error);
      return {
        success: false,
        error: error.message || 'Failed to link Steam account',
      };
    }

    return {
      success: true,
      profile: data,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[profileService] Unexpected error linking Steam account:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetches complete profile overview including:
 * - User profile data
 * - Aggregated statistics
 * - Top 3 most recent active tasks
 * @param userId - The user's UUID
 * @returns Profile overview data
 */
export async function getProfileOverview(
  userId: string
): Promise<ProfileOverview> {
  try {
    const supabase = await createClient();

    // Fetch user profile
    // Table mapping: profiles → user_profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[profileService] Error fetching profile:', profileError);
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Fetch user statistics
    const { data: statistics, error: statsError } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is OK (user might not have stats yet)
      console.error('[profileService] Error fetching statistics:', statsError);
    }

    // Fetch top 3 most recent active tasks
    // Table mapping: tasks → coaching_tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('coaching_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(3);

    if (tasksError) {
      console.error('[profileService] Error fetching tasks:', tasksError);
      // Don't throw, just return empty array
    }

    return {
      profile: {
        id: profile.id,
        nickname: profile.nickname,
        in_game_name: profile.in_game_name,
        steam_id: profile.steam_id,
        role_preferred: profile.role_preferred,
        region: profile.region,
        skill_self_eval: profile.skill_self_eval,
        avatar: profile.avatar,
        onboarding_status: profile.onboarding_status,
      },
      statistics: statistics
        ? {
            winrate: statistics.winrate ? Number(statistics.winrate) : null,
            avg_kda: statistics.avg_kda ? Number(statistics.avg_kda) : null,
            avg_gpm: statistics.avg_gpm ? Number(statistics.avg_gpm) : null,
            avg_xpm: statistics.avg_xpm ? Number(statistics.avg_xpm) : null,
            avg_aggressiveness: statistics.avg_aggressiveness
              ? Number(statistics.avg_aggressiveness)
              : null,
            avg_farm_efficiency: statistics.avg_farm_efficiency
              ? Number(statistics.avg_farm_efficiency)
              : null,
            avg_macro: statistics.avg_macro ? Number(statistics.avg_macro) : null,
            avg_survivability: statistics.avg_survivability
              ? Number(statistics.avg_survivability)
              : null,
            active_tasks_count: statistics.active_tasks_count || 0,
            completed_tasks_count: statistics.completed_tasks_count || 0,
            weekly_progress_percentage: statistics.weekly_progress_percentage || 0,
          }
        : null,
      recentTasks: (tasks || []).map((task) => ({
        id: task.id,
        task_type: task.task_type,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        progress_percentage: task.progress_percentage || 0,
        target_value: task.target_value ? Number(task.target_value) : null,
        current_value: task.current_value ? Number(task.current_value) : null,
        created_at: task.created_at,
      })),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[profileService] Error in getProfileOverview:', errorMessage);
    throw err;
  }
}

