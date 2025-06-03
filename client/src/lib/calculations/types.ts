// Shared types for calculations
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
  awpKills: number;
  pistolKills: number;
  tradeKills: number;
  tradeDeaths: number;
  kDiff: number;
  adrTotal: number;
  adrCtSide: number;
  adrTSide: number;
  kastTotal: number;
  kastCtSide: number;
  kastTSide: number;
}

export interface RoundData {
  roundNum: number;
  start: number;
  freezeEnd: number;
  end: number;
  officialEnd: number;
  winner: string;
  reason: string;
  bombPlant: string;
  bombSite: string;
  ctTeamClanName: string;
  tTeamClanName: string;
  winnerClanName: string;
  ctTeamCurrentEquipValue: number;
  tTeamCurrentEquipValue: number;
  ctLosingStreak: number;
  tLosingStreak: number;
  ctBuyType: string;
  tBuyType: string;
  advantage5v4: string;
  demoFileName: string;
}

export enum PlayerRole {
  IGL = "IGL",
  AWP = "AWP",
  Spacetaker = "Spacetaker",
  Lurker = "Lurker",
  Anchor = "Anchor",
  Rotator = "Rotator",
  Support = "Support"
}

export interface PlayerRoleInfo {
  team: string;
  previousTeam?: string;
  player: string;
  isIGL: boolean;
  tRole: PlayerRole;
  ctRole: PlayerRole;
}

export interface PlayerMetrics {
  role: PlayerRole;
  roleScores: Record<string, number>;
  topMetrics: Record<string, Array<{ metricName: string; value: number }>>;
  roleMetrics: Record<string, number>;
  rcs: { value: number; metrics: Record<string, number> };
  icf: { value: number; sigma: number };
  sc: { value: number; metric: string };
  osm: number;
  piv: number;
  side: string;
}

export interface PlayerWithPIV {
  id: string;
  name: string;
  team: string;
  role: PlayerRole;
  rawStats: PlayerRawStats;
  metrics: PlayerMetrics;
  tPlayerMetrics?: PlayerMetrics;
  ctPlayerMetrics?: PlayerMetrics;
}

export interface TeamWithTIR {
  id: string;
  name: string;
  players: PlayerWithPIV[];
  tir: number;
  sumPIV: number;
  synergy: number;
  avgPIV: number;
  topPlayerName: string;
  topPlayerPIV: number;
}