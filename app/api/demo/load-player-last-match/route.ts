import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

// Timeout per fetch OpenDota (30 secondi)
const OPENDOTA_FETCH_TIMEOUT = 30000;

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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Log method and URL for debugging
  console.log("[load-player-last-match] POST request received. URL:", request.url);
  console.log("[load-player-last-match] Request method:", request.method);

  try {
    // Parse request body
    let body: { account_id?: number; user_id?: string };
    try {
      body = await request.json();
      console.log("[load-player-last-match] Request body parsed:", { account_id: body.account_id });
    } catch (parseError) {
      console.error("[load-player-last-match] Failed to parse request body:", parseError);
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_request_body",
          details: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const accountId = body.account_id;
    const userId = body.user_id;

    // Validate account_id
    if (!accountId || typeof accountId !== "number" || accountId <= 0) {
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_account_id",
          details: "account_id must be a positive integer",
        },
        { status: 400 }
      );
    }

    console.log(`[demo/load-player-last-match] Processing account_id: ${accountId}`);

    // Step 1: Get last match from OpenDota
    const opendotaApiKey = process.env.OPENDOTA_API_KEY;
    const matchesUrl = `https://api.opendota.com/api/players/${accountId}/matches?limit=1${opendotaApiKey ? `&api_key=${opendotaApiKey}` : ""}`;

    console.log(`[demo/load-player-last-match] Fetching matches from OpenDota for account_id: ${accountId}`);

    let matchesResponse: Response;
    try {
      matchesResponse = await fetchWithTimeout(matchesUrl, {
        method: "GET",
        headers: {
          "User-Agent": "FZTH-Dota2-Analytics/1.0",
          Accept: "application/json",
        },
      });
    } catch (fetchError) {
      console.error(`[demo/load-player-last-match] Fetch error:`, fetchError);
      return NextResponse.json(
        {
          status: "error",
          error: "opendota_fetch_failed",
          details: "Failed to fetch matches from OpenDota API",
        },
        { status: 502 }
      );
    }

    if (!matchesResponse.ok) {
      const errorText = await matchesResponse.text().catch(() => "Unknown error");
      console.error(`[demo/load-player-last-match] OpenDota error: ${matchesResponse.status} - ${errorText}`);
      return NextResponse.json(
        {
          status: "error",
          error: "opendota_api_error",
          details: `OpenDota API returned status ${matchesResponse.status}`,
        },
        { status: matchesResponse.status >= 500 ? 502 : matchesResponse.status }
      );
    }

    const matches = await matchesResponse.json().catch(() => null);

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          error: "no_matches_found",
          details: `No matches found for account_id: ${accountId}`,
        },
        { status: 404 }
      );
    }

    const lastMatch = matches[0];
    const matchId = lastMatch.match_id;

    if (!matchId || typeof matchId !== "number") {
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_match_data",
          details: "Last match does not contain valid match_id",
        },
        { status: 502 }
      );
    }

    console.log(`[demo/load-player-last-match] Found last match_id: ${matchId} for account_id: ${accountId}`);

    // Step 2: Import match
    const importUrl = new URL("/api/opendota/import-match", request.url);
    importUrl.searchParams.set("match_id", matchId.toString());
    if (userId) {
      importUrl.searchParams.set("user_id", userId);
    }

    console.log(`[demo/load-player-last-match] Importing match_id: ${matchId}`);

    const importResponse = await fetch(importUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!importResponse.ok) {
      const importError = await importResponse.json().catch(() => ({ error: "Unknown error" }));
      console.error(`[demo/load-player-last-match] Import error:`, importError);
      return NextResponse.json(
        {
          status: "error",
          error: "import_failed",
          details: `Failed to import match: ${importError.error || "Unknown error"}`,
          match_id: matchId,
        },
        { status: importResponse.status }
      );
    }

    const importResult = await importResponse.json();
    console.log(`[demo/load-player-last-match] Match imported:`, importResult);

    // Step 3: Build digest
    const buildDigestUrl = new URL("/api/opendota/build-digest", request.url);

    console.log(`[demo/load-player-last-match] Building digest for match_id: ${matchId}`);

    const digestResponse = await fetch(buildDigestUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        match_id: matchId,
        ...(userId && { user_id: userId }),
      }),
    });

    if (!digestResponse.ok) {
      const digestError = await digestResponse.json().catch(() => ({ error: "Unknown error" }));
      console.error(`[demo/load-player-last-match] Digest error:`, digestError);
      return NextResponse.json(
        {
          status: "error",
          error: "digest_failed",
          details: `Failed to build digest: ${digestError.error || "Unknown error"}`,
          match_id: matchId,
        },
        { status: digestResponse.status }
      );
    }

    const digestResult = await digestResponse.json();
    console.log(`[demo/load-player-last-match] Digest built:`, digestResult);

    // Step 4: Get player data from digest (with error handling)
    let playerData = null;
    let matchData = null;
    
    try {
      // CRITICAL: Wrap database operations in try/catch to prevent 500 errors
      const { data: playerDataResult, error: playerError } = await supabaseAdmin
        .from("players_digest")
        .select("*")
        .eq("match_id", matchId)
        .eq("account_id", accountId)
        .single();

      if (playerError) {
        console.warn(`[demo/load-player-last-match] Player data not found (non-critical):`, playerError);
      } else {
        playerData = playerDataResult;
      }
    } catch (dbError) {
      console.error(`[demo/load-player-last-match] Database error fetching player data:`, dbError);
      // Non è un errore critico, continuiamo senza player_data
    }

    // Get match data from digest (with error handling)
    try {
      // CRITICAL: Wrap database operations in try/catch to prevent 500 errors
      const { data: matchDataResult, error: matchError } = await supabaseAdmin
        .from("matches_digest")
        .select("*")
        .eq("match_id", matchId)
        .single();

      if (matchError) {
        console.warn(`[demo/load-player-last-match] Match data not found (non-critical):`, matchError);
      } else {
        matchData = matchDataResult;
      }
    } catch (dbError) {
      console.error(`[demo/load-player-last-match] Database error fetching match data:`, dbError);
      // Non è un errore critico, continuiamo senza match_data
    }

    const duration = Date.now() - startTime;
    console.log(`[demo/load-player-last-match] Completed in ${duration}ms`);

    return NextResponse.json({
      status: "ok",
      account_id: accountId,
      match_id: matchId,
      player_data: playerData,
      match_data: matchData,
      import_result: importResult,
      digest_result: digestResult,
      duration_ms: duration,
    });
  } catch (error) {
    console.error(`[demo/load-player-last-match] Unexpected error:`, error);
    return NextResponse.json(
      {
        status: "error",
        error: "unexpected_error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Handler per metodi non supportati (Next.js App Router gestisce automaticamente, ma è esplicito)
export async function GET(request: NextRequest) {
  console.warn("[load-player-last-match] GET request received - method not allowed. URL:", request.url);
  console.warn("[load-player-last-match] This endpoint only accepts POST requests");
  return NextResponse.json(
    {
      status: "error",
      error: "method_not_allowed",
      details: "Questo endpoint accetta solo richieste POST",
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      status: "error",
      error: "method_not_allowed",
      details: "Questo endpoint accetta solo richieste POST",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      status: "error",
      error: "method_not_allowed",
      details: "Questo endpoint accetta solo richieste POST",
    },
    { status: 405 }
  );
}

