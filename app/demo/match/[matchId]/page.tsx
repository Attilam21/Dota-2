import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MatchAnalysisDashboard } from '@/app/components/demo/MatchAnalysisDashboard';

export const dynamic = 'force-dynamic';

export default async function DemoMatchPage({
  params,
  searchParams,
}: {
  params: { matchId: string };
  searchParams: { account_id?: string };
}) {
  const supabase = await createClient();
  const matchId = parseInt(params.matchId);
  const accountId = searchParams.account_id ? parseInt(searchParams.account_id) : null;

  if (isNaN(matchId) || matchId <= 0) {
    redirect('/login');
  }

  // Fetch match data
  const { data: match, error: matchError } = await supabase
    .from('matches_digest')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (matchError || !match) {
    redirect('/login');
  }

  // Fetch player data if account_id is provided
  let playerData = null;
  if (accountId) {
    const { data: player } = await supabase
      .from('players_digest')
      .select('*')
      .eq('match_id', matchId)
      .eq('account_id', accountId)
      .single();
    
    playerData = player;
  }

  // Fetch all players for the match
  const { data: players } = await supabase
    .from('players_digest')
    .select('*')
    .eq('match_id', matchId)
    .order('player_slot');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <MatchAnalysisDashboard 
        match={match} 
        players={players || []} 
        playerData={playerData}
        accountId={accountId}
      />
    </div>
  );
}

