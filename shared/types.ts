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
}

export interface PlayerMetrics {
  rcs: number;
  icf: number;
  sc: number;
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
  name: string;
  tir: number;
  players: PlayerWithPIV[];
  synergyFactor: number;
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
  };
  strategicMetrics: {
    tacticalTimeoutConversion: number;
    adaptationRating: number;
    mapControlPerformance: Record<string, number>;
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