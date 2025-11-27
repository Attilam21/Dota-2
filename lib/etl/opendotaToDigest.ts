import { RawMatch, RawPlayer, MatchDigest, PlayerDigest } from "@/lib/types/opendota";
import { sanitizePlayerDigest } from "@/lib/utils/sanitizePlayerDigest";

// Helper: convert epoch timestamp to ISO string
function epochToISO(epoch: number | undefined): string | null {
  if (!epoch) return null;
  return new Date(epoch * 1000).toISOString();
}

// Helper: Safely extract numeric value, ensuring it's not an object/array
function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  // If it's an object or array, log warning and return null
  if (typeof value === "object") {
    console.warn(`[buildDigestFromRaw] Expected number but got object/array:`, {
      value_type: Array.isArray(value) ? "array" : "object",
      value_keys: typeof value === "object" && value !== null ? Object.keys(value).slice(0, 5) : [],
      value_sample: typeof value === "object" && value !== null 
        ? JSON.stringify(value).substring(0, 100) 
        : null,
    });
    return null;
  }
  return null;
}

// Helper: calculate KDA (with safe number extraction)
function calculateKDA(kills: unknown, deaths: unknown, assists: unknown): number | null {
  const safeKills = safeNumber(kills);
  const safeDeaths = safeNumber(deaths);
  const safeAssists = safeNumber(assists);
  
  if (safeKills === null || safeDeaths === null || safeAssists === null) return null;
  if (safeDeaths === 0) return safeKills + safeAssists;
  return (safeKills + safeAssists) / safeDeaths;
}

// Helper: calculate kill participation (with safe number extraction)
function calculateKillParticipation(
  playerKills: unknown,
  playerAssists: unknown,
  totalTeamKills: number
): number | null {
  const safeKills = safeNumber(playerKills);
  const safeAssists = safeNumber(playerAssists);
  
  if (safeKills === null || safeAssists === null || totalTeamKills === 0) return null;
  return (safeKills + safeAssists) / totalTeamKills;
}

// Helper: build items object
function buildItemsObject(player: RawPlayer): Record<string, unknown> {
  const items: Record<string, unknown> = {};
  if (player.item_0 !== undefined) items.item_0 = player.item_0;
  if (player.item_1 !== undefined) items.item_1 = player.item_1;
  if (player.item_2 !== undefined) items.item_2 = player.item_2;
  if (player.item_3 !== undefined) items.item_3 = player.item_3;
  if (player.item_4 !== undefined) items.item_4 = player.item_4;
  if (player.item_5 !== undefined) items.item_5 = player.item_5;
  if (player.item_neutral !== undefined) items.item_neutral = player.item_neutral;
  return Object.keys(items).length > 0 ? items : {};
}

// Helper: safely extract JSONB object from raw player data
// Ensures the value is a valid object (not array, not primitive)
function safeJSONBObject(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  
  // Must be an object, not an array
  if (typeof value === "object" && !Array.isArray(value) && value !== null) {
    // Validate it's a proper object by attempting serialization
    try {
      const serialized = JSON.stringify(value);
      const parsed = JSON.parse(serialized);
      if (typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch (err) {
      console.warn(`[buildDigestFromRaw] Failed to serialize JSONB object:`, {
        error: err instanceof Error ? err.message : String(err),
        value_type: typeof value,
        value_sample: typeof value === "object" && value !== null 
          ? JSON.stringify(value).substring(0, 100) 
          : null,
      });
      return null;
    }
  }
  
  // If it's an array or primitive, log warning and return null
  if (typeof value === "object" && Array.isArray(value)) {
    console.warn(`[buildDigestFromRaw] Expected JSONB object but got array:`, {
      array_length: value.length,
      array_sample: JSON.stringify(value).substring(0, 100),
    });
    return null;
  }
  
  return null;
}

// Helper: calculate vision score (with safe number extraction)
function calculateVisionScore(
  observerWards: unknown,
  sentryWards: unknown
): number | null {
  const safeObs = safeNumber(observerWards);
  const safeSentry = safeNumber(sentryWards);
  
  if (safeObs === null && safeSentry === null) return null;
  const obs = safeObs || 0;
  const sentry = safeSentry || 0;
  return obs + sentry;
}

// Helper: build objectives summary
type ObjectiveSummary = {
  count: number;
  types: Record<string, number>;
};

function buildObjectivesSummary(objectives: Array<Record<string, unknown>> | undefined): Record<string, unknown> | null {
  if (!objectives || objectives.length === 0) return null;
  
  const summary: ObjectiveSummary = {
    count: objectives.length,
    types: {},
  };
  
  objectives.forEach((obj) => {
    const type = obj.type as string;
    if (type) {
      summary.types[type] = (summary.types[type] ?? 0) + 1;
    }
  });
  
  return summary;
}

// Helper: build teamfight summary (with safe number extraction)
function buildTeamfightSummary(teamfights: Array<Record<string, unknown>> | undefined): Record<string, unknown> | null {
  if (!teamfights || teamfights.length === 0) return null;
  
  return {
    count: teamfights.length,
    total_duration: teamfights.reduce((sum, tf) => {
      const duration = safeNumber(tf.duration);
      return sum + (duration || 0);
    }, 0),
  };
}

// Helper: build economy summary (with safe number extraction)
function buildEconomySummary(players: RawPlayer[]): Record<string, unknown> | null {
  if (!players || players.length === 0) return null;
  
  const radiantGold = players
    .filter((p) => {
      const slot = safeNumber(p.player_slot);
      return slot !== null && slot < 128;
    })
    .reduce((sum, p) => {
      const netWorth = safeNumber(p.net_worth);
      return sum + (netWorth || 0);
    }, 0);
  
  const direGold = players
    .filter((p) => {
      const slot = safeNumber(p.player_slot);
      return slot !== null && slot >= 128;
    })
    .reduce((sum, p) => {
      const netWorth = safeNumber(p.net_worth);
      return sum + (netWorth || 0);
    }, 0);
  
  const totalGold = players.reduce((sum, p) => {
    const goldSpent = safeNumber(p.gold_spent);
    return sum + (goldSpent || 0);
  }, 0);
  
  const gpmSum = players.reduce((sum, p) => {
    const gpm = safeNumber(p.gold_per_min);
    return sum + (gpm || 0);
  }, 0);
  const avgGPM = players.length > 0 ? gpmSum / players.length : 0;
  
  return {
    radiant_total_networth: radiantGold,
    dire_total_networth: direGold,
    total_gold_spent: totalGold,
    average_gpm: avgGPM,
  };
}

// Main ETL function
export function buildDigestFromRaw(raw: RawMatch): { match: MatchDigest; players: PlayerDigest[] } {
  // Validate required fields (defensive check)
  if (typeof raw.match_id !== "number" || raw.match_id <= 0) {
    throw new Error(`Invalid match_id: ${raw.match_id}`);
  }
  if (typeof raw.duration !== "number" || raw.duration < 0) {
    throw new Error(`Invalid duration: ${raw.duration}`);
  }
  if (typeof raw.radiant_win !== "boolean") {
    throw new Error(`Invalid radiant_win: ${raw.radiant_win}`);
  }
  if (!Array.isArray(raw.players) || raw.players.length === 0) {
    throw new Error(`Invalid players array: ${raw.players}`);
  }

  // Build MatchDigest with safe defaults
  const match: MatchDigest = {
    match_id: raw.match_id,
    duration: raw.duration ?? 0,
    start_time: epochToISO(raw.start_time),
    radiant_win: raw.radiant_win ?? false,
    radiant_score: raw.radiant_score ?? null,
    dire_score: raw.dire_score ?? null,
    game_mode: raw.game_mode ?? null,
    lobby_type: raw.lobby_type ?? null,
    objectives_summary: buildObjectivesSummary(raw.objectives),
    teamfight_summary: buildTeamfightSummary(raw.teamfights),
    economy_summary: buildEconomySummary(raw.players),
  };

  // Calculate total team kills for kill participation (with safe number extraction)
  const radiantKills = raw.players
    .filter((p) => {
      const slot = safeNumber(p.player_slot);
      return slot !== null && slot < 128;
    })
    .reduce((sum, p) => {
      const kills = safeNumber(p.kills);
      return sum + (kills || 0);
    }, 0);
  
  const direKills = raw.players
    .filter((p) => {
      const slot = safeNumber(p.player_slot);
      return slot !== null && slot >= 128;
    })
    .reduce((sum, p) => {
      const kills = safeNumber(p.kills);
      return sum + (kills || 0);
    }, 0);

  // Build PlayerDigest array with validation
  const players: PlayerDigest[] = raw.players.map((player, index) => {
    // Safely extract required player fields
    const safePlayerSlot = safeNumber(player.player_slot);
    if (safePlayerSlot === null) {
      console.error(`[buildDigestFromRaw] Player at index ${index} has invalid player_slot:`, {
        player_slot: player.player_slot,
        type: typeof player.player_slot,
        is_object: typeof player.player_slot === "object",
        is_array: Array.isArray(player.player_slot),
      });
      throw new Error(`Player at index ${index} has invalid player_slot: ${JSON.stringify(player.player_slot)}`);
    }
    
    const safeHeroId = safeNumber(player.hero_id);
    if (safeHeroId === null) {
      console.error(`[buildDigestFromRaw] Player at index ${index} has invalid hero_id:`, {
        hero_id: player.hero_id,
        type: typeof player.hero_id,
        is_object: typeof player.hero_id === "object",
        is_array: Array.isArray(player.hero_id),
      });
      throw new Error(`Player at index ${index} has invalid hero_id: ${JSON.stringify(player.hero_id)}`);
    }
    
    const isRadiant = safePlayerSlot < 128;
    const teamKills = isRadiant ? radiantKills : direKills;

    const playerDigest: PlayerDigest = {
      match_id: raw.match_id,
      player_slot: safePlayerSlot,
      account_id: safeNumber(player.account_id),
      hero_id: safeHeroId,
      kills: safeNumber(player.kills),
      deaths: safeNumber(player.deaths),
      assists: safeNumber(player.assists),
      gold_per_min: safeNumber(player.gold_per_min),
      xp_per_min: safeNumber(player.xp_per_min),
      gold_spent: safeNumber(player.gold_spent),
      last_hits: safeNumber(player.last_hits),
      denies: safeNumber(player.denies),
      net_worth: safeNumber(player.net_worth),
      hero_damage: safeNumber(player.hero_damage),
      tower_damage: safeNumber(player.tower_damage),
      damage_taken: safeNumber(player.damage_taken),
      teamfight_participation: safeNumber(player.teamfight_participation),
      kda: calculateKDA(player.kills, player.deaths, player.assists),
      kill_participation: calculateKillParticipation(player.kills, player.assists, teamKills),
      lane: safeNumber(player.lane),
      lane_role: safeNumber(player.lane_role),
      vision_score: calculateVisionScore(player.observer_wards_placed, player.sentry_wards_placed),
      items: buildItemsObject(player),
      position_metrics: null, // Can be extended with position data if available
      // CRITICAL: Extract and validate complex JSONB fields
      kills_per_hero: safeJSONBObject(player.kills_per_hero),
      damage_targets: safeJSONBObject(player.damage_targets),
    };

    // Sanitize to remove any potential extra fields
    return sanitizePlayerDigest(playerDigest);
  });

  return { match, players };
}

