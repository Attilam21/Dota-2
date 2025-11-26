import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // Fetch user statistics
    const { data: stats } = await supabaseAdmin
      .from('user_statistics')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!stats) {
      return NextResponse.json({ error: 'User statistics not found' }, { status: 404 });
    }

    const tasks = [];

    // Generate tasks based on metrics below thresholds
    if (stats.avg_aggressiveness < 50) {
      tasks.push({
        user_id,
        task_type: 'aggressiveness',
        title: 'Migliora la tua Aggressività',
        description: 'La tua kill participation è sotto la media. Cerca di partecipare di più ai teamfight.',
        priority: stats.avg_aggressiveness < 30 ? 'high' : 'medium',
        target_value: 60,
        current_value: stats.avg_aggressiveness,
        progress_percentage: Math.round((stats.avg_aggressiveness / 60) * 100),
      });
    }

    if (stats.avg_farm_efficiency < 50) {
      tasks.push({
        user_id,
        task_type: 'farm_efficiency',
        title: 'Ottimizza il tuo Farm',
        description: 'Migliora la gestione delle risorse e il farming per aumentare il tuo GPM.',
        priority: stats.avg_farm_efficiency < 30 ? 'high' : 'medium',
        target_value: 60,
        current_value: stats.avg_farm_efficiency,
        progress_percentage: Math.round((stats.avg_farm_efficiency / 60) * 100),
      });
    }

    if (stats.avg_macro < 50) {
      tasks.push({
        user_id,
        task_type: 'macro',
        title: 'Migliora il Macro Gameplay',
        description: 'Focalizzati su decisioni macro, visione mappa e timing degli item.',
        priority: stats.avg_macro < 30 ? 'high' : 'medium',
        target_value: 60,
        current_value: stats.avg_macro,
        progress_percentage: Math.round((stats.avg_macro / 60) * 100),
      });
    }

    if (stats.avg_survivability < 50) {
      tasks.push({
        user_id,
        task_type: 'survivability',
        title: 'Riduci le Morte Evitabili',
        description: 'Evita di morire in situazioni evitabili. Migliora il posizionamento.',
        priority: stats.avg_survivability < 30 ? 'high' : 'medium',
        target_value: 60,
        current_value: stats.avg_survivability,
        progress_percentage: Math.round((stats.avg_survivability / 60) * 100),
      });
    }

    if (stats.winrate < 50) {
      tasks.push({
        user_id,
        task_type: 'general',
        title: 'Aumenta il Winrate',
        description: 'Il tuo winrate è sotto il 50%. Analizza le partite perse per identificare pattern.',
        priority: stats.winrate < 40 ? 'high' : 'medium',
        target_value: 55,
        current_value: stats.winrate,
        progress_percentage: Math.round((stats.winrate / 55) * 100),
      });
    }

    // Insert tasks
    if (tasks.length > 0) {
      const { error } = await supabaseAdmin
        .from('coaching_tasks')
        .insert(tasks);

      if (error) {
        console.error('[coaching/generate] Error inserting tasks:', error);
        return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      tasks_generated: tasks.length,
    });
  } catch (error) {
    console.error('[coaching/generate] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

