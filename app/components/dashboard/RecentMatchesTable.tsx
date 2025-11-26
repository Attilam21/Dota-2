import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface RecentMatchesTableProps {
  userId: string;
}

export async function RecentMatchesTable({ userId }: RecentMatchesTableProps) {
  const supabase = await createClient();

  // Fetch recent matches
  const { data: matches } = await supabase
    .from('matches_digest')
    .select('match_id, duration, radiant_win, match_date, included_in_coaching')
    .eq('user_id', userId)
    .order('match_date', { ascending: false, nullsFirst: false })
    .limit(20);

  // Fetch players for these matches
  const matchIds = matches?.map(m => m.match_id) || [];
  const { data: players } = matchIds.length > 0 ? await supabase
    .from('players_digest')
    .select('match_id, hero_id, player_slot, kills, deaths, assists')
    .eq('user_id', userId)
    .in('match_id', matchIds) : { data: null };

  const getPlayerForMatch = (matchId: number) => {
    return players?.find(p => p.match_id === matchId);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isShortMatch = (duration: number) => duration < 15 * 60;

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Partite Recenti</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Match ID</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Eroe</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Durata</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Risultato</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Data</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Stato Coaching</th>
              <th className="text-left py-3 px-4 text-gray-300 font-semibold">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {matches && matches.length > 0 ? (
              matches.map((match) => {
                const player = getPlayerForMatch(match.match_id);
                const won = match.radiant_win === (player?.player_slot && player.player_slot < 128);
                const shortMatch = isShortMatch(match.duration);

                return (
                  <tr key={match.match_id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="py-4 px-4 text-white">{match.match_id}</td>
                    <td className="py-4 px-4 text-gray-300">
                      {player?.hero_id ? `Hero ${player.hero_id}` : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {formatDuration(match.duration)}
                      {shortMatch && (
                        <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                          Corta
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={won ? 'text-green-400' : 'text-red-400'}>
                        {won ? 'Vittoria' : 'Sconfitta'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{formatDate(match.match_date)}</td>
                    <td className="py-4 px-4">
                      {match.included_in_coaching ? (
                        <span className="text-green-400">✓ Incluso</span>
                      ) : (
                        <span className="text-gray-500">✗ Escluso</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/dashboard/matches/${match.match_id}`}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        Analizza →
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  Nessuna partita trovata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

