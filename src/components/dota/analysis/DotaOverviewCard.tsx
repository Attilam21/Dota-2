'use client'

import { useEffect, useState } from 'react'
import { getHeroIconUrl, getHeroName } from '@/lib/dotaHeroes'
import { getRolePositionLabel } from '@/types/dotaAnalysis'
import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'
import { formatValueOrNA } from '@/utils/dotaFormatting'

interface DotaOverviewCardProps {
  analysis: DotaPlayerMatchAnalysis
  matchId: number
  accountId: number
}

/**
 * Componente per l'header/overview della dashboard analisi Dota 2
 * Mostra: Hero, ruolo, K/D/A, GPM, XPM, CS, durata match
 *
 * Dati letti da:
 * - analysis.rolePosition (da dota_player_match_analysis.role_position)
 * - match detail API per K/D/A, GPM, XPM, CS (da matches_digest o OpenDota)
 *
 * IMPORTANTE: Usa formatValueOrNA per mostrare "—" solo quando il valore è realmente null/undefined.
 */
export default function DotaOverviewCard({
  analysis,
  matchId,
  accountId,
}: DotaOverviewCardProps) {
  // Log tracciabilità dati
  console.log('[DOTA-OVERVIEW] Rendering overview card', {
    matchId,
    accountId,
    rolePosition: analysis.rolePosition,
  })
  const [matchDetail, setMatchDetail] = useState<{
    heroId?: number
    durationSeconds?: number
    gpm?: number
    xpm?: number
    lastHits?: number
    denies?: number
    kills?: number
    deaths?: number
    assists?: number
  } | null>(null)
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false)

  // Carica dati aggiuntivi dal match detail se necessario
  useEffect(() => {
    let active = true
    async function loadMatchDetail() {
      try {
        setLoadingDetail(true)
        const res = await fetch(
          `/api/matches/detail?matchId=${matchId}&playerId=${accountId}`,
          { cache: 'no-store' },
        )
        if (res.ok) {
          const data = await res.json()
          if (active && data.player) {
            setMatchDetail({
              heroId: data.player.heroId,
              durationSeconds: data.match?.durationSeconds,
              gpm: data.player.gpm,
              xpm: data.player.xpm,
              lastHits: data.player.lastHits,
              denies: data.player.denies,
              kills: data.player.kills,
              deaths: data.player.deaths,
              assists: data.player.assists,
            })
          }
        }
      } catch (e) {
        console.error('Error loading match detail:', e)
      } finally {
        if (active) setLoadingDetail(false)
      }
    }
    loadMatchDetail()
    return () => {
      active = false
    }
  }, [matchId, accountId])

  const heroId = matchDetail?.heroId

  // formatValue ora usa formatValueOrNA da utils/dotaFormatting

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Overview Partita
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Hero e Ruolo */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
          <div className="mb-2 text-xs text-neutral-400">Hero & Ruolo</div>
          <div className="flex items-center gap-2">
            {heroId && getHeroIconUrl(heroId) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getHeroIconUrl(heroId)!}
                alt={getHeroName(heroId)}
                width={32}
                height={32}
                className="h-8 w-8 rounded"
              />
            ) : (
              <div className="h-8 w-8 rounded bg-neutral-800" />
            )}
            <div>
              <div className="text-sm font-medium text-neutral-200">
                {heroId ? getHeroName(heroId) : 'Hero N/A'}
              </div>
              <div className="text-xs text-neutral-400">
                {getRolePositionLabel(analysis.rolePosition)}
              </div>
            </div>
          </div>
        </div>

        {/* K/D/A */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
          <div className="mb-2 text-xs text-neutral-400">K/D/A</div>
          <div className="text-lg font-semibold text-neutral-200">
            {matchDetail?.kills ?? '—'} / {matchDetail?.deaths ?? '—'} /{' '}
            {matchDetail?.assists ?? '—'}
          </div>
          {matchDetail?.kills !== undefined &&
            matchDetail?.deaths !== undefined && (
              <div className="text-xs text-neutral-400">
                KDA:{' '}
                {(
                  (matchDetail.kills + (matchDetail.assists ?? 0)) /
                  Math.max(1, matchDetail.deaths)
                ).toFixed(2)}
              </div>
            )}
        </div>

        {/* GPM / XPM */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
          <div className="mb-2 text-xs text-neutral-400">GPM / XPM</div>
          <div className="text-lg font-semibold text-neutral-200">
            {formatValueOrNA(matchDetail?.gpm)} /{' '}
            {formatValueOrNA(matchDetail?.xpm)}
          </div>
        </div>

        {/* CS / Denies */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
          <div className="mb-2 text-xs text-neutral-400">CS / Denies</div>
          <div className="text-lg font-semibold text-neutral-200">
            {formatValueOrNA(matchDetail?.lastHits)} /{' '}
            {formatValueOrNA(matchDetail?.denies)}
          </div>
        </div>
      </div>

      {/* Durata match - mostra solo se disponibile */}
      {matchDetail?.durationSeconds && (
        <div className="mt-4 text-xs text-neutral-400">
          Durata: {Math.round(matchDetail.durationSeconds / 60)} minuti
        </div>
      )}

      {loadingDetail && (
        <div className="mt-2 text-xs text-neutral-500">
          Caricamento dettagli aggiuntivi…
        </div>
      )}
    </div>
  )
}
