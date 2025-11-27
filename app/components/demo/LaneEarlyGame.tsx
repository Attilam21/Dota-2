'use client';

interface LaneEarlyGameProps {
  match: any;
  playerData: any | null;
  players: any[];
}

// Helper function per type guard
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function LaneEarlyGame({ match, playerData, players }: LaneEarlyGameProps) {
  // Calcola CS a 10 minuti (se disponibile nei dati)
  // Per ora usiamo dati mock, poi integreremo con dati reali da position_metrics
  const csAt10Value = (playerData?.position_metrics as any)?.cs_at_10;
  const csAt10: number | null = isNumber(csAt10Value) ? csAt10Value : null;
  
  const xpAt10Value = (playerData?.position_metrics as any)?.xp_at_10;
  const xpAt10: number | null = isNumber(xpAt10Value) ? xpAt10Value : null;
  
  // Winrate in lane (mock per ora, da calcolare da dati storici)
  const winrateInLane: number | null = null; // Da implementare con query su partite precedenti

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-6">Lane & Early Game</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Winrate in Lane */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Winrate in Lane</p>
          <p className="text-white text-2xl font-bold">
            {winrateInLane !== null && typeof winrateInLane === 'number' ? `${winrateInLane.toFixed(1)}%` : 'N/A'}
          </p>
          {winrateInLane === null && (
            <p className="text-gray-500 text-xs mt-1">non disponibile</p>
          )}
        </div>

        {/* CS a 10 min */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">CS a 10 min</p>
          <p className="text-white text-2xl font-bold">
            {csAt10 !== null && typeof csAt10 === 'number' ? csAt10.toFixed(1) : 'N/A'}
          </p>
          {csAt10 === null && (
            <p className="text-gray-500 text-xs mt-1">non disponibile</p>
          )}
        </div>

        {/* XP a 10 min */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">XP a 10 min</p>
          <p className="text-white text-2xl font-bold">
            {xpAt10 !== null && typeof xpAt10 === 'number' ? xpAt10.toLocaleString() : 'N/A'}
          </p>
          {xpAt10 === null && (
            <p className="text-gray-500 text-xs mt-1">non disponibile</p>
          )}
        </div>

        {/* First Blood */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">First Blood</p>
          <p className="text-white text-2xl font-bold">N/A</p>
          <p className="text-gray-500 text-xs mt-1">non disponibile</p>
        </div>
      </div>
    </div>
  );
}
