/**
 * Componente Snapshot Stato Forma del Player
 * Mostra 4 card con trend recente: Winrate, KDA, Farm (GPM/XPM), Insight
 */

'use client'

import React from 'react'
import type { PlayerFormSnapshot } from '@/types/dotaSnapshot'
import {
  formatPercentageOrNA,
  formatNumberOrNA,
  isValueMissing,
} from '@/utils/dotaFormatting'

interface PlayerFormSnapshotSectionProps {
  snapshot: PlayerFormSnapshot
}

export default function PlayerFormSnapshotSection({
  snapshot,
}: PlayerFormSnapshotSectionProps): React.JSX.Element {
  // Se non ci sono dati, mostra messaggio neutro
  if (snapshot.sampleSizeTotal === 0) {
    return (
      <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">
          Snapshot Stato Forma
        </h2>
        <p className="text-sm text-neutral-400">
          Nessuna partita recente disponibile per calcolare lo stato di forma.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 space-y-4">
      <h2 className="text-lg font-semibold text-neutral-200">
        Snapshot Stato Forma (ultime partite)
      </h2>

      {/* Grid 4 card */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Winrate Trend */}
        <WinrateTrendCard snapshot={snapshot} />

        {/* Card 2: KDA Trend */}
        <KDATrendCard snapshot={snapshot} />

        {/* Card 3: Farm Trend */}
        <FarmTrendCard snapshot={snapshot} />

        {/* Card 4: Insight */}
        <InsightCard snapshot={snapshot} />
      </div>
    </div>
  )
}

// Card 1: Winrate Trend
function WinrateTrendCard({
  snapshot,
}: {
  snapshot: PlayerFormSnapshot
}): React.JSX.Element {
  const winrateRecent = snapshot.winrateRecent
  const winrateTotal = snapshot.winrateTotal
  const delta = snapshot.winrateDelta
  const trendLabel = snapshot.winrateTrendLabel

  // Badge di stato
  const badgeConfig =
    trendLabel === 'UP'
      ? { label: 'In miglioramento', color: 'bg-green-900/50 text-green-300' }
      : trendLabel === 'DOWN'
        ? { label: 'In calo', color: 'bg-red-900/50 text-red-300' }
        : { label: 'Stabile', color: 'bg-neutral-800/50 text-neutral-300' }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">
          Winrate Trend
        </h3>
        {trendLabel !== 'UNKNOWN' && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeConfig.color}`}
          >
            {badgeConfig.label}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-xs text-neutral-400">
            Ultime {snapshot.sampleSizeRecent} partite
          </div>
          <div className="text-xl font-bold text-neutral-100">
            {formatPercentageOrNA(winrateRecent, 1)}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-400">
            Ultime {snapshot.sampleSizeTotal} partite
          </div>
          <div className="text-lg font-semibold text-neutral-300">
            {formatPercentageOrNA(winrateTotal, 1)}
          </div>
        </div>

        {delta !== null && !isValueMissing(delta) && (
          <div className="text-xs text-neutral-500">
            Delta:{' '}
            <span
              className={
                delta > 0
                  ? 'text-green-400'
                  : delta < 0
                    ? 'text-red-400'
                    : 'text-neutral-400'
              }
            >
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-neutral-800 pt-2">
        <div
          className="text-[10px] text-neutral-500"
          title="Winrate calcolato come percentuale di vittorie sulle partite considerate"
        >
          📊 Trend basato su {snapshot.sampleSizeRecent}/
          {snapshot.sampleSizeTotal} partite
        </div>
      </div>
    </div>
  )
}

// Card 2: KDA Trend
function KDATrendCard({
  snapshot,
}: {
  snapshot: PlayerFormSnapshot
}): React.JSX.Element {
  const kdaRecent = snapshot.kdaRecent
  const kdaTotal = snapshot.kdaTotal
  const delta = snapshot.kdaDelta
  const trendLabel = snapshot.kdaTrendLabel

  const badgeConfig =
    trendLabel === 'UP'
      ? { label: 'Migliora', color: 'bg-green-900/50 text-green-300' }
      : trendLabel === 'DOWN'
        ? { label: 'Peggiora', color: 'bg-red-900/50 text-red-300' }
        : { label: 'Stabile', color: 'bg-neutral-800/50 text-neutral-300' }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">KDA Trend</h3>
        {trendLabel !== 'UNKNOWN' && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeConfig.color}`}
          >
            {badgeConfig.label}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-xs text-neutral-400">
            Ultime {snapshot.sampleSizeRecent} partite
          </div>
          <div className="text-xl font-bold text-neutral-100">
            {formatNumberOrNA(kdaRecent)}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-400">
            Ultime {snapshot.sampleSizeTotal} partite
          </div>
          <div className="text-lg font-semibold text-neutral-300">
            {formatNumberOrNA(kdaTotal)}
          </div>
        </div>

        {delta !== null && !isValueMissing(delta) && (
          <div className="text-xs text-neutral-500">
            Delta:{' '}
            <span
              className={
                delta > 0
                  ? 'text-green-400'
                  : delta < 0
                    ? 'text-red-400'
                    : 'text-neutral-400'
              }
            >
              {delta > 0 ? '+' : ''}
              {delta.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-neutral-800 pt-2">
        <div
          className="text-[10px] text-neutral-500"
          title="KDA medio calcolato su ultime X/Y partite"
        >
          📊 KDA = (Kill + Assist) / Death
        </div>
      </div>
    </div>
  )
}

// Card 3: Farm Trend (GPM/XPM)
function FarmTrendCard({
  snapshot,
}: {
  snapshot: PlayerFormSnapshot
}): React.JSX.Element {
  const gpmRecent = snapshot.gpmRecent
  const gpmTotal = snapshot.gpmTotal
  const gpmDelta = snapshot.gpmDelta
  const xpmRecent = snapshot.xpmRecent
  const xpmTotal = snapshot.xpmTotal
  const xpmDelta = snapshot.xpmDelta
  const trendLabel = snapshot.farmTrendLabel

  const badgeConfig =
    trendLabel === 'UP'
      ? { label: 'Migliora', color: 'bg-green-900/50 text-green-300' }
      : trendLabel === 'DOWN'
        ? { label: 'Peggiora', color: 'bg-red-900/50 text-red-300' }
        : { label: 'Stabile', color: 'bg-neutral-800/50 text-neutral-300' }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">Farm Trend</h3>
        {trendLabel !== 'UNKNOWN' && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeConfig.color}`}
          >
            {badgeConfig.label}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* GPM */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-neutral-400">GPM</span>
            {gpmDelta !== null && !isValueMissing(gpmDelta) && (
              <span
                className={`text-xs font-medium ${
                  gpmDelta > 0
                    ? 'text-green-400'
                    : gpmDelta < 0
                      ? 'text-red-400'
                      : 'text-neutral-400'
                }`}
              >
                {gpmDelta > 0 ? '↑' : gpmDelta < 0 ? '↓' : '→'}{' '}
                {Math.abs(gpmDelta).toFixed(0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-neutral-100">
              {formatNumberOrNA(gpmRecent)}
            </span>
            {gpmTotal !== null &&
              !isValueMissing(gpmTotal) &&
              gpmRecent !== null &&
              !isValueMissing(gpmRecent) && (
                <span className="text-xs text-neutral-500">
                  → {formatNumberOrNA(gpmTotal)}
                </span>
              )}
          </div>
        </div>

        {/* XPM */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-neutral-400">XPM</span>
            {xpmDelta !== null && !isValueMissing(xpmDelta) && (
              <span
                className={`text-xs font-medium ${
                  xpmDelta > 0
                    ? 'text-green-400'
                    : xpmDelta < 0
                      ? 'text-red-400'
                      : 'text-neutral-400'
                }`}
              >
                {xpmDelta > 0 ? '↑' : xpmDelta < 0 ? '↓' : '→'}{' '}
                {Math.abs(xpmDelta).toFixed(0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-neutral-100">
              {formatNumberOrNA(xpmRecent)}
            </span>
            {xpmTotal !== null &&
              !isValueMissing(xpmTotal) &&
              xpmRecent !== null &&
              !isValueMissing(xpmRecent) && (
                <span className="text-xs text-neutral-500">
                  → {formatNumberOrNA(xpmTotal)}
                </span>
              )}
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-neutral-800 pt-2">
        <div className="text-[10px] text-neutral-500">
          📊 Media ultime {snapshot.sampleSizeRecent}/{snapshot.sampleSizeTotal}{' '}
          partite
        </div>
      </div>
    </div>
  )
}

// Card 4: Insight
function InsightCard({
  snapshot,
}: {
  snapshot: PlayerFormSnapshot
}): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h3 className="mb-2 text-sm font-semibold text-neutral-200">
        Insight Automatico
      </h3>
      <p className="text-xs leading-relaxed text-neutral-300">
        {snapshot.insightText ||
          'Non ci sono abbastanza partite recenti per valutare il trend.'}
      </p>
    </div>
  )
}
