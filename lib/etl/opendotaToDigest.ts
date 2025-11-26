import { RawMatch, RawPlayer, MatchDigest, PlayerDigest } from "@/lib/types/opendota";
import { sanitizePlayerDigest } from "@/lib/utils/sanitizePlayerDigest";

// Helper: convert epoch timestamp to ISO string
function epochToISO(epoch: number | undefined): string | null {
  if (!epoch) return null;
  return new Date(epoch * 1000).toISOString();
}

// Helper: calculate KDA
function calculateKDA(kills: number | undefined, deaths: number | undefined, assists: number | undefined): number | null {
  if (kills === undefined || deaths === undefined || assists === undefined) return null;
  if (deaths === 0) return kills + assists;
  return (kills + assists) / deaths;
}

// Helper: calculate kill participation
function calculateKillParticipation(
  playerKills: number | undefined,
  playerAssists: number | undefined,
  totalTeamKills: number
): number | null {
  if (playerKills === undefined || playerAssists === undefined || totalTeamKills === 0) return null;
  return (playerKills + playerAssists) / totalTeamKills;
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

// Helper: calculate vision score
function calculateVisionScore(
  observerWards: number | undefined,
  sentryWards: number | undefined
): number | null {
  if (observerWards === undefined && sentryWards === undefined) return null;
  const obs = observerWards || 0;
  const sentry = sentryWards || 0;
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

// Helper: build teamfight summary
function buildTeamfightSummary(teamfights: Array<Record<string, unknown>> | undefined): Record<string, unknown> | null {
  if (!teamfights || teamfights.length === 0) return null;
  
  return {
    count: teamfights.length,
    total_duration: teamfights.reduce((sum, tf) => {
      const duration = tf.duration as number;
      return sum + (duration || 0);
    }, 0),
  };
}

// Helper: build economy summary
function buildEconomySummary(players: RawPlayer[]): Record<string, unknown> | null {
  if (!players || players.length === 0) return null;
  
  const radiantGold = players
    .filter((p) => p.player_slot < 128)
    .reduce((sum, p) => sum + (p.net_worth || 0), 0);
  
  const direGold = players
    .filter((p) => p.player_slot >= 128)
    .reduce((sum, p) => sum + (p.net_worth || 0), 0);
  
  const totalGold = players.reduce((sum, p) => sum + (p.gold_spent || 0), 0);
  const avgGPM = players.reduce((sum, p) => sum + (p.gold_per_min || 0), 0) / players.length;
  
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

  // Calculate total team kills for kill participation
  const radiantKills = raw.players
    .filter((p) => p.player_slot < 128)
    .reduce((sum, p) => sum + (p.kills || 0), 0);
  
  const direKills = raw.players
    .filter((p) => p.player_slot >= 128)
    .reduce((sum, p) => sum + (p.kills || 0), 0);

  // Build PlayerDigest array with validation
  const players: PlayerDigest[] = raw.players.map((player, index) => {
    // Validate required player fields
    if (typeof player.player_slot !== "number") {
      throw new Error(`Player at index ${index} has invalid player_slot: ${player.player_slot}`);
    }
    if (typeof player.hero_id !== "number") {
      throw new Error(`Player at index ${index} has invalid hero_id: ${player.hero_id}`);
    }

    const isRadiant = player.player_slot < 128;
    const teamKills = isRadiant ? radiantKills : direKills;

    const playerDigest: PlayerDigest = {
      match_id: raw.match_id,
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
      kda: calculateKDA(player.kills, player.deaths, player.assists),
      kill_participation: calculateKillParticipation(player.kills, player.assists, teamKills),
      lane: player.lane ?? null,
      lane_role: player.lane_role ?? null,
      vision_score: calculateVisionScore(player.observer_wards_placed, player.sentry_wards_placed),
      items: buildItemsObject(player),
      position_metrics: null, // Can be extended with position data if available
    };

    // Sanitize to remove any potential extra fields
    return sanitizePlayerDigest(playerDigest);
  });

  return { match, players };
}

