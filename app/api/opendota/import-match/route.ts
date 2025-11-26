import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Forzatura runtime Node.js (Vercel non deve usare Edge Runtime)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "fra1"; // minimizza latenza in EU

export async function GET(request: NextRequest) {
  try {
    // --- Lettura e validazione del parametro match_id ---
    const matchIdParam = request.nextUrl.searchParams.get("match_id");
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

    // --- Chiamata OpenDota con strategia dual-fetch ---
    const baseUrl = `https://api.opendota.com/api/matches/${matchId}`;

    // Primo tentativo: dataset pubblico (senza chiave)
    let opendotaResponse = await fetch(baseUrl, {
      method: "GET",
      headers: {
        "User-Agent": "FZTH-Dota2-Analytics/1.0",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
        Accept: "application/json",
      },
    });

    // Se fallisce, prova con la chiave
    if (!opendotaResponse.ok) {
      const opendotaApiKey = process.env.OPENDOTA_API_KEY;

      const keyedUrl = `${baseUrl}?api_key=${opendotaApiKey}`;
      const secondAttempt = await fetch(keyedUrl, {
        method: "GET",
        headers: {
          "User-Agent": "FZTH-Dota2-Analytics/1.0",
          "Cache-Control": "no-store",
          Connection: "keep-alive",
          Accept: "application/json",
        },
      });

      if (!secondAttempt.ok) {
        return NextResponse.json(
          {
            error: "opendota_request_failed",
            status: secondAttempt.status,
            details: await secondAttempt.text().catch(() => null),
          },
          { status: 502 }
        );
      }

      opendotaResponse = secondAttempt;
    }

    const matchData = await opendotaResponse.json();

    // --- Upsert su Supabase ---
    const { error: supabaseError } = await supabaseAdmin
      .from("raw_matches")
      .upsert(
        {
          match_id: matchId,
          data: matchData,
          source: "opendota",
          ingested_at: new Date().toISOString(),
        },
        { onConflict: "match_id" }
      );

    if (supabaseError) {
      return NextResponse.json(
        { error: "supabase_upsert_failed", details: supabaseError },
        { status: 500 }
      );
    }

    // --- Risposta finale ---
    return NextResponse.json({
      status: "ok",
      match_id: matchId,
      provider: "opendota",
      stored: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "internal_server_error", details: `${err}` },
      { status: 500 }
    );
  }
}
