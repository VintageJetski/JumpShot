export enum PlayerRole {
  IGL = "IGL",
  AWP = "AWP",
  Lurker = "Lurker",
  Spacetaker = "Spacetaker",
  Support = "Support",
  Anchor = "Anchor",
  Rotator = "Rotator"
}

export interface RawStats {
  teamClanName: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  adrTotal: number;
  adrTSide: number;
  adrCtSide: number;
  firstKills: number;
  firstDeaths: number;
  flashesThrown: number;
  tFlashesThrown: number;
  ctFlashesThrown: number;
  smokesThrown: number;
  tSmokesThrown: number;
  ctSmokesThrown: number;
  totalUtilityThrown: number;
  tTotalUtilityThrown: number;
  ctTotalUtilityThrown: number;
  totalUtilDmg: number;
  tTotalUtilDmg: number;
  ctTotalUtilDmg: number;
  assistedFlashes: number;
  headshots: number;
  kastTotal: number;
  kastTSide: number;
  kastCtSide: number;
  tRoundsWon: number;
  ctRoundsWon: number;
  awpKills: number;
  tradeKills: number;
  tradeDeaths: number;
  // Additional fields for visualization
  heThrown?: number;
  infernosThrown?: number;
  multiKills?: number;
  wallbangKills?: number;
  noScope?: number;
  throughSmoke?: number;
  blindKills?: number;
  victimBlindKills?: number;
  steamId?: string;
  userName?: string;
  teamName?: string;
  totalRoundsWon?: number;
  ctFirstKills?: number;
  tFirstDeaths?: number;
  flashesThrownInPistolRound?: number;
  heThrownInPistolRound?: number;
  ctHeThrown?: number;
  tHeThrown?: number;
  infernosThrownInPistolRound?: number;
  ctInfernosThrown?: number;
  tInfernosThrown?: number;
  smokesThrownInPistolRound?: number;
}

export interface ICFMetric {
  value: number;
  sigma?: number;
}

export interface SCMetric {
  value: number;
  metric?: string;
}

export interface PlayerMetrics {
  rcs: number | { value: number; metrics?: Record<string, number> };
  icf: number | ICFMetric;
  sc: number | SCMetric;
  osm: number;
}

export interface PlayerWithPIV {
  id: string;
  name: string;
  team: string;
  role: PlayerRole;
  tRole: PlayerRole;
  ctRole: PlayerRole;
  isIGL: boolean;
  piv: number;
  tPIV: number;
  ctPIV: number;
  kd: number;
  primaryMetric: {
    name: string;
    value: number;
  };
  rawStats?: RawStats;
  metrics?: PlayerMetrics;
}

export interface TeamWithTIR {
  id?: string;
  name: string;
  tir: number;
  players: PlayerWithPIV[];
  synergyFactor: number;
  
  // Additional fields for visualization
  matchesWon?: number;
  matchesLost?: number;
  matchesPlayed?: number;
  roundsWon?: number;
  roundsPlayed?: number;
  tRoundsWon?: number;
  tRoundsPlayed?: number;
  ctRoundsWon?: number;
  ctRoundsPlayed?: number;
  averagePIV?: number;
  teamSynergy?: number;
  mapPool?: string[];
}

export interface RoundData {
  roundNumber: number;
  teamWon: string;
  winMethod: string;
  ctTeam: string;
  tTeam: string;
  ctBuyType: string;
  tBuyType: string;
  ctPlayers: string[];
  tPlayers: string[];
  map: string;
  demoName: string;
}

export interface TeamRoundMetrics {
  teamName: string;
  economyMetrics: {
    pistolRoundWinRate: number;
    forceRoundWinRate: number;
    ecoRoundWinRate: number;
    fullBuyEfficiency: number;
    // Extended metrics for visualization
    semiEcoWinRate?: number;
    forceBuyWinRate?: number;
    fullBuyWinRate?: number;
  };
  strategicMetrics: {
    tacticalTimeoutConversion: number;
    adaptationRating: number;
    mapControlPerformance: Record<string, number>;
    // Extended metrics for visualization
    tSideWinRate?: number;
    ctSideWinRate?: number;
    aSiteWinRate?: number;
    bSiteWinRate?: number;
    postTimeoutWinRate?: number;
  };
  momentumMetrics: {
    comebackFactor: number;
    roundStreakValue: number;
    closeRoundWinRate: number;
  };
  mapPerformance: Record<string, {
    ctWinRate: number;
    tWinRate: number;
    overallWinRate: number;
    preferredBombsite: string;
  }>;
}