/**
 * Demo Player Helper
 *
 * Centralized function to get the demo player ID
 * Used when the app runs in demo mode (no login required)
 */

/**
 * Get the demo player account ID
 * Reads from DEMO_DOTA_ACCOUNT_ID env variable or uses default
 */
export function getDemoPlayerId(): number {
  const demoAccountId = process.env.DEMO_DOTA_ACCOUNT_ID

  if (!demoAccountId) {
    // Use default demo player ID if env is not set
    return 86745912
  }

  const demoAccountIdNum = Number(demoAccountId)
  if (!Number.isFinite(demoAccountIdNum) || demoAccountIdNum <= 0) {
    console.warn(
      '[DEMO-PLAYER] DEMO_DOTA_ACCOUNT_ID is not a valid number, using default',
    )
    return 86745912
  }

  return demoAccountIdNum
}
