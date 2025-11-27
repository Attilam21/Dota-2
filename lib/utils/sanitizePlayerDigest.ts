import { PlayerDigest } from "@/lib/types/opendota";

/**
 * Sanitizes a PlayerDigest object by keeping only valid properties.
 * Removes any extra fields that might come from OpenDota JSON.
 * Constructs a new object with only the whitelisted properties.
 * 
 * CRITICAL: This function ensures that only valid types are passed to Supabase.
 * It explicitly filters out any objects/arrays that might be in numeric fields.
 * 
 * @param player - Potentially dirty PlayerDigest object
 * @returns Clean PlayerDigest object with only whitelisted properties and correct types
 */
export function sanitizePlayerDigest(player: PlayerDigest): PlayerDigest {
  // Helper: Ensure value is a number or null (never an object/array)
  const ensureNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    // If it's an object/array, log and return null
    if (typeof value === "object") {
      console.warn(`[sanitizePlayerDigest] Discarding non-numeric value:`, {
        type: Array.isArray(value) ? "array" : "object",
        sample_keys: typeof value === "object" && value !== null ? Object.keys(value).slice(0, 3) : [],
      });
      return null;
    }
    // Try to parse string to number
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  // Helper: Ensure value is a valid JSONB object or null
  const ensureJSONB = (value: unknown): Record<string, unknown> | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      return value as Record<string, unknown>;
    }
    // If it's not a valid object, return null
    return null;
  };

  return {
    match_id: typeof player.match_id === "number" ? player.match_id : 0,
    player_slot: typeof player.player_slot === "number" ? player.player_slot : 0,
    account_id: ensureNumber(player.account_id),
    hero_id: typeof player.hero_id === "number" ? player.hero_id : 0,
    kills: ensureNumber(player.kills),
    deaths: ensureNumber(player.deaths),
    assists: ensureNumber(player.assists),
    gold_per_min: ensureNumber(player.gold_per_min),
    xp_per_min: ensureNumber(player.xp_per_min),
    gold_spent: ensureNumber(player.gold_spent),
    last_hits: ensureNumber(player.last_hits),
    denies: ensureNumber(player.denies),
    net_worth: ensureNumber(player.net_worth),
    hero_damage: ensureNumber(player.hero_damage),
    tower_damage: ensureNumber(player.tower_damage),
    damage_taken: ensureNumber(player.damage_taken),
    teamfight_participation: ensureNumber(player.teamfight_participation),
    kda: ensureNumber(player.kda),
    kill_participation: ensureNumber(player.kill_participation),
    lane: ensureNumber(player.lane),
    lane_role: ensureNumber(player.lane_role),
    vision_score: ensureNumber(player.vision_score),
    items: ensureJSONB(player.items),
    position_metrics: ensureJSONB(player.position_metrics),
  };
}

