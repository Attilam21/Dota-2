import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API Route to fetch match data for demo dashboard
 * Used by DashboardClient to load match details from Supabase
 * 
 * CRITICAL: This endpoint accepts GET requests only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[demo/get-match-data] GET request received');
    
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');
    const accountId = searchParams.get('account_id');

    console.log('[demo/get-match-data] Params:', { matchId, accountId });

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

    console.log('[demo/get-match-data] Fetching match digest for match_id:', matchIdNum);

    // Fetch match digest
    const { data: matchDigest, error: matchError } = await supabase
      .from('matches_digest')
      .select('*')
      .eq('match_id', matchIdNum)
      .single();

    if (matchError) {
      console.error('[demo/get-match-data] Error fetching match digest:', matchError);
    } else {
      console.log('[demo/get-match-data] Match digest found:', !!matchDigest);
    }

    // Fetch player digest if account_id is provided
    let playerDigest = null;
    if (accountId) {
      const accountIdNum = parseInt(accountId, 10);
      if (!isNaN(accountIdNum) && accountIdNum > 0) {
        console.log('[demo/get-match-data] Fetching player digest for account_id:', accountIdNum);
        
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
          console.log('[demo/get-match-data] Player digest found:', !!playerDigest);
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

// Explicitly reject other methods
export async function POST() {
  return NextResponse.json(
    {
      status: 'error',
      error: 'method_not_allowed',
      details: 'This endpoint only accepts GET requests',
    },
    { status: 405 }
  );
}
