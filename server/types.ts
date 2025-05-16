import { PlayerRole } from '../shared/schema';

// Raw player statistics from CSV or Supabase
export interface PlayerRawStats {
  id: string;
  name: string;
  team: string;
  ctRole?: PlayerRole;
  tRole?: PlayerRole;
  isIGL: boolean;
  hs: number;        // Headshot percentage
  adr: number;       // Average damage per round
  kpr: number;       // Kills per round
  dpr: number;       // Deaths per round
  kd: number;        // Kill/death ratio
  impact: number;    // Impact rating
  kast: number;      // KAST percentage
  flashAssists: number;
  utilityDamage: number;
  openingKills: number;
  openingDeaths: number;
  clutchesWon: number;
  tradingSuccess: number;
  consistencyScore: number;
  pivValue: number;  // Player Impact Value
  
  // CSV data model fields
  steamId: string;
  userName: string;
  teamName: string;
  damage: number;
  kills: number;
  deaths: number;
  assists: number;
  killAssists: number;
  incendiaryDamage: number;
  molotovDamage: number;
  heDamage: number;
  entrySuccess: number;
  entryAttempts: number;
  multiKills: number;
  oneVXs: number;
  oneVXAttempts: number;
  HSPercent: number;
  flashesThrown: number;
  smkThrown: number;
  heThrown: number;
  molliesThrown: number;
  roundsPlayed: number;
  mapsPlayed: number;
  firstKills: number;
  firstDeaths: number;
  tradedDeaths: number;
  tradedKills: number;
  survivedRounds: number;
  rounds_ct: number;
  rounds_t: number;
  kills_t: number;
  deaths_t: number;
  adr_t: number;
  kast_t: number;
  kills_ct: number;
  deaths_ct: number;
  adr_ct: number;
  kast_ct: number;
  
  // Additional fields for compatibility
  wallbangKills: number;
  assistedFlashes: number;
  noScope: number;
  throughSmoke: number;
}

// Player metrics calculated for PIV
export interface PlayerMetrics {
  rcs: {
    value: number;
    metrics: Record<string, number>;
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
  side: string;
}

// Structure for player role information
export interface PlayerRoleInfo {
  team: string;
  previousTeam?: string;
  player: string;
  isIGL: boolean;
  tRole: PlayerRole;
  ctRole: PlayerRole;
}

// Structure for team stats by map
export interface TeamMapStats {
  mapName: string;
  totalRounds: number;
  roundsWon: number;
  roundsLost: number;
  tRoundsWon: number;
  tRoundsPlayed: number;
  ctRoundsWon: number;
  ctRoundsPlayed: number;
  winRate: number;
  tWinRate: number;
  ctWinRate: number;
}

// Structure for round info
export interface RoundInfo {
  id: string;
  matchId: string;
  roundNumber: number;
  winner: string;
  winType: string;
  map: string;
}

// Structure for match data
export interface MatchData {
  id: string;
  team1: string;
  team2: string;
  winner: string;
  score: string;
  map: string;
  event: string;
  matchDate: string;
  rounds: RoundInfo[];
}