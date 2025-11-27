import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateServiceRoleKey } from "@/lib/utils/validateServiceRoleKey";

// Forzatura runtime Node.js (Vercel non deve usare Edge Runtime)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1"; // minimizza latenza in EU

// Timeout per fetch OpenDota (30 secondi)
const OPENDOTA_FETCH_TIMEOUT = 30000;

// Max payload size for JSONB (10MB)
const MAX_JSONB_SIZE = 10 * 1024 * 1024;

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper: fetch con timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = OPENDOTA_FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Helper: gestione errori HTTP OpenDota
function handleOpendotaError(status: number, details: string | null) {
  switch (status) {
    case 404:
      return {
        error: "match_not_found",
        http_status: status,
        details: "Match ID does not exist in OpenDota database",
      };
    case 429:
      return {
        error: "rate_limit_exceeded",
        http_status: status,
        details: "OpenDota API rate limit exceeded. Please retry later.",
      };
    case 500:
    case 502:
    case 503:
      return {
        error: "opendota_server_error",
        http_status: status,
        details: "OpenDota API server error",
      };
    default:
      return {
        error: "opendota_request_failed",
        http_status: status,
        details: details || "Unknown error from OpenDota API",
      };
  }
}

// Note: validateServiceRoleKey is imported from lib/utils/validateServiceRoleKey

// Helper: validazione UUID
function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

// Helper: validazione e sanitizzazione match data
function validateMatchData(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }
  
  // Verifica che match_id esista e sia un numero
  const record = data as Record<string, unknown>;
  if (typeof record.match_id !== "number" || record.match_id <= 0) {
    return false;
  }
  
  // Verifica che duration esista e sia un numero non negativo
  if (typeof record.duration !== "number" || record.duration < 0) {
    return false;
  }
  
  // Verifica che radiant_win esista e sia boolean
  if (typeof record.radiant_win !== "boolean") {
    return false;
  }
  
  return true;
}

// Helper: validazione dimensione payload
function validatePayloadSize(data: unknown): { valid: boolean; size: number; error?: string } {
  try {
    const jsonString = JSON.stringify(data);
    const size = new Blob([jsonString]).size;
    
    if (size > MAX_JSONB_SIZE) {
      return {
        valid: false,
        size,
        error: `Payload size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_JSONB_SIZE / 1024 / 1024}MB)`,
      };
    }
    
    return { valid: true, size };
  } catch (error) {
    return {
      valid: false,
      size: 0,
      error: `Failed to calculate payload size: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let matchId: number | null = null;

  try {
    // --- Validazione Service Role Key a runtime ---
    try {
      validateServiceRoleKey();
    } catch (keyError) {
      console.error("[import-match] Service Role Key validation failed:", keyError);
      return NextResponse.json(
        {
          status: "error",
          error: "service_role_key_missing",
          details: "SUPABASE_SERVICE_ROLE_KEY is not configured. Cannot perform database writes.",
        },
        { status: 500 }
      );
    }
    // --- Lettura e validazione del parametro match_id ---
    const matchIdParam = request.nextUrl.searchParams.get("match_id");
    if (!matchIdParam) {
      console.error("[import-match] Missing match_id parameter");
      return NextResponse.json(
        {
          status: "error",
          error: "missing_or_invalid_match_id",
          details: "match_id query parameter is required",
        },
        { status: 400 }
      );
    }

    matchId = Number.parseInt(matchIdParam, 10);
    if (Number.isNaN(matchId) || matchId <= 0 || !Number.isInteger(matchId)) {
      console.error(`[import-match] Invalid match_id: ${matchIdParam}`);
      return NextResponse.json(
        {
          status: "error",
          error: "missing_or_invalid_match_id",
          details: "match_id must be a positive integer",
        },
        { status: 400 }
      );
    }

    console.log(`[import-match] Processing match_id: ${matchId}`);

    // --- Chiamata OpenDota con strategia dual-fetch ---
    const baseUrl = `https://api.opendota.com/api/matches/${matchId}`;
    const fetchOptions: RequestInit = {
      method: "GET",
      headers: {
        "User-Agent": "FZTH-Dota2-Analytics/1.0",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
        Accept: "application/json",
      },
    };

    // Primo tentativo: dataset pubblico (senza chiave)
    let opendotaResponse: Response;
    try {
      opendotaResponse = await fetchWithTimeout(baseUrl, fetchOptions);
    } catch (fetchError) {
      console.error(`[import-match] Fetch timeout/error for match_id ${matchId}:`, fetchError);
      return NextResponse.json(
        {
          status: "error",
          error: "fetch_timeout",
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: "Request to OpenDota API timed out or failed",
        },
        { status: 504 }
      );
    }

    // Se fallisce, prova con la chiave
    if (!opendotaResponse.ok) {
      // Use CHIAVE_API_DOTA as specified (fallback to OPENDOTA_API_KEY for backward compatibility)
      const opendotaApiKey = process.env.CHIAVE_API_DOTA || process.env.OPENDOTA_API_KEY;
      if (!opendotaApiKey) {
        console.error(`[import-match] CHIAVE_API_DOTA (or OPENDOTA_API_KEY) not set, cannot retry for match_id ${matchId}`);
        const errorInfo = handleOpendotaError(
          opendotaResponse.status,
          await opendotaResponse.text().catch(() => null)
        );
        return NextResponse.json(
          {
            status: "error",
            ...errorInfo,
            match_id: matchId,
            provider: "opendota",
            stored: false,
          },
          { status: opendotaResponse.status >= 500 ? 502 : opendotaResponse.status }
        );
      }

      console.log(`[import-match] First attempt failed (${opendotaResponse.status}), retrying with API key for match_id ${matchId}`);
      const keyedUrl = `${baseUrl}?api_key=${opendotaApiKey}`;

      try {
        const secondAttempt = await fetchWithTimeout(keyedUrl, fetchOptions);
        if (!secondAttempt.ok) {
          const errorText = await secondAttempt.text().catch(() => null);
          const errorInfo = handleOpendotaError(secondAttempt.status, errorText);
          console.error(`[import-match] Both attempts failed for match_id ${matchId}:`, errorInfo);
          return NextResponse.json(
            {
              status: "error",
              ...errorInfo,
              match_id: matchId,
              provider: "opendota",
              stored: false,
            },
            { status: secondAttempt.status >= 500 ? 502 : secondAttempt.status }
          );
        }
        opendotaResponse = secondAttempt;
      } catch (retryError) {
        console.error(`[import-match] Retry fetch error for match_id ${matchId}:`, retryError);
        return NextResponse.json(
          {
            status: "error",
            error: "fetch_timeout",
            match_id: matchId,
            provider: "opendota",
            stored: false,
            details: "Retry request to OpenDota API timed out or failed",
          },
          { status: 504 }
        );
      }
    }

    // Parsing e validazione JSON response
    let matchData: unknown;
    try {
      matchData = await opendotaResponse.json();
    } catch (parseError) {
      console.error(`[import-match] JSON parse error for match_id ${matchId}:`, parseError);
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_response_format",
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: "OpenDota API returned invalid JSON",
        },
        { status: 502 }
      );
    }

    // Validazione struttura dati
    if (!validateMatchData(matchData)) {
      console.error(`[import-match] Invalid match data structure for match_id ${matchId}`, {
        hasMatchId: typeof (matchData as Record<string, unknown>).match_id === "number",
        hasDuration: typeof (matchData as Record<string, unknown>).duration === "number",
        hasRadiantWin: typeof (matchData as Record<string, unknown>).radiant_win === "boolean",
      });
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_match_data",
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: "Match data validation failed: missing or invalid required fields (match_id, duration, radiant_win)",
        },
        { status: 502 }
      );
    }

    // Validazione dimensione payload
    const payloadValidation = validatePayloadSize(matchData);
    if (!payloadValidation.valid) {
      console.error(`[import-match] Payload size validation failed for match_id ${matchId}:`, payloadValidation.error);
      return NextResponse.json(
        {
          status: "error",
          error: "payload_too_large",
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: payloadValidation.error || "Payload exceeds maximum allowed size",
        },
        { status: 413 }
      );
    }

    // Verifica che match_id nel payload corrisponda al match_id nel query param
    const dataMatchId = (matchData as Record<string, unknown>).match_id as number;
    if (dataMatchId !== matchId) {
      console.error(`[import-match] Match ID mismatch for match_id ${matchId}:`, {
        queryParam: matchId,
        dataMatchId,
      });
      return NextResponse.json(
        {
          status: "error",
          error: "match_id_mismatch",
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: `Match ID in query param (${matchId}) does not match match_id in data (${dataMatchId})`,
        },
        { status: 400 }
      );
    }

    // --- Lettura e validazione user_id opzionale dal query param ---
    const userIdParam = request.nextUrl.searchParams.get("user_id");
    let userId: string | undefined;
    
    if (userIdParam) {
      if (!isValidUUID(userIdParam)) {
        console.error(`[import-match] Invalid UUID format for user_id: ${userIdParam}`);
        return NextResponse.json(
          {
            status: "error",
            error: "invalid_user_id",
            match_id: matchId,
            provider: "opendota",
            stored: false,
            details: `Invalid UUID format for user_id: ${userIdParam}`,
          },
          { status: 400 }
        );
      }
      userId = userIdParam;
    }

    // --- Upsert su Supabase ---
    // Cast match_id to BigInt explicitly (PostgreSQL BIGINT)
    const upsertPayload = {
      match_id: Number(matchId), // Explicitly ensure it's a number
      data: matchData,
      source: "opendota",
      ingested_at: new Date().toISOString(),
      ...(userId && { user_id: userId }),
    };

    console.log(`[import-match] Upserting match_id ${matchId} to raw_matches`, {
      match_id: upsertPayload.match_id,
      hasUserId: !!userId,
      payloadSize: payloadValidation.size,
      payloadSizeMB: (payloadValidation.size / 1024 / 1024).toFixed(2),
    });

    // --- CRITICAL: Verify we're using Service Role Key (not Anon Key) ---
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!serviceRoleKey) {
      console.error(`[import-match] [CRITICAL] SUPABASE_SERVICE_ROLE_KEY is missing! Cannot perform database writes.`);
      return NextResponse.json(
        {
          status: "error",
          error: "service_role_key_missing",
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: "SUPABASE_SERVICE_ROLE_KEY is not configured. Database writes require Service Role Key to bypass RLS.",
        },
        { status: 500 }
      );
    }

    // Security check: Ensure we're NOT accidentally using Anon Key
    if (anonKey && serviceRoleKey === anonKey) {
      console.error(`[import-match] [CRITICAL SECURITY] SUPABASE_SERVICE_ROLE_KEY appears to be the same as NEXT_PUBLIC_SUPABASE_ANON_KEY! This is a security risk.`);
      return NextResponse.json(
        {
          status: "error",
          error: "security_configuration_error",
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: "Service Role Key and Anon Key are identical. This is a security misconfiguration.",
        },
        { status: 500 }
      );
    }

    console.log(`[import-match] [SECURITY] Using Service Role Key for database write (RLS bypass enabled)`);

    const { error: supabaseError, data: upsertData } = await supabaseAdmin
      .from("raw_matches")
      .upsert(upsertPayload, { onConflict: "match_id" });

    if (supabaseError) {
      // --- CRITICAL LOGGING: Distinguish RLS vs Constraint/Schema Violations ---
      
      // Check if error is RLS-related
      const isRLSError = 
        supabaseError.message?.toLowerCase().includes("row-level security") ||
        supabaseError.message?.toLowerCase().includes("rls") ||
        supabaseError.message?.toLowerCase().includes("permission denied") ||
        supabaseError.message?.toLowerCase().includes("new row violates row-level security policy") ||
        supabaseError.code === "42501"; // PostgreSQL: insufficient_privilege

      // Check if error is constraint/schema violation
      const isConstraintError = 
        supabaseError.code === "23505" || // unique_violation
        supabaseError.code === "23503" || // foreign_key_violation
        supabaseError.code === "23514" || // check_violation
        supabaseError.code === "22P02" || // invalid_text_representation (type mismatch)
        supabaseError.code === "23502" || // not_null_violation
        supabaseError.message?.toLowerCase().includes("constraint") ||
        supabaseError.message?.toLowerCase().includes("violates") ||
        supabaseError.message?.toLowerCase().includes("foreign key");

      // Determine error category
      let errorCategory: "RLS" | "CONSTRAINT" | "SCHEMA" | "UNKNOWN";
      let errorCode = "supabase_upsert_failed";
      let httpStatus = 500;
      let errorDetails = supabaseError.message || "Database operation failed";

      if (isRLSError) {
        errorCategory = "RLS";
        errorCode = "row_level_security_violation";
        errorDetails = `[RLS ERROR] Row-Level Security policy violation: ${supabaseError.message}. This indicates the Supabase client is NOT using Service Role Key, or RLS policies are blocking the operation. Verify SUPABASE_SERVICE_ROLE_KEY is correctly configured.`;
        httpStatus = 403; // Forbidden
      } else if (isConstraintError) {
        errorCategory = "CONSTRAINT";
        
        // Map specific constraint errors
        if (supabaseError.code === "23505") {
          errorCode = "duplicate_match_id";
          errorDetails = `[CONSTRAINT ERROR] Unique violation: Match ${matchId} already exists (upsert should handle this)`;
          console.warn(`[import-match] Duplicate match_id ${matchId} detected during upsert`);
        } else if (supabaseError.code === "23503") {
          errorCode = "foreign_key_violation";
          errorDetails = `[CONSTRAINT ERROR] Foreign key constraint violation: ${supabaseError.message}. Check that user_id references a valid user_profile.id if provided.`;
          httpStatus = 400;
        } else if (supabaseError.code === "22P02") {
          errorCode = "type_mismatch";
          errorDetails = `[SCHEMA ERROR] Type mismatch: ${supabaseError.message}. Check that match_id is a number (BIGINT) and user_id is a valid UUID format.`;
          httpStatus = 400;
        } else if (supabaseError.code === "23514") {
          errorCode = "check_constraint_violation";
          errorDetails = `[CONSTRAINT ERROR] Check constraint violation: ${supabaseError.message}. Data violates table check constraints.`;
          httpStatus = 400;
        } else if (supabaseError.code === "23502") {
          errorCode = "not_null_violation";
          errorDetails = `[SCHEMA ERROR] NOT NULL constraint violation: ${supabaseError.message}. A required column is missing or null.`;
          httpStatus = 400;
        } else {
          errorCode = "constraint_violation";
          errorDetails = `[CONSTRAINT ERROR] ${supabaseError.message}`;
          httpStatus = 400;
        }
      } else {
        errorCategory = "UNKNOWN";
        errorCode = "supabase_upsert_failed";
        errorDetails = `[UNKNOWN ERROR] ${supabaseError.message}`;
      }

      // --- COMPREHENSIVE ERROR LOGGING FOR VERCEL ---
      console.error(`[import-match] [DATABASE ERROR] Supabase upsert failed for match_id ${matchId}:`, {
        error_category: errorCategory,
        error_code: errorCode,
        supabase_error_code: supabaseError.code,
        supabase_message: supabaseError.message,
        supabase_details: supabaseError.details,
        supabase_hint: supabaseError.hint,
        http_status: httpStatus,
        payload: {
          match_id: upsertPayload.match_id,
          has_user_id: !!userId,
          user_id: userId || null,
          source: upsertPayload.source,
          data_keys: Object.keys(upsertPayload.data as Record<string, unknown>).slice(0, 10), // First 10 keys only
        },
        diagnostic: {
          is_rls_error: isRLSError,
          is_constraint_error: isConstraintError,
          service_role_key_configured: !!serviceRoleKey,
          using_service_role_key: true, // We're using supabaseAdmin
        },
      });

      // Additional diagnostic logging for RLS errors
      if (isRLSError) {
        console.error(`[import-match] [RLS DIAGNOSTIC] Row-Level Security error detected. This should NOT happen when using Service Role Key.`, {
          service_role_key_present: !!serviceRoleKey,
          service_role_key_prefix: serviceRoleKey?.substring(0, 10) + "...",
          anon_key_present: !!anonKey,
          keys_match: serviceRoleKey === anonKey,
          recommendation: "Verify SUPABASE_SERVICE_ROLE_KEY is correctly set in Vercel environment variables and matches the Service Role Key from Supabase dashboard.",
        });
      }

      return NextResponse.json(
        {
          status: "error",
          error: errorCode,
          error_category: errorCategory,
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: errorDetails,
          supabase_error_code: supabaseError.code,
          is_rls_error: isRLSError,
          is_constraint_error: isConstraintError,
        },
        { status: httpStatus }
      );
    }

    // Log successful upsert
    console.log(`[import-match] Successfully upserted match_id ${matchId}`, {
      match_id: upsertPayload.match_id,
      hasUserId: !!userId,
      upserted: !!upsertData,
    });

    const duration = Date.now() - startTime;
    console.log(`[import-match] Successfully ingested match_id ${matchId} in ${duration}ms`);

    // --- Risposta finale ---
    return NextResponse.json({
      status: "ok",
      match_id: matchId,
      provider: "opendota",
      stored: true,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[import-match] Unexpected error${matchId ? ` for match_id ${matchId}` : ""}:`, errorMessage);
    return NextResponse.json(
      {
        status: "error",
        error: "internal_server_error",
        match_id: matchId || null,
        provider: "opendota",
        stored: false,
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
