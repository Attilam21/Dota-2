// Raw OpenDota API response types
export interface RawPlayer {
  player_slot: number;
  account_id?: number;
  hero_id: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  gold_per_min?: number;
  xp_per_min?: number;
  gold_spent?: number;
  last_hits?: number;
  denies?: number;
  net_worth?: number;
  hero_damage?: number;
  tower_damage?: number;
  damage_taken?: number;
  teamfight_participation?: number;
  lane?: number;
  lane_role?: number;
  observer_wards_placed?: number;
  sentry_wards_placed?: number;
  item_0?: number;
  item_1?: number;
  item_2?: number;
  item_3?: number;
  item_4?: number;
  item_5?: number;
  item_neutral?: number;
}

export interface RawMatch {
  match_id: number;
  duration: number;
  start_time?: number;
  radiant_win: boolean;
  radiant_score?: number;
  dire_score?: number;
  game_mode?: number;
  lobby_type?: number;
  tower_status_radiant?: number;
  tower_status_dire?: number;
  barracks_status_radiant?: number;
  barracks_status_dire?: number;
  objectives?: Array<Record<string, unknown>>;
  teamfights?: Array<Record<string, unknown>>;
  players: RawPlayer[];
}

// Digest types aligned with Supabase tables
export interface MatchDigest {
  match_id: number;
  duration: number;
  start_time: string | null;
  radiant_win: boolean;
  radiant_score: number | null;
  dire_score: number | null;
  game_mode: number | null;
  lobby_type: number | null;
  objectives_summary: Record<string, unknown> | null;
  teamfight_summary: Record<string, unknown> | null;
  economy_summary: Record<string, unknown> | null;
}

export interface PlayerDigest {
  match_id: number;
  player_slot: number;
  account_id: number | null;
  hero_id: number;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  gold_per_min: number | null;
  xp_per_min: number | null;
  gold_spent: number | null;
  last_hits: number | null;
  denies: number | null;
  net_worth: number | null;
  hero_damage: number | null;
  tower_damage: number | null;
  damage_taken: number | null;
  teamfight_participation: number | null;
  kda: number | null;
  kill_participation: number | null;
  lane: number | null;
  lane_role: number | null;
  vision_score: number | null;
  items: Record<string, unknown> | null;
  position_metrics: Record<string, unknown> | null;
}

