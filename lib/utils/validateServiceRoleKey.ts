/**
 * Validates that SUPABASE_SERVICE_ROLE_KEY is set and has correct format
 * 
 * This function should be called at runtime (not module load time) to ensure
 * the key is available in the execution environment (e.g., Vercel).
 * 
 * @throws Error if key is missing or has unexpected format
 * @returns void (logs key prefix for debugging)
 */
export function validateServiceRoleKey(): void {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables");
  }
  
  if (key.trim().length === 0) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is set but empty");
  }
  
  // Log first 10 chars for debugging (safe to log, not sensitive)
  const keyPrefix = key.substring(0, 10);
  console.log(`[validateServiceRoleKey] Using Service Role Key: ${keyPrefix}...`);
  
  // Validate key format
  // New Supabase projects use 'sb_secret_' prefix
  // Legacy projects use JWT format starting with 'eyJ'
  const isValidFormat = key.startsWith("sb_secret_") || key.startsWith("eyJ");
  
  if (!isValidFormat) {
    console.warn(
      `[validateServiceRoleKey] [SECURITY] Service Role Key format unexpected. ` +
      `Expected 'sb_secret_...' (new format) or JWT 'eyJ...' (legacy), got: ${keyPrefix}...`
    );
    // Don't throw - might be a valid key in a different format
    // Just log a warning for security review
  }
  
  // Additional validation: check minimum length
  if (key.length < 20) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY appears to be too short (${key.length} chars). ` +
      "Expected at least 20 characters."
    );
  }
}

/**
 * Checks if Service Role Key is available (non-throwing version)
 * 
 * @returns true if key is set and non-empty, false otherwise
 */
export function hasServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!key && key.trim().length > 0;
}

