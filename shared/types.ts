/**
 * Shared types for player and team data
 */

// Player roles
export enum PlayerRole {
  IGL = "IGL",
  AWP = "AWP",
  Spacetaker = "Spacetaker",
  Support = "Support",
  Lurker = "Lurker",
  Anchor = "Anchor",
  Rotator = "Rotator"
}

// Map names
export enum Maps {
  Inferno = "inferno",
  Mirage = "mirage",
  Nuke = "nuke",
  Dust2 = "dust2",
  Vertigo = "vertigo",
  Ancient = "ancient",
  Anubis = "anubis"
}

// Player metrics structure
export interface PlayerMetrics {
  role: PlayerRole;
  roleScores: Record<PlayerRole, number>;
  topMetrics: Record<PlayerRole, { metricName: string; value: number }[]>;
  roleMetrics: Record<string, number>;
  rcs: { value: number; metrics: Record<string, number> };
  icf: { value: number; sigma: number };
  sc: { value: number; metric: string };
  osm: number;
  piv: number;
  side: "CT" | "T" | "Overall";
}

// Raw player stats from CSV
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

// Player with calculated PIV and role metrics
export interface PlayerWithPIV {
  id: string;
  name: string;
  team: string;
  role: PlayerRole;
  secondaryRole?: PlayerRole;
  isIGL: boolean;
  isMainAwper: boolean;
  ctRole: PlayerRole;
  tRole: PlayerRole;
  piv: number;
  rawStats: PlayerRawStats;
  metrics: PlayerMetrics;
  ctMetrics: PlayerMetrics;
  tMetrics: PlayerMetrics;
}

// Round data structure
export interface RoundData {
  matchId: string;
  roundNumber: number;
  ctTeam: string;
  tTeam: string;
  winnerTeam: string;
  winnerSide: string;
  loserTeam: string;
  loserSide: string;
  bombPlant: boolean;
  bombSite: "bombsite_a" | "bombsite_b" | "not_planted";
  ctRoundStartMoney: number;
  tRoundStartMoney: number;
  ctEquipmentValue: number;
  tEquipmentValue: number;
  ctFreezetimeEndEquipmentValue: number;
  tFreezetimeEndEquipmentValue: number;
  winCondition: string; // e.g. "BombDefused", "CTWin", "TWin", "TargetBombed"
  ctPlayers: string[];
  tPlayers: string[];
}

// Team round metrics
export interface TeamRoundMetrics {
  id: string;
  name: string;
  economyRating: number;
  strategyRating: number;
  momentumRating: number;
  
  // Economy metrics
  economicEfficiency: number;
  fullBuyWinRate: number;
  ecoBuyWinRate: number;
  forceBuyWinRate: number;
  economicRecovery: number;
  
  // Strategic metrics
  bombPlantRate: number;
  aPreference: number;
  bPreference: number;
  postPlantWinRate: number;
  retakeSuccessRate: number;
  
  // Momentum metrics
  pistolRoundWinRate: number;
  followUpWinRate: number;
  comebackFactor: number;
  closingFactor: number;
  
  // Re-included metrics from previous version
  recentPerformanceFactor: number; // For Form rating
  criticalRoundWinRate: number;    // For BMT (Big Match Temperament)
  momentumFactor: number;          // Overall momentum
  
  // Map-specific performance
  mapPerformance: {
    [map: string]: {
      ctWinRate: number;
      tWinRate: number;
      bombsitesPreference: {
        a: number;
        b: number;
      }
    }
  };
}

// Team with TIR score and player list
export interface TeamWithTIR {
  id: string;
  name: string;
  tir: number;
  synergy: number;
  players: PlayerWithPIV[];
}

// Match prediction response
export interface MatchPredictionResponse {
  team1WinProbability: number;
  team2WinProbability: number;
  insights: string[];
  mapPickAdvantage: number;
  keyRoundFactors: {
    name: string;
    team1Value: number;
    team2Value: number;
    advantage: number; // 1 = team1, 2 = team2, 0 = neutral
  }[];
  actualScore?: {
    team1Score: number;
    team2Score: number;
  };
  mapBreakdown?: Record<string, any>;
}