import { PlayerDigest } from "@/lib/types/opendota";

/**
 * Sanitizes a PlayerDigest object by keeping only valid properties.
 * Removes any extra fields that might come from OpenDota JSON.
 * Constructs a new object with only the whitelisted properties.
 * 
 * @param player - Potentially dirty PlayerDigest object
 * @returns Clean PlayerDigest object with only whitelisted properties
 */
export function sanitizePlayerDigest(player: PlayerDigest): PlayerDigest {
  return {
    match_id: player.match_id,
    player_slot: player.player_slot,
    account_id: player.account_id ?? null,
    hero_id: player.hero_id,
    kills: player.kills ?? null,
    deaths: player.deaths ?? null,
    assists: player.assists ?? null,
    gold_per_min: player.gold_per_min ?? null,
    xp_per_min: player.xp_per_min ?? null,
    gold_spent: player.gold_spent ?? null,
    last_hits: player.last_hits ?? null,
    denies: player.denies ?? null,
    net_worth: player.net_worth ?? null,
    hero_damage: player.hero_damage ?? null,
    tower_damage: player.tower_damage ?? null,
    damage_taken: player.damage_taken ?? null,
    teamfight_participation: player.teamfight_participation ?? null,
    kda: player.kda ?? null,
    kill_participation: player.kill_participation ?? null,
    lane: player.lane ?? null,
    lane_role: player.lane_role ?? null,
    vision_score: player.vision_score ?? null,
    items: player.items ?? null,
    position_metrics: player.position_metrics ?? null,
  };
}

