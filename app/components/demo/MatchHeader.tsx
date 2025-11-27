'use client';

interface MatchHeaderProps {
  match: any;
  playerData: any | null;
}

export function MatchHeader({ match, playerData }: MatchHeaderProps) {
  const duration = match.duration || 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const durationFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-gray-400 text-sm">Durata</p>
          <p className="text-white text-xl font-semibold">{durationFormatted}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Risultato</p>
          <p className={`text-xl font-semibold ${match.radiant_win ? 'text-green-400' : 'text-red-400'}`}>
            {match.radiant_win ? 'Vittoria Radiant' : 'Vittoria Dire'}
          </p>
        </div>
        {playerData && (
          <div>
            <p className="text-gray-400 text-sm">KDA</p>
            <p className="text-white text-xl font-semibold">
              {playerData.kills || 0} / {playerData.deaths || 0} / {playerData.assists || 0}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

