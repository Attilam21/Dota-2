import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Forzatura runtime Node.js (Vercel non deve usare Edge Runtime)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1"; // minimizza latenza in EU

// Timeout per fetch OpenDota (30 secondi)
const OPENDOTA_FETCH_TIMEOUT = 30000;

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

// Helper: validazione e sanitizzazione match data
function validateMatchData(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let matchId: number | null = null;

  try {
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
      const opendotaApiKey = process.env.OPENDOTA_API_KEY;
      if (!opendotaApiKey) {
        console.error(`[import-match] OPENDOTA_API_KEY not set, cannot retry for match_id ${matchId}`);
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
      console.error(`[import-match] Invalid match data structure for match_id ${matchId}`);
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_match_data",
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: "Match data validation failed",
        },
        { status: 502 }
      );
    }

    // --- Upsert su Supabase ---
    const upsertPayload = {
      match_id: matchId,
      data: matchData,
      source: "opendota",
      ingested_at: new Date().toISOString(),
    };

    const { error: supabaseError } = await supabaseAdmin
      .from("raw_matches")
      .upsert(upsertPayload, { onConflict: "match_id" });

    if (supabaseError) {
      console.error(`[import-match] Supabase upsert error for match_id ${matchId}:`, supabaseError);
      return NextResponse.json(
        {
          status: "error",
          error: "supabase_upsert_failed",
          match_id: matchId,
          provider: "opendota",
          stored: false,
          details: supabaseError.message || "Database operation failed",
        },
        { status: 500 }
      );
    }

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
