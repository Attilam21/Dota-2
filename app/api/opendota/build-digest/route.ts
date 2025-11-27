import { NextRequest, NextResponse } from "next/server";
import { buildDigestFromRaw } from "@/lib/etl/opendotaToDigest";
import { RawMatch } from "@/lib/types/opendota";
import { sanitizePlayerDigest } from "@/lib/utils/sanitizePlayerDigest";

// Forzatura runtime Node.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

// CRITICAL: Initialize Supabase admin client at module level to avoid hoisting issues
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Ensure supabaseAdmin is available (defensive check)
  if (!supabaseAdmin) {
    console.error("[build-digest] supabaseAdmin client is not initialized");
    return NextResponse.json(
      {
        status: "error",
        error: "database_client_not_initialized",
        details: "Supabase admin client failed to initialize",
      },
      { status: 500 }
    );
  }

  try {
    let body: { match_id?: number; user_id?: string };
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

    const rawMatchId = body.match_id;
    const userId = body.user_id;
    if (
      typeof rawMatchId !== "number" ||
      !Number.isInteger(rawMatchId) ||
      rawMatchId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid match_id. Must be a positive integer." },
        { status: 400 }
      );
    }

    const matchId: number = rawMatchId;
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

    // Enhanced runtime validation
    const rawMatch = rawData as Record<string, unknown>;
    
    // Validate required match fields
    if (typeof rawMatch.match_id !== "number" || rawMatch.match_id <= 0) {
      console.error(`[build-digest] Invalid or missing match_id for match_id ${matchId}`, {
        match_id: rawMatch.match_id,
        type: typeof rawMatch.match_id,
      });
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_raw_match_structure",
          match_id: matchId,
          details: "Raw match data is missing or has invalid match_id",
        },
        { status: 500 }
      );
    }

    if (typeof rawMatch.duration !== "number" || rawMatch.duration < 0) {
      console.error(`[build-digest] Invalid or missing duration for match_id ${matchId}`, {
        duration: rawMatch.duration,
        type: typeof rawMatch.duration,
      });
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_raw_match_structure",
          match_id: matchId,
          details: "Raw match data is missing or has invalid duration",
        },
        { status: 500 }
      );
    }

    if (typeof rawMatch.radiant_win !== "boolean") {
      console.error(`[build-digest] Invalid or missing radiant_win for match_id ${matchId}`, {
        radiant_win: rawMatch.radiant_win,
        type: typeof rawMatch.radiant_win,
      });
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_raw_match_structure",
          match_id: matchId,
          details: "Raw match data is missing or has invalid radiant_win",
        },
        { status: 500 }
      );
    }

    // Validate players array
    if (!Array.isArray(rawMatch.players)) {
      console.error(`[build-digest] Invalid or missing players array for match_id ${matchId}`, {
        players: rawMatch.players,
        type: typeof rawMatch.players,
      });
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_raw_match_structure",
          match_id: matchId,
          details: "Raw match data is missing or has invalid players array",
        },
        { status: 500 }
      );
    }

    if (rawMatch.players.length === 0) {
      console.error(`[build-digest] Empty players array for match_id ${matchId}`);
      return NextResponse.json(
        {
          status: "error",
          error: "invalid_raw_match_structure",
          match_id: matchId,
          details: "Raw match data has empty players array",
        },
        { status: 500 }
      );
    }

    // Validate each player has required fields
    for (let i = 0; i < rawMatch.players.length; i++) {
      const player = rawMatch.players[i] as Record<string, unknown>;
      if (!player || typeof player !== "object") {
        console.error(`[build-digest] Invalid player at index ${i} for match_id ${matchId}`, {
          player,
          type: typeof player,
        });
        return NextResponse.json(
          {
            status: "error",
            error: "invalid_raw_match_structure",
            match_id: matchId,
            details: `Player at index ${i} is not a valid object`,
          },
          { status: 500 }
        );
      }

      if (typeof player.player_slot !== "number") {
        console.error(`[build-digest] Invalid player_slot at index ${i} for match_id ${matchId}`, {
          player_slot: player.player_slot,
          type: typeof player.player_slot,
        });
        return NextResponse.json(
          {
            status: "error",
            error: "invalid_raw_match_structure",
            match_id: matchId,
            details: `Player at index ${i} is missing or has invalid player_slot`,
          },
          { status: 500 }
        );
      }

      if (typeof player.hero_id !== "number") {
        console.error(`[build-digest] Invalid hero_id at index ${i} for match_id ${matchId}`, {
          hero_id: player.hero_id,
          type: typeof player.hero_id,
        });
        return NextResponse.json(
          {
            status: "error",
            error: "invalid_raw_match_structure",
            match_id: matchId,
            details: `Player at index ${i} is missing or has invalid hero_id`,
          },
          { status: 500 }
        );
      }
    }

    // Log structure for debugging
    console.log(`[build-digest] Validated raw match structure for match_id ${matchId}`, {
      match_id: rawMatch.match_id,
      duration: rawMatch.duration,
      radiant_win: rawMatch.radiant_win,
      players_count: rawMatch.players.length,
      has_start_time: rawMatch.start_time !== undefined,
      has_objectives: rawMatch.objectives !== undefined,
      has_teamfights: rawMatch.teamfights !== undefined,
    });

    // Type assertion after validation (cast through unknown for safety)
    const validatedRawMatch = rawMatch as unknown as RawMatch;

    // Build digest using ETL function
    let digest;
    try {
      digest = buildDigestFromRaw(validatedRawMatch);
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

    // Upsert match digest (con user_id se fornito)
    const matchData = {
      ...digest.match,
      ...(userId && { user_id: userId }),
    };
    const { error: matchUpsertError } = await supabaseAdmin
      .from("matches_digest")
      .upsert(matchData, { onConflict: "match_id" });

    if (matchUpsertError) {
      console.error(`[build-digest] Match digest upsert error for match_id ${matchId}:`, {
        code: matchUpsertError.code,
        message: matchUpsertError.message,
        details: matchUpsertError.details,
      });
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

    // Sanitize payload: ensure only valid PlayerDigest properties are sent
    // This is a double-check in case any extra fields slipped through the ETL
    // CRITICAL: Force JSON.stringify() for all JSONB fields before Supabase insertion
    // Aggiungi user_id se fornito
    const sanitizedPlayers = digest.players.map((player) => {
      const sanitized = sanitizePlayerDigest(player);
      
      // Force explicit JSON serialization for JSONB columns
      // This ensures Supabase receives properly formatted JSONB data
      const finalPlayer: Record<string, unknown> = userId 
        ? { ...sanitized, user_id: userId } 
        : { ...sanitized };
      
      // CRITICAL: Explicitly serialize ALL JSONB fields using JSON.stringify() before Supabase upsert
      // This is the ONLY way to ensure Supabase receives properly formatted JSONB data
      // DO NOT pass objects directly - they must be serialized first
      
      // Serialize items - CRITICAL FIX
      if (finalPlayer.items !== null && finalPlayer.items !== undefined) {
        try {
          // Force serialization: stringify then parse to ensure clean object
          const serialized = JSON.stringify(finalPlayer.items);
          finalPlayer.items = JSON.parse(serialized);
        } catch (err) {
          console.error(`[build-digest] CRITICAL: Failed to serialize items for player ${finalPlayer.player_slot}:`, err);
          finalPlayer.items = null;
        }
      } else {
        finalPlayer.items = null;
      }
      
      // Serialize position_metrics - CRITICAL FIX
      if (finalPlayer.position_metrics !== null && finalPlayer.position_metrics !== undefined) {
        try {
          const serialized = JSON.stringify(finalPlayer.position_metrics);
          finalPlayer.position_metrics = JSON.parse(serialized);
        } catch (err) {
          console.error(`[build-digest] CRITICAL: Failed to serialize position_metrics for player ${finalPlayer.player_slot}:`, err);
          finalPlayer.position_metrics = null;
        }
      } else {
        finalPlayer.position_metrics = null;
      }
      
      // CRITICAL FIX: Serialize kills_per_hero (complex JSONB field from OpenDota)
      // This field MUST be serialized with JSON.stringify() before passing to Supabase
      if (finalPlayer.kills_per_hero !== null && finalPlayer.kills_per_hero !== undefined) {
        try {
          // Explicit JSON.stringify() serialization - DO NOT skip this step
          const serialized = JSON.stringify(finalPlayer.kills_per_hero);
          finalPlayer.kills_per_hero = JSON.parse(serialized);
        } catch (err) {
          console.error(`[build-digest] CRITICAL: Failed to serialize kills_per_hero for player ${finalPlayer.player_slot}:`, err);
          finalPlayer.kills_per_hero = null;
        }
      } else {
        finalPlayer.kills_per_hero = null;
      }
      
      // CRITICAL FIX: Serialize damage_targets (complex JSONB field from OpenDota)
      // This field MUST be serialized with JSON.stringify() before passing to Supabase
      if (finalPlayer.damage_targets !== null && finalPlayer.damage_targets !== undefined) {
        try {
          // Explicit JSON.stringify() serialization - DO NOT skip this step
          const serialized = JSON.stringify(finalPlayer.damage_targets);
          finalPlayer.damage_targets = JSON.parse(serialized);
        } catch (err) {
          console.error(`[build-digest] CRITICAL: Failed to serialize damage_targets for player ${finalPlayer.player_slot}:`, err);
          finalPlayer.damage_targets = null;
        }
      } else {
        finalPlayer.damage_targets = null;
      }
      
      return finalPlayer;
    });
    
    // Log JSONB fields for debugging (first player only) - AFTER map completes
    if (sanitizedPlayers.length > 0) {
      const firstPlayer = sanitizedPlayers[0];
      console.log(`[build-digest] JSONB fields serialized for player ${firstPlayer.player_slot}:`, {
        items_type: typeof firstPlayer.items,
        items_is_null: firstPlayer.items === null,
        kills_per_hero_type: typeof firstPlayer.kills_per_hero,
        kills_per_hero_is_null: firstPlayer.kills_per_hero === null,
        damage_targets_type: typeof firstPlayer.damage_targets,
        damage_targets_is_null: firstPlayer.damage_targets === null,
      });
    }

    // Log payload keys before upsert (without full JSON)
    const sampleKeys = sanitizedPlayers[0] ? Object.keys(sanitizedPlayers[0]) : [];
    console.log(`[build-digest] BEFORE UPSERT - match_id ${matchId}, players_count: ${sanitizedPlayers.length}, sample_keys: [${sampleKeys.join(", ")}]`);

    const { error: playersUpsertError } = await supabaseAdmin
      .from("players_digest")
      .upsert(sanitizedPlayers, { onConflict: "match_id,player_slot" });

    if (playersUpsertError) {
      const samplePlayer = sanitizedPlayers[0];
      console.error(`[build-digest] AFTER UPSERT - ERROR for match_id ${matchId}:`, {
        code: playersUpsertError.code,
        message: playersUpsertError.message,
        details: playersUpsertError.details,
        sample_account_id: samplePlayer?.account_id,
        sample_hero_id: samplePlayer?.hero_id,
        payload_keys: samplePlayer ? Object.keys(samplePlayer) : [],
      });
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

    console.log(`[build-digest] AFTER UPSERT - SUCCESS for match_id ${matchId}, players_count: ${sanitizedPlayers.length}`);

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
    console.error(`[build-digest] Unexpected error:`, errorMessage);
    return NextResponse.json(
      {
        status: "error",
        error: "internal_server_error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

