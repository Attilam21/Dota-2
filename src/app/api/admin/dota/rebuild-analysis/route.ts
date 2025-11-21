/**
 * Admin Route: Rebuild Dota 2 Analysis Data
 *
 * POST /api/admin/dota/rebuild-analysis
 *
 * Recalculates and repopulates Dota 2 analysis tables for given matches.
 *
 * Body:
 * {
 *   "matches": [
 *     { "matchId": 123, "accountId": 456 },
 *     ...
 *   ]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "processed": 5,
 *   "errors": [],
 *   "results": [...]
 * }
 *
 * SECURITY: This route should be protected with admin authentication.
 * Currently, it's a placeholder - implement authentication before production use.
 */

import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabaseAdmin'

// Import the analysis calculation function
// We'll call the internal logic from the analysis route
async function rebuildAnalysisForMatch(
  matchId: number,
  accountId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Call the analysis endpoint internally
    // In production, you might want to extract the calculation logic to a shared function
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(
      `${baseUrl}/api/dota/matches/${matchId}/players/${accountId}/analysis`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Analysis API returned ${response.status}: ${errorText}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function POST(req: Request) {
  try {
    // TODO: Add admin authentication check here
    // const adminToken = req.headers.get('authorization')
    // if (!isValidAdminToken(adminToken)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await req.json()
    const { matches } = body

    if (!Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: matches array required' },
        { status: 400 },
      )
    }

    // Validate match structure
    for (const match of matches) {
      if (
        typeof match.matchId !== 'number' ||
        typeof match.accountId !== 'number'
      ) {
        return NextResponse.json(
          {
            error: `Invalid match structure: ${JSON.stringify(
              match,
            )}. Expected {matchId: number, accountId: number}`,
          },
          { status: 400 },
        )
      }
    }

    console.log(`[ADMIN] Rebuilding analysis for ${matches.length} matches`)

    const results: Array<{
      matchId: number
      accountId: number
      success: boolean
      error?: string
    }> = []

    // Process matches sequentially to avoid rate limiting
    // In production, you might want to add rate limiting or batch processing
    for (const match of matches) {
      const result = await rebuildAnalysisForMatch(
        match.matchId,
        match.accountId,
      )
      results.push({
        matchId: match.matchId,
        accountId: match.accountId,
        ...result,
      })

      // Small delay to avoid overwhelming OpenDota API
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    const successCount = results.filter((r) => r.success).length
    const errorCount = results.filter((r) => !r.success).length

    console.log(
      `[ADMIN] Rebuild complete: ${successCount} success, ${errorCount} errors`,
    )

    return NextResponse.json({
      success: true,
      processed: matches.length,
      successCount,
      errorCount,
      results,
    })
  } catch (error) {
    console.error('[ADMIN] Error in rebuild-analysis:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// GET endpoint for status check
export async function GET() {
  return NextResponse.json({
    message: 'Dota 2 Analysis Rebuild API',
    usage: 'POST with { matches: [{ matchId, accountId }, ...] }',
  })
}
