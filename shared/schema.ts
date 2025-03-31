import { pgTable, text, serial, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
});

// Player with calculated PIV metrics
export interface PlayerWithPIV {
  id: string;
  name: string;
  team: string;
  role: PlayerRole;
  piv: number;
  kd: number;
  primaryMetric: {
    name: string;
    value: number;
  };
  rawStats: PlayerRawStats;
  metrics: PlayerMetrics;
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
  AWPer = "AWPer",
  Spacetaker = "Spacetaker",
  Lurker = "Lurker",
  Anchor = "Anchor",
  Support = "Support"
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
}

// Insert schema
export const insertPlayerStatsSchema = createInsertSchema(playerStats);
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type PlayerStat = typeof playerStats.$inferSelect;

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
