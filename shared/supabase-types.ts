// Supabase Database Types - Direct mapping from real schema
export interface Player {
  steam_id: string;
  user_name: string | null;
}

export interface Team {
  id: number;
  team_clan_name: string;
}

export interface Event {
  event_id: number;
  event_name: string;
}

export interface KillStats {
  steam_id: string;
  event_id: number;
  kills: number | null;
  headshots: number | null;
  wallbang_kills: number | null;
  no_scope: number | null;
  through_smoke: number | null;
  airbone_kills: number | null;
  blind_kills: number | null;
  victim_blind_kills: number | null;
  awp_kills: number | null;
  pistol_kills: number | null;
  first_kills: number | null;
  ct_first_kills: number | null;
  t_first_kills: number | null;
  first_deaths: number | null;
  ct_first_deaths: number | null;
  t_first_deaths: number | null;
}

export interface GeneralStats {
  steam_id: string;
  event_id: number;
  assists: number | null;
  deaths: number | null;
  trade_kills: number | null;
  trade_deaths: number | null;
  kd: number | null;
  k_d_diff: number | null;
  adr_total: number | null;
  adr_ct_side: number | null;
  adr_t_side: number | null;
  kast_total: number | null;
  kast_ct_side: number | null;
  kast_t_side: number | null;
  total_rounds_won: number | null;
  t_rounds_won: number | null;
  ct_rounds_won: number | null;
}

export interface UtilityStats {
  steam_id: string;
  event_id: number;
  assisted_flashes: number | null;
  flahes_thrown: number | null;
  ct_flahes_thrown: number | null;
  t_flahes_thrown: number | null;
  flahes_thrown_in_pistol_round: number | null;
  he_thrown: number | null;
  ct_he_thrown: number | null;
  t_he_thrown: number | null;
  he_thrown_in_pistol_round: number | null;
  infernos_thrown: number | null;
  ct_infernos_thrown: number | null;
  t_infernos_thrown: number | null;
  infernos_thrown_in_pistol_round: number | null;
  smokes_thrown: number | null;
  ct_smokes_thrown: number | null;
  t_smokes_thrown: number | null;
  smokes_thrown_in_pistol_round: number | null;
  util_in_pistol_round: number | null;
  total_util_thrown: number | null;
  total_util_dmg: number | null;
  ct_total_util_dmg: number | null;
  t_total_util_dmg: number | null;
}

export interface PlayerMatchSummary {
  steam_id: string;
  file_id: number;
  team_id: number | null;
  event_id: number;
}

// Computed Player Data Interface for PIV calculations
export interface PlayerPerformanceData {
  player: Player;
  team: Team | null;
  event: Event;
  killStats: KillStats;
  generalStats: GeneralStats;
  utilityStats: UtilityStats;
}

// PIV Result Interface
export interface PlayerWithPIV {
  steamId: string;
  name: string;
  team: string;
  piv: number;
  role: PlayerRole;
  metrics: {
    kd: number;
    adr: number;
    kast: number;
    firstKills: number;
    utilityDamage: number;
    headshots: number;
  };
  event: string;
}

export enum PlayerRole {
  Entry = "Entry",
  AWPer = "AWPer", 
  IGL = "IGL",
  Support = "Support",
  Lurker = "Lurker"
}