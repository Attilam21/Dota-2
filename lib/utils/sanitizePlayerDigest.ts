import { PlayerDigest } from "@/lib/types/opendota";

// Whitelist of valid PlayerDigest properties aligned with Supabase schema
const VALID_PLAYER_DIGEST_KEYS = [
  "match_id",
  "player_slot",
  "account_id",
  "hero_id",
  "kills",
  "deaths",
  "assists",
  "gold_per_min",
  "xp_per_min",
  "gold_spent",
  "last_hits",
  "denies",
  "net_worth",
  "hero_damage",
  "tower_damage",
  "damage_taken",
  "teamfight_participation",
  "kda",
  "kill_participation",
  "lane",
  "lane_role",
  "vision_score",
  "items",
  "position_metrics",
] as const;

/**
 * Sanitizes a PlayerDigest object by keeping only valid properties.
 * Removes any extra fields that might come from OpenDota JSON.
 * 
 * @param player - Potentially dirty PlayerDigest object
 * @returns Clean PlayerDigest object with only whitelisted properties
 */
export function sanitizePlayerDigest(player: PlayerDigest): PlayerDigest {
  const sanitized: Partial<PlayerDigest> = {};
  
  for (const key of VALID_PLAYER_DIGEST_KEYS) {
    if (key in player) {
      sanitized[key] = player[key];
    }
  }
  
  return sanitized as PlayerDigest;
}

