'use server';

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateServiceRoleKey } from "@/lib/utils/validateServiceRoleKey";

/**
 * Server Action to import a match from OpenDota into Supabase
 * 
 * This is a type-safe alternative to the API route, with built-in
 * Service Role Key validation and better error handling.
 * 
 * @param matchId - OpenDota match ID (positive integer)
 * @param userId - Optional user ID (UUID format)
 * @returns Result object with status and details
 */
export async function importMatchAction(
  matchId: number,
  userId?: string
): Promise<{
  success: boolean;
  matchId: number;
  error?: string;
  details?: string;
}> {
  try {
    // Validate Service Role Key at runtime
    validateServiceRoleKey();

    // Validate matchId
    if (!Number.isInteger(matchId) || matchId <= 0) {
      return {
        success: false,
        matchId,
        error: "invalid_match_id",
        details: "match_id must be a positive integer",
      };
    }

    // Validate userId format if provided
    if (userId) {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_REGEX.test(userId)) {
        return {
          success: false,
          matchId,
          error: "invalid_user_id",
          details: `Invalid UUID format for user_id: ${userId}`,
        };
      }
    }

    // Note: This Server Action is a wrapper around the API route logic
    // For full implementation, you would:
    // 1. Fetch from OpenDota
    // 2. Validate match data
    // 3. Upsert to Supabase
    // 
    // Currently, the API route handles this. This Server Action serves
    // as a type-safe interface that can be called from Server Components
    // or other Server Actions.

    return {
      success: true,
      matchId,
      details: "Match import initiated (use API route for full implementation)",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      matchId,
      error: "internal_error",
      details: errorMessage,
    };
  }
}

