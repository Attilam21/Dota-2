'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LaneEarlyGame } from './LaneEarlyGame';
import { CSTimeline } from './CSTimeline';
import { MatchHeader } from './MatchHeader';

interface MatchAnalysisDashboardProps {
  match: any;
  players: any[];
  playerData: any | null;
  accountId: number | null;
}

export function MatchAnalysisDashboard({
  match,
  players,
  playerData,
  accountId,
}: MatchAnalysisDashboardProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Analisi Avanzata Match</h1>
              <p className="text-gray-400 text-sm mt-1">
                Analisi della partita #{match.match_id}
              </p>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              ← Torna al login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-gray-400 text-sm">
            I dati e i grafici sottostanti si riferiscono esclusivamente a questo match.
          </p>
        </div>

        {/* Match Header Info */}
        <MatchHeader match={match} playerData={playerData} />

        {/* Lane & Early Game Section */}
        <div className="mt-8">
          <LaneEarlyGame match={match} playerData={playerData} players={players} />
        </div>

        {/* CS Timeline Section */}
        <div className="mt-8">
          <CSTimeline match={match} playerData={playerData} />
        </div>

        {/* Additional sections can be added here */}
      </div>
    </div>
  );
}

