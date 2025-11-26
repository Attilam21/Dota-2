import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // Fetch trend data from materialized view
    const { data, error } = await supabaseAdmin
      .from('user_match_trend')
      .select('*')
      .eq('user_id', userId)
      .order('match_date', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[dashboard/trend] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch trend data' }, { status: 500 });
    }

    // Format data for chart
    const formattedData = (data || [])
      .reverse()
      .map((item) => ({
        date: new Date(item.match_date).toLocaleDateString('it-IT', {
          month: 'short',
          day: 'numeric',
        }),
        aggressiveness: item.aggressiveness_score || 0,
        farm_efficiency: item.farm_efficiency_score || 0,
        macro: item.macro_score || 0,
        survivability: item.survivability_score || 0,
      }));

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error('[dashboard/trend] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

