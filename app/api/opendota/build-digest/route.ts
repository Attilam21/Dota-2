import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildDigestFromRaw } from "@/lib/etl/opendotaToDigest";
import { RawMatch } from "@/lib/types/opendota";

// Forzatura runtime Node.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let matchId: number | null = null;

  try {
    // Parse request body
    let body: { match_id?: number };
    try {
      body = await request.json();
    } catch {
      console.error("[build-digest] Invalid JSON in request body");
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_request_body",
          details: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    // Validate match_id
    matchId = body.match_id;
    if (!matchId || typeof matchId !== "number" || matchId <= 0 || !Number.isInteger(matchId)) {
      console.error(`[build-digest] Invalid match_id: ${matchId}`);
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_match_id",
          details: "match_id must be a positive integer",
        },
        { status: 400 }
      );
    }

    console.log(`[build-digest] Processing match_id: ${matchId}`);

    // Fetch raw match from raw_matches table
    const { data: rawMatchRow, error: fetchError } = await supabaseAdmin
      .from("raw_matches")
      .select("data")
      .eq("match_id", matchId)
      .single();

    if (fetchError || !rawMatchRow) {
      console.error(`[build-digest] Raw match not found for match_id ${matchId}:`, fetchError);
      return NextResponse.json(
        {
          status: "error",
          error: "raw_match_not_found",
          match_id: matchId,
          details: "Raw match data not found in raw_matches table. Import the match first using /api/opendota/import-match",
        },
        { status: 404 }
      );
    }

    // Validate and type the raw data
    const rawData = rawMatchRow.data as unknown;
    if (!rawData || typeof rawData !== "object") {
      console.error(`[build-digest] Invalid raw data structure for match_id ${matchId}`);
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_raw_data",
          match_id: matchId,
          details: "Raw match data is not a valid object",
        },
        { status: 500 }
      );
    }

    // Type assertion with validation
    const rawMatch = rawData as RawMatch;
    if (!rawMatch.match_id || !rawMatch.players || !Array.isArray(rawMatch.players)) {
      console.error(`[build-digest] Raw match data missing required fields for match_id ${matchId}`);
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_raw_match_structure",
          match_id: matchId,
          details: "Raw match data is missing required fields (match_id, players)",
        },
        { status: 500 }
      );
    }

    // Build digest using ETL function
    let digest;
    try {
      digest = buildDigestFromRaw(rawMatch);
    } catch (etlError) {
      const errorMessage = etlError instanceof Error ? etlError.message : String(etlError);
      console.error(`[build-digest] ETL error for match_id ${matchId}:`, errorMessage);
      return NextResponse.json(
        {
          status: "error",
          error: "etl_processing_failed",
          match_id: matchId,
          details: `ETL processing failed: ${errorMessage}`,
        },
        { status: 500 }
      );
    }

    // Upsert match digest
    const { error: matchUpsertError } = await supabaseAdmin
      .from("matches_digest")
      .upsert(digest.match, { onConflict: "match_id" });

    if (matchUpsertError) {
      console.error(`[build-digest] Match digest upsert error for match_id ${matchId}:`, matchUpsertError);
      return NextResponse.json(
        {
          status: "error",
          error: "match_digest_upsert_failed",
          match_id: matchId,
          details: matchUpsertError.message || "Failed to upsert match digest",
        },
        { status: 500 }
      );
    }

    // Upsert player digests (delete existing and insert new for this match)
    const { error: deleteError } = await supabaseAdmin
      .from("players_digest")
      .delete()
      .eq("match_id", matchId);

    if (deleteError) {
      console.error(`[build-digest] Failed to delete existing player digests for match_id ${matchId}:`, deleteError);
      // Continue anyway, upsert will handle conflicts
    }

    const { error: playersUpsertError } = await supabaseAdmin
      .from("players_digest")
      .upsert(digest.players, { onConflict: "match_id,player_slot" });

    if (playersUpsertError) {
      console.error(`[build-digest] Player digests upsert error for match_id ${matchId}:`, playersUpsertError);
      return NextResponse.json(
        {
          status: "error",
          error: "player_digest_upsert_failed",
          match_id: matchId,
          details: playersUpsertError.message || "Failed to upsert player digests",
        },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[build-digest] Successfully built digest for match_id ${matchId} in ${duration}ms`);

    // Success response
    return NextResponse.json({
      status: "ok",
      match_id: matchId,
      match_digest_stored: true,
      players_digest_stored: true,
      players_count: digest.players.length,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[build-digest] Unexpected error${matchId ? ` for match_id ${matchId}` : ""}:`, errorMessage);
    return NextResponse.json(
      {
        status: "error",
        error: "internal_server_error",
        match_id: matchId || null,
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

