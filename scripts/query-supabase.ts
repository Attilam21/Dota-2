#!/usr/bin/env node

/**
 * Script per interrogare Supabase da command line
 * 
 * Uso:
 *   npx tsx scripts/query-supabase.ts matches_digest 8576841486
 *   npx tsx scripts/query-supabase.ts players_digest 8576841486
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Carica variabili d'ambiente da .env.local se esiste
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ Errore: SUPABASE_URL non trovata nelle variabili d'ambiente");
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error("❌ Errore: SUPABASE_SERVICE_ROLE_KEY non trovata nelle variabili d'ambiente");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function queryMatchesDigest(matchId: string) {
  console.log(`\n🔍 Query su matches_digest per match_id = ${matchId}\n`);
  
  const { data, error } = await supabase
    .from("matches_digest")
    .select("*")
    .eq("match_id", matchId)
    .single();

  if (error) {
    console.error("❌ Errore:", error.message);
    return;
  }

  if (!data) {
    console.log("⚠️  Nessun record trovato");
    return;
  }

  console.log("✅ Record trovato:");
  console.log(JSON.stringify(data, null, 2));
}

async function queryPlayersDigest(matchId: string) {
  console.log(`\n🔍 Query su players_digest per match_id = ${matchId}\n`);
  
  const { data, error } = await supabase
    .from("players_digest")
    .select("*")
    .eq("match_id", matchId)
    .order("player_slot", { ascending: true });

  if (error) {
    console.error("❌ Errore:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log("⚠️  Nessun record trovato");
    return;
  }

  console.log(`✅ Trovati ${data.length} player(s):\n`);
  
  data.forEach((player, index) => {
    console.log(`--- Player ${index + 1} (slot ${player.player_slot}) ---`);
    console.log(`Account ID: ${player.account_id ?? "N/A"}`);
    console.log(`Hero ID: ${player.hero_id}`);
    console.log(`K/D/A: ${player.kills}/${player.deaths}/${player.assists}`);
    console.log(`Keys presenti: [${Object.keys(player).join(", ")}]`);
    console.log("");
  });

  // Mostra anche il JSON completo del primo player per debug
  if (data.length > 0) {
    console.log("📋 JSON completo del primo player:");
    console.log(JSON.stringify(data[0], null, 2));
  }
}

async function queryRawMatches(matchId: string) {
  console.log(`\n🔍 Query su raw_matches per match_id = ${matchId}\n`);
  
  const { data, error } = await supabase
    .from("raw_matches")
    .select("match_id, source, ingested_at")
    .eq("match_id", matchId)
    .single();

  if (error) {
    console.error("❌ Errore:", error.message);
    return;
  }

  if (!data) {
    console.log("⚠️  Nessun record trovato");
    return;
  }

  console.log("✅ Record trovato:");
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
📖 Uso:
  npx tsx scripts/query-supabase.ts <tabella> [match_id]

Tabelle disponibili:
  - matches_digest    Query su matches_digest
  - players_digest    Query su players_digest
  - raw_matches       Query su raw_matches

Esempi:
  npx tsx scripts/query-supabase.ts matches_digest 8576841486
  npx tsx scripts/query-supabase.ts players_digest 8576841486
  npx tsx scripts/query-supabase.ts raw_matches 8576841486
    `);
    process.exit(1);
  }

  const table = args[0];
  const matchId = args[1];

  if (!matchId) {
    console.error("❌ Errore: match_id richiesto");
    process.exit(1);
  }

  try {
    switch (table) {
      case "matches_digest":
        await queryMatchesDigest(matchId);
        break;
      case "players_digest":
        await queryPlayersDigest(matchId);
        break;
      case "raw_matches":
        await queryRawMatches(matchId);
        break;
      default:
        console.error(`❌ Errore: tabella "${table}" non riconosciuta`);
        console.log("Tabelle disponibili: matches_digest, players_digest, raw_matches");
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Errore imprevisto:", error);
    process.exit(1);
  }
}

main();

