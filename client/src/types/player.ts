// Simple client-side player interface
export interface ClientPlayer {
  steamId: string;
  name: string;
  team: string;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  kast: number;
  rating: number;
  isIGL: boolean;
  tRole: string;
  ctRole: string;
  tournament: string;
  eventId: number;
  entryKills: number;
  entryDeaths: number;
  multiKills: number;
  clutchWins: number;
  clutchAttempts: number;
  flashAssists: number;
  rounds: number;
  maps: number;
  teamRounds: number;
  // Calculated metrics
  piv?: number;
  kd?: number;
  primaryRole?: string;
}

export enum PlayerRole {
  IGL = 'IGL',
  AWP = 'AWP',
  Entry = 'Entry',
  Support = 'Support',
  Lurker = 'Lurker',
  Spacetaker = 'Spacetaker',
  Anchor = 'Anchor',
  Rotator = 'Rotator'
}