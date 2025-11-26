import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // Fetch user statistics
    const { data: stats } = await supabaseAdmin
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!stats) {
      return NextResponse.json({
        winrate: 0,
        avg_kda: 0,
        avg_gpm: 0,
        avg_xpm: 0,
      });
    }

    return NextResponse.json({
      winrate: stats.winrate || 0,
      avg_kda: stats.avg_kda || 0,
      avg_gpm: stats.avg_gpm || 0,
      avg_xpm: stats.avg_xpm || 0,
    });
  } catch (error) {
    console.error('[dashboard/kpi] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

