import { pgTable, text, serial, integer, boolean, real, bigint, foreignKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Supabase schema definitions
export const supaEvents = pgTable("events", {
  eventId: integer("event_id").primaryKey(),
  eventName: text("event_name").notNull(),
});

export const supaTeams = pgTable("teams", {
  id: serial("id").primaryKey(),
  teamClanName: text("team_clan_name").notNull().unique(),
});

export const supaPlayers = pgTable("players", {
  steamId: bigint("steam_id", { mode: "number" }).primaryKey(),
  userName: text("user_name"),
});

export const supaPlayerHistory = pgTable("player_history", {
  id: serial("id").primaryKey(),
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => supaPlayers.steamId),
  teamId: integer("team_id").notNull().references(() => supaTeams.id),
}, (table) => {
  return {
    uniqueSteamTeam: uniqueIndex("unique_steam_team").on(table.steamId, table.teamId),
  };
});

export const supaMatches = pgTable("matches", {
  fileId: integer("file_id").primaryKey(),
  matchName: text("match_name").notNull(),
  eventId: integer("event_id").references(() => supaEvents.eventId),
});

export const supaRounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  roundNum: integer("round_num"),
  start: integer("start"),
  freezeEnd: integer("freeze_end"),
  end: integer("end"),
  officialEnd: integer("official_end"),
  winner: text("winner"),
  reason: text("reason"),
  bombPlant: real("bomb_plant"),
  bombSite: text("bomb_site"),
  ctTeamClanName: text("ct_team_clan_name"),
  tTeamClanName: text("t_team_clan_name"),
  winnerClanName: text("winner_clan_name"),
  ctTeamCurrentEquipValue: real("ct_team_current_equip_value"),
  tTeamCurrentEquipValue: real("t_team_current_equip_value"),
  ctLosingStreak: integer("ct_losing_streak"),
  tLosingStreak: integer("t_losing_streak"),
  ctBuyType: text("ct_buy_type"),
  tBuyType: text("t_buy_type"),
  advantage5v4: text("advantage_5v4"),
  fileId: integer("file_id").references(() => supaMatches.fileId),
  eventId: integer("event_id").references(() => supaEvents.eventId),
  matchName: text("match_name"),
});

export const supaPlayerMatchSummary = pgTable("player_match_summary", {
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => supaPlayers.steamId),
  fileId: integer("file_id").notNull().references(() => supaMatches.fileId),
  teamId: integer("team_id").references(() => supaTeams.id),
  eventId: integer("event_id").notNull().references(() => supaEvents.eventId),
}, (table) => {
  return {
    pk: uniqueIndex("player_match_summary_pkey").on(table.steamId, table.fileId, table.eventId),
  };
});

export const supaKillStats = pgTable("kill_stats", {
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => supaPlayers.steamId),
  kills: integer("kills"),
  headshots: integer("headshots"),
  wallbangKills: integer("wallbang_kills"),
  noScope: integer("no_scope"),
  throughSmoke: integer("through_smoke"),
  airboneKills: integer("airbone_kills"),
  blindKills: integer("blind_kills"),
  victimBlindKills: integer("victim_blind_kills"),
  awpKills: integer("awp_kills"),
  pistolKills: integer("pistol_kills"),
  firstKills: integer("first_kills"),
  ctFirstKills: integer("ct_first_kills"),
  tFirstKills: integer("t_first_kills"),
  firstDeaths: integer("first_deaths"),
  ctFirstDeaths: integer("ct_first_deaths"),
  tFirstDeaths: integer("t_first_deaths"),
  eventId: integer("event_id").notNull().references(() => supaEvents.eventId),
}, (table) => {
  return {
    pk: uniqueIndex("kill_stats_pkey").on(table.steamId, table.eventId),
  };
});

export const supaGeneralStats = pgTable("general_stats", {
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => supaPlayers.steamId),
  assists: real("assists"),
  deaths: real("deaths"),
  tradeKills: real("trade_kills"),
  tradeDeaths: real("trade_deaths"),
  kd: real("kd"),
  kDDiff: real("k_d_diff"),
  adrTotal: real("adr_total"),
  adrCtSide: real("adr_ct_side"),
  adrTSide: real("adr_t_side"),
  kastTotal: real("kast_total"),
  kastCtSide: real("kast_ct_side"),
  kastTSide: real("kast_t_side"),
  totalRoundsWon: real("total_rounds_won"),
  tRoundsWon: real("t_rounds_won"),
  ctRoundsWon: real("ct_rounds_won"),
  eventId: integer("event_id").notNull().references(() => supaEvents.eventId),
}, (table) => {
  return {
    pk: uniqueIndex("general_stats_pkey").on(table.steamId, table.eventId),
  };
});

export const supaUtilityStats = pgTable("utility_stats", {
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => supaPlayers.steamId),
  assistedFlashes: integer("assisted_flashes"),
  flahesThrown: integer("flahes_thrown"),
  ctFlahesThrown: integer("ct_flahes_thrown"),
  tFlahesThrown: integer("t_flahes_thrown"),
  flahesTownInPistolRound: integer("flahes_thrown_in_pistol_round"),
  heThrown: integer("he_thrown"),
  ctHeThrown: integer("ct_he_thrown"),
  tHeThrown: integer("t_he_thrown"),
  heThrownInPistolRound: integer("he_thrown_in_pistol_round"),
  infernosThrown: integer("infernos_thrown"),
  ctInfernosThrown: integer("ct_infernos_thrown"),
  tInfernosThrown: integer("t_infernos_thrown"),
  infernosThrownInPistolRound: integer("infernos_thrown_in_pistol_round"),
  smokesThrown: integer("smokes_thrown"),
  ctSmokesThrown: integer("ct_smokes_thrown"),
  tSmokesThrown: integer("t_smokes_thrown"),
  smokesThrownInPistolRound: integer("smokes_thrown_in_pistol_round"),
  utilInPistolRound: integer("util_in_pistol_round"),
  totalUtilThrown: integer("total_util_thrown"),
  totalUtilDmg: integer("total_util_dmg"),
  ctTotalUtilDmg: integer("ct_total_util_dmg"),
  tTotalUtilDmg: integer("t_total_util_dmg"),
  eventId: integer("event_id").notNull().references(() => supaEvents.eventId),
}, (table) => {
  return {
    pk: uniqueIndex("utility_stats_pkey").on(table.steamId, table.eventId),
  };
});

// Player statistics model from CSV
export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  steamId: text("steam_id").notNull(),
  userName: text("user_name").notNull(),
  teamName: text("team_clan_name").notNull(),
  kills: integer("kills").notNull(),
  headshots: integer("headshots").notNull(),
  wallbangKills: integer("wallbang_kills").notNull(),
  assistedFlashes: integer("assisted_flashes").notNull(),
  noScope: integer("no_scope").notNull(),
  throughSmoke: integer("through_smoke").notNull(),
  blindKills: integer("blind_kills").notNull(),
  victimBlindKills: integer("victim_blind_kills").notNull(),
  assists: integer("assists").notNull(),
  deaths: integer("deaths").notNull(),
  kd: real("kd").notNull(),
  totalRoundsWon: integer("total_rounds_won").notNull(),
  tRoundsWon: integer("t_rounds_won").notNull(),
  ctRoundsWon: integer("ct_rounds_won").notNull(),
  firstKills: integer("first_kills").notNull(),
  ctFirstKills: integer("ct_first_kills").notNull(),
  tFirstKills: integer("t_first_kills").notNull(),
  firstDeaths: integer("first_deaths").notNull(),
  ctFirstDeaths: integer("ct_first_deaths").notNull(),
  tFirstDeaths: integer("t_first_deaths").notNull(),
  flashesThrown: integer("flashes_thrown").notNull(),
  ctFlashesThrown: integer("ct_flashes_thrown").notNull(),
  tFlashesThrown: integer("t_flashes_thrown").notNull(),
  flashesThrownInPistolRound: integer("flashes_thrown_in_pistol_round").notNull(),
  heThrown: integer("he_thrown").notNull(),
  ctHeThrown: integer("ct_he_thrown").notNull(),
  tHeThrown: integer("t_he_thrown").notNull(),
  heThrownInPistolRound: integer("he_thrown_in_pistol_round").notNull(),
  infernosThrown: integer("infernos_thrown").notNull(),
  ctInfernosThrown: integer("ct_infernos_thrown").notNull(),
  tInfernosThrown: integer("t_infernos_thrown").notNull(),
  infernosThrownInPistolRound: integer("infernos_thrown_in_pistol_round").notNull(),
  smokesThrown: integer("smokes_thrown").notNull(),
  ctSmokesThrown: integer("ct_smokes_thrown").notNull(),
  tSmokesThrown: integer("t_smokes_thrown").notNull(),
  smokesThrownInPistolRound: integer("smokes_thrown_in_pistol_round").notNull(),
  totalUtilityThrown: integer("total_utility_thrown").notNull(),
  
  // Calculated metrics
  role: text("role"),
  secondaryRole: text("secondary_role"),
  isMainAwper: boolean("is_main_awper"),
  isIGL: boolean("is_igl"),
  piv: real("piv"),
});

// Player with calculated PIV metrics
export interface PlayerWithPIV {
  id: string;
  name: string;
  team: string;
  role: PlayerRole;        // Primary role (determined from CT and T roles)
  secondaryRole?: PlayerRole; // Secondary role
  tRole?: PlayerRole;      // T side role
  ctRole?: PlayerRole;     // CT side role
  isIGL?: boolean;         // Is in-game leader
  isMainAwper?: boolean;   // Is the team's main AWPer
  piv: number;             // Player Impact Value
  ctPIV?: number;          // CT side PIV
  tPIV?: number;           // T side PIV
  kd: number;
  primaryMetric: {
    name: string;
    value: number;
  };
  rawStats: PlayerRawStats;
  metrics: PlayerMetrics;
  ctMetrics?: PlayerMetrics; // CT side metrics
  tMetrics?: PlayerMetrics;  // T side metrics
}

// Team with calculated TIR metrics
export interface TeamWithTIR {
  id: string;
  name: string;
  tir: number;
  sumPIV: number;
  synergy: number;
  avgPIV: number;
  topPlayer: {
    name: string;
    piv: number;
  };
  players: PlayerWithPIV[];
}

// Player role enum
export enum PlayerRole {
  IGL = "IGL",
  AWP = "AWP",
  Spacetaker = "Spacetaker",
  Lurker = "Lurker",
  Anchor = "Anchor",
  Support = "Support",
  Rotator = "Rotator"
}

export interface RoundData {
  roundNum: number;
  winner: 'ct' | 't';
  reason: 'ct_killed' | 't_killed' | 'bomb_exploded' | 'bomb_defused';
  bombPlant: boolean;
  bombSite: 'bombsite_a' | 'bombsite_b' | 'not_planted';
  ctTeam: string;
  tTeam: string;
  winnerTeam: string;
  ctEquipValue: number;
  tEquipValue: number;
  ctLosingStreak: number;
  tLosingStreak: number;
  ctBuyType: string; // 'Full Buy', 'Eco', 'Semi-Buy', etc.
  tBuyType: string;
  firstAdvantage: 'ct' | 't'; // Which team got first 5v4 advantage
  demoFileName: string;
  map: string; // Extracted from demo filename
  start: string;
  freeze_end: string;
  end: string;
  bomb_plant?: string;
}

export interface TeamRoundMetrics {
  id: string;
  name: string;
  
  // Economy metrics
  econEfficiencyRatio: number; // Results achieved relative to money spent
  forceRoundWinRate: number;
  ecoRoundWinRate: number;
  fullBuyWinRate: number;
  economicRecoveryIndex: number; // How quickly team recovers after eco rounds
  
  // Strategic metrics
  aPreference: number; // 0-1 value showing preference for A site
  bPreference: number;
  bombPlantRate: number; // % of T rounds with bomb plants
  postPlantWinRate: number;
  retakeSuccessRate: number; // % of CT rounds where bomb was planted but CT won
  
  // Momentum metrics
  pistolRoundWinRate: number;
  followUpRoundWinRate: number; // Win rate after winning pistol
  comebackFactor: number; // Ability to win after losing multiple rounds
  closingFactor: number; // Success rate in closing out advantages (e.g., 5v4)
  
  // Map-specific metrics
  mapPerformance: {
    [mapName: string]: {
      ctWinRate: number;
      tWinRate: number;
      bombsitesPreference: {
        a: number;
        b: number;
      }
    }
  }
}

// Detailed metrics for each role
export interface RoleMetrics {
  // IGL metrics
  "Tactical Timeout Success": number;
  "Team Economy Preservation": number;
  "Kill Participation Index": number;
  "Opening Play Success Rate": number;
  "Utility Setup Optimization": number;
  "Site Hold Efficiency": number;
  "Rotation Efficiency Index": number;
  "Adaptive Defense Score": number;
  
  // AWPer metrics
  "Opening Pick Success Rate": number;
  "Multi Kill Conversion": number;
  "AWPer Flash Assistance": number;
  "Site Lockdown Rate": number;
  "Entry Denial Efficiency": number;
  "Angle Hold Success": number;
  "Retake Contribution Index": number;
  "Utility Punish Rate": number;
  
  // Spacetaker metrics
  "Opening Duel Success Rate": number;
  "Aggression Efficiency Index": number;
  "First Blood Impact": number;
  "Trade Conversion Rate": number;
  "Utility Entry Effectiveness": number;
  "Space Creation Index": number;
  
  // Lurker metrics
  "Zone Influence Stability": number;
  "Rotation Disruption Impact": number;
  "Flank Success Rate": number;
  "Information Gathering Efficiency": number;
  "Clutch Conversion Rate": number;
  "Delayed Timing Effectiveness": number;
  
  // Anchor metrics
  "Site Hold Success Rate": number;
  "Survival Rate Post-Engagement": number;
  "Multi-Kill Defense Ratio": number;
  "Opponent Entry Denial Rate": number;
  "Defensive Efficiency Rating": number;
  
  // Support metrics
  "Utility Setup Efficiency": number;
  "Support Flash Assist": number;
  "Bomb Plant Utility Coverage": number;
  "Post-Plant Aid Ratio": number;
  "Anti-Exec Utility Success": number;
  "Teammate Save Ratio": number;
  "Retake Utility Coordination": number;
}

// Raw stats extracted from CSV
export interface PlayerRawStats {
  steamId: string;
  userName: string;
  teamName: string;
  kills: number;
  headshots: number;
  wallbangKills: number;
  assistedFlashes: number;
  noScope: number;
  throughSmoke: number;
  blindKills: number;
  victimBlindKills: number;
  assists: number;
  deaths: number;
  kd: number;
  totalRoundsWon: number;
  tRoundsWon: number;
  ctRoundsWon: number;
  firstKills: number;
  ctFirstKills: number;
  tFirstKills: number;
  firstDeaths: number;
  ctFirstDeaths: number;
  tFirstDeaths: number;
  flashesThrown: number;
  ctFlashesThrown: number;
  tFlashesThrown: number;
  flashesThrownInPistolRound: number;
  heThrown: number;
  ctHeThrown: number;
  tHeThrown: number;
  heThrownInPistolRound: number;
  infernosThrown: number;
  ctInfernosThrown: number;
  tInfernosThrown: number;
  infernosThrownInPistolRound: number;
  smokesThrown: number;
  ctSmokesThrown: number;
  tSmokesThrown: number;
  smokesThrownInPistolRound: number;
  totalUtilityThrown: number;
}

// Player metrics for PIV calculation
export interface PlayerMetrics {
  role: PlayerRole;
  roleScores: {
    [role in PlayerRole]?: number;
  };
  topMetrics: {
    [role in PlayerRole]?: {
      metricName: string;
      value: number;
    }[];
  };
  roleMetrics: Partial<RoleMetrics>;
  rcs: {
    value: number;
    metrics: {
      [key: string]: number;
    };
  };
  icf: {
    value: number;
    sigma: number;
  };
  sc: {
    value: number;
    metric: string;
  };
  osm: number;
  piv: number;
  side?: 'CT' | 'T' | 'Overall'; // Indicates which side these metrics are for
}

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  tir: real("tir"),
  sumPIV: real("sum_piv"),
  synergy: real("synergy"),
  avgPIV: real("avg_piv"),
  topPlayerName: text("top_player_name"),
  topPlayerPIV: real("top_player_piv"),
});

// Insert schemas
export const insertPlayerStatsSchema = createInsertSchema(playerStats);
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type PlayerStat = typeof playerStats.$inferSelect;

export const insertTeamSchema = createInsertSchema(teams);
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Users table for authentication (from template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Supabase type definitions
export type SupaEvent = typeof supaEvents.$inferSelect;
export type SupaTeam = typeof supaTeams.$inferSelect;
export type SupaPlayer = typeof supaPlayers.$inferSelect;
export type SupaPlayerHistory = typeof supaPlayerHistory.$inferSelect;
export type SupaMatch = typeof supaMatches.$inferSelect;
export type SupaRound = typeof supaRounds.$inferSelect;
export type SupaPlayerMatchSummary = typeof supaPlayerMatchSummary.$inferSelect;
export type SupaKillStats = typeof supaKillStats.$inferSelect;
export type SupaGeneralStats = typeof supaGeneralStats.$inferSelect;
export type SupaUtilityStats = typeof supaUtilityStats.$inferSelect;

// Composite interfaces for joining multiple Supabase tables
export interface SupaPlayerData {
  player: SupaPlayer;
  killStats?: SupaKillStats;
  generalStats?: SupaGeneralStats;
  utilityStats?: SupaUtilityStats;
  teamInfo?: SupaTeam;
}

// Insertion schemas
export const insertSupaEventSchema = createInsertSchema(supaEvents);
export const insertSupaTeamSchema = createInsertSchema(supaTeams);
export const insertSupaPlayerSchema = createInsertSchema(supaPlayers);
export const insertSupaPlayerHistorySchema = createInsertSchema(supaPlayerHistory);
export const insertSupaMatchSchema = createInsertSchema(supaMatches);
export const insertSupaRoundSchema = createInsertSchema(supaRounds);
export const insertSupaPlayerMatchSummarySchema = createInsertSchema(supaPlayerMatchSummary);
export const insertSupaKillStatsSchema = createInsertSchema(supaKillStats);
export const insertSupaGeneralStatsSchema = createInsertSchema(supaGeneralStats);
export const insertSupaUtilityStatsSchema = createInsertSchema(supaUtilityStats);
