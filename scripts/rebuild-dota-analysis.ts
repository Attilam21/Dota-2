/**
 * Script: Rebuild Dota 2 Analysis Data
 *
 * Usage:
 *   pnpm tsx scripts/rebuild-dota-analysis.ts [match-ids-file.json]
 *
 * Input file format (JSON):
 * [
 *   { "matchId": 123, "accountId": 456 },
 *   ...
 * ]
 *
 * Or hardcode matches in this file.
 *
 * This script calls the rebuild API endpoint to recalculate analysis data.
 */

import * as fs from 'fs'
import * as path from 'path'

interface MatchInput {
  matchId: number
  accountId: number
}

async function rebuildAnalysis(matches: MatchInput[]): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const apiUrl = `${baseUrl}/api/admin/dota/rebuild-analysis`

  console.log(`[REBUILD] Starting rebuild for ${matches.length} matches...`)
  console.log(`[REBUILD] API URL: ${apiUrl}`)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add admin authentication header
        // 'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
      },
      body: JSON.stringify({ matches }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API returned ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log(`[REBUILD] Success:`, result)

    if (result.errorCount > 0) {
      console.error(`[REBUILD] ${result.errorCount} matches failed:`)
      result.results
        .filter((r: any) => !r.success)
        .forEach((r: any) => {
          console.error(
            `  - Match ${r.matchId}, Player ${r.accountId}: ${r.error}`,
          )
        })
    }

    console.log(
      `[REBUILD] Complete: ${result.successCount} success, ${result.errorCount} errors`,
    )
  } catch (error) {
    console.error('[REBUILD] Error:', error)
    process.exit(1)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  let matches: MatchInput[] = []

  if (args.length > 0) {
    // Read from file
    const filePath = path.resolve(args[0])
    console.log(`[REBUILD] Reading matches from: ${filePath}`)

    if (!fs.existsSync(filePath)) {
      console.error(`[REBUILD] File not found: ${filePath}`)
      process.exit(1)
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    matches = JSON.parse(fileContent)

    if (!Array.isArray(matches)) {
      console.error(
        '[REBUILD] Invalid file format: expected array of {matchId, accountId}',
      )
      process.exit(1)
    }
  } else {
    // Hardcoded matches for testing
    // Replace with your actual match IDs
    matches = [
      // Example:
      // { matchId: 7792959229, accountId: 86745912 },
    ]

    if (matches.length === 0) {
      console.log('[REBUILD] No matches specified. Usage:')
      console.log('  pnpm tsx scripts/rebuild-dota-analysis.ts matches.json')
      console.log('')
      console.log('Or edit this file to hardcode matches.')
      process.exit(0)
    }
  }

  console.log(`[REBUILD] Processing ${matches.length} matches...`)
  await rebuildAnalysis(matches)
}

main().catch((error) => {
  console.error('[REBUILD] Fatal error:', error)
  process.exit(1)
})
