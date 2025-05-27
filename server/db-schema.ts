import { pgTable, text, serial, integer, bigint, doublePrecision, primaryKey, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schema definitions matching exactly what's in the database screenshot

// Events table
export const events = pgTable("events", {
  eventId: integer("event_id").notNull().primaryKey(),
  eventName: text("event_name").notNull()
});

// Teams table
export const teams = pgTable("teams", {
  id: integer("id").notNull().primaryKey(),
  teamClanName: text("team_clan_name").notNull().unique()
});

// Players table
export const players = pgTable("players", {
  steamId: bigint("steam_id", { mode: "number" }).notNull().primaryKey(),
  userName: text("user_name")
});

// Matches table
export const matches = pgTable("matches", {
  fileId: integer("file_id").notNull().primaryKey(),
  matchName: text("match_name").notNull(),
  eventId: integer("event_id").references(() => events.eventId)
});

// Player History table
export const playerHistory = pgTable("player_history", {
  id: serial("id").notNull().primaryKey(),
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => players.steamId),
  teamId: integer("team_id").notNull().references(() => teams.id)
});

// Roles table - contains player role assignments
export const roles = pgTable("roles", {
  id: serial("id").notNull().primaryKey(),
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => players.steamId),
  teamName: text("team_name").notNull(),
  playerName: text("player_name").notNull(),
  isIGL: boolean("is_igl").notNull().default(false),
  tRole: text("t_role").notNull(),
  ctRole: text("ct_role").notNull()
});

// Rounds table
export const rounds = pgTable("rounds", {
  id: serial("id").notNull().primaryKey(),
  roundNum: integer("round_num"),
  start: integer("start"),
  freezeEnd: integer("freeze_end"),
  end: integer("end"),
  officialEnd: integer("official_end"),
  winner: text("winner"),
  reason: text("reason"),
  bombPlant: doublePrecision("bomb_plant"),
  bombSite: text("bomb_site"),
  ctTeamClanName: text("ct_team_clan_name"),
  tTeamClanName: text("t_team_clan_name"),
  winnerClanName: text("winner_clan_name"),
  ctTeamCurrentEquipValue: doublePrecision("ct_team_current_equip_value"),
  tTeamCurrentEquipValue: doublePrecision("t_team_current_equip_value"),
  ctLosingStreak: integer("ct_losing_streak"),
  tLosingStreak: integer("t_losing_streak"),
  ctBuyType: text("ct_buy_type"),
  tBuyType: text("t_buy_type"),
  advantage5v4: text("advantage_5v4"),
  fileId: integer("file_id").references(() => matches.fileId),
  eventId: integer("event_id"),
  matchName: text("match_name")
});

// Player Match Summary table
export const playerMatchSummary = pgTable("player_match_summary", {
  steamId: bigint("steam_id", { mode: "number" }).notNull(),
  fileId: integer("file_id").notNull(),
  teamId: integer("team_id"),
  eventId: integer("event_id").notNull().references(() => events.eventId)
}, (table) => ({
  pk: primaryKey({ columns: [table.steamId, table.fileId, table.eventId] })
}));

// Kill Stats table
export const killStats = pgTable("kill_stats", {
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => players.steamId),
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
  eventId: integer("event_id").notNull().references(() => events.eventId)
}, (table) => ({
  pk: primaryKey({ columns: [table.steamId, table.eventId] })
}));

// General Stats table
export const generalStats = pgTable("general_stats", {
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => players.steamId),
  assists: doublePrecision("assists"),
  deaths: doublePrecision("deaths"),
  tradeKills: doublePrecision("trade_kills"),
  tradeDeaths: doublePrecision("trade_deaths"),
  kd: doublePrecision("kd"),
  kDDiff: doublePrecision("k_d_diff"),
  adrTotal: doublePrecision("adr_total"),
  adrCtSide: doublePrecision("adr_ct_side"),
  adrTSide: doublePrecision("adr_t_side"),
  kastTotal: doublePrecision("kast_total"),
  kastCtSide: doublePrecision("kast_ct_side"),
  kastTSide: doublePrecision("kast_t_side"),
  totalRoundsWon: doublePrecision("total_rounds_won"),
  tRoundsWon: doublePrecision("t_rounds_won"),
  ctRoundsWon: doublePrecision("ct_rounds_won"),
  eventId: integer("event_id").notNull().references(() => events.eventId)
}, (table) => ({
  pk: primaryKey({ columns: [table.steamId, table.eventId] })
}));

// Utility Stats table
export const utilityStats = pgTable("utility_stats", {
  steamId: bigint("steam_id", { mode: "number" }).notNull().references(() => players.steamId),
  assistedFlashes: integer("assisted_flashes"),
  flahesThrown: integer("flahes_thrown"), // Note: this matches the typo in your DB schema
  ctFlahesThrown: integer("ct_flahes_thrown"),
  tFlahesThrown: integer("t_flahes_thrown"),
  flahesThrowInPistolRound: integer("flahes_thrown_in_pistol_round"),
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
  eventId: integer("event_id").notNull().references(() => events.eventId)
}, (table) => ({
  pk: primaryKey({ columns: [table.steamId, table.eventId] })
}));

// Export type definitions
export type Event = typeof events.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type PlayerHistory = typeof playerHistory.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type PlayerMatchSummary = typeof playerMatchSummary.$inferSelect;
export type KillStat = typeof killStats.$inferSelect;
export type GeneralStat = typeof generalStats.$inferSelect;
export type UtilityStat = typeof utilityStats.$inferSelect;

// Composite interface for joining multiple tables
export interface PlayerData {
  player: Player;
  killStats?: KillStat;
  generalStats?: GeneralStat;
  utilityStats?: UtilityStat;
  teamInfo?: Team;
}