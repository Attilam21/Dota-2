import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    // 1. Lettura e validazione del parametro match_id
    const searchParams = request.nextUrl.searchParams;
    const matchIdParam = searchParams.get("match_id");

    if (!matchIdParam) {
      return NextResponse.json(
        { error: "missing_or_invalid_match_id" },
        { status: 400 }
      );
    }

    const matchId = Number.parseInt(matchIdParam, 10);
    if (Number.isNaN(matchId) || matchId <= 0) {
      return NextResponse.json(
        { error: "missing_or_invalid_match_id" },
        { status: 400 }
      );
    }

    // 2. Verifica OPENDOTA_API_KEY
    const opendotaApiKey = process.env.OPENDOTA_API_KEY;
    if (!opendotaApiKey) {
      return NextResponse.json(
        { error: "OPENDOTA_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    // 3. Chiamata a OpenDota
    const opendotaUrl = `https://api.opendota.com/api/matches/${matchId}?api_key=${opendotaApiKey}`;
    
    const opendotaResponse = await fetch(opendotaUrl);

    if (!opendotaResponse.ok) {
      return NextResponse.json(
        {
          error: "opendota_request_failed",
          status: opendotaResponse.status,
        },
        { status: 502 }
      );
    }

    const matchData = await opendotaResponse.json();

    // 4. Upsert su Supabase
    const { error: supabaseError } = await supabaseAdmin
      .from("raw_matches")
      .upsert(
        {
          match_id: matchId,
          data: matchData,
          source: "opendota",
          ingested_at: new Date().toISOString(),
        },
        {
          onConflict: "match_id",
        }
      );

    if (supabaseError) {
      console.error("Supabase upsert error:", supabaseError);
      return NextResponse.json(
        { error: "supabase_upsert_failed" },
        { status: 500 }
      );
    }

    // 5. Risposta di successo
    return NextResponse.json({
      status: "ok",
      match_id: matchId,
      provider: "opendota",
      stored: true,
    });
  } catch (error) {
    console.error("Unexpected error in import-match:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

