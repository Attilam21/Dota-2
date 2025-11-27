import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API Route to fetch match data for demo dashboard
 * Used by DashboardClient to load match details from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');
    const accountId = searchParams.get('account_id');

    if (!matchId) {
      return NextResponse.json(
        { error: 'match_id is required' },
        { status: 400 }
      );
    }

    const matchIdNum = parseInt(matchId, 10);
    if (isNaN(matchIdNum) || matchIdNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid match_id' },
        { status: 400 }
      );
    }

    // Use anon key for read-only access (demo mode)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[demo/get-match-data] Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch match digest
    const { data: matchDigest, error: matchError } = await supabase
      .from('matches_digest')
      .select('*')
      .eq('match_id', matchIdNum)
      .single();

    if (matchError) {
      console.error('[demo/get-match-data] Error fetching match digest:', matchError);
    }

    // Fetch player digest if account_id is provided
    let playerDigest = null;
    if (accountId) {
      const accountIdNum = parseInt(accountId, 10);
      if (!isNaN(accountIdNum) && accountIdNum > 0) {
        const { data: playerData, error: playerError } = await supabase
          .from('players_digest')
          .select('*')
          .eq('match_id', matchIdNum)
          .eq('account_id', accountIdNum)
          .single();

        if (playerError) {
          console.error('[demo/get-match-data] Error fetching player digest:', playerError);
        } else {
          playerDigest = playerData;
        }
      }
    }

    return NextResponse.json({
      status: 'ok',
      match_id: matchIdNum,
      match: matchDigest,
      player: playerDigest,
    });
  } catch (error) {
    console.error('[demo/get-match-data] Unexpected error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

