import { PlayerRole } from '@shared/schema';

export interface RawPlayerData {
  steamId: string;
  userName: string;
  teamName: string;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  kast: number;
  rating: number;
  entryKills: number;
  entryDeaths: number;
  multiKills: number;
  clutchWins: number;
  clutchAttempts: number;
  flashAssists: number;
  rounds: number;
  maps: number;
  teamRounds: number;
  isIGL: boolean;
  tRole: string;
  ctRole: string;
  eventId: number;
}

export interface PlayerWithPIV {
  id: string;
  name: string;
  team: string;
  steamId: string;
  role: string;
  tRole: string;
  ctRole: string;
  isIGL: boolean;
  piv: number;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  kast: number;
  rating: number;
  kd: number;
  entryKills: number;
  entryDeaths: number;
  multiKills: number;
  clutchWins: number;
  clutchAttempts: number;
  flashAssists: number;
  rounds: number;
  maps: number;
  teamRounds: number;
  eventId: number;
  tournament: string;
  primaryMetric?: {
    value: number;
    label: string;
  };
}

/**
 * Calculate PIV (Player Impact Value) from raw player statistics
 */
export function calculatePIV(player: RawPlayerData): number {
  const kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
  const entrySuccess = player.entryKills + player.entryDeaths > 0 ? 
    player.entryKills / (player.entryKills + player.entryDeaths) : 0.5;
  const clutchSuccess = player.clutchAttempts > 0 ? 
    player.clutchWins / player.clutchAttempts : 0;

  // Base impact calculation
  const killImpact = (player.kills * 1.0) + (player.entryKills * 1.5) + (player.multiKills * 0.5);
  const survivalImpact = kd * 15 + (player.kast / 100) * 20;
  const utilityImpact = (player.flashAssists * 2) + (player.assists * 1.2);
  const clutchImpact = clutchSuccess * 25 + player.clutchWins * 3;
  
  // Role-specific multipliers
  const roleMultiplier = getRoleMultiplier(player);
  
  // Consistency factor based on rating and ADR
  const consistencyFactor = Math.min(1.2, (player.rating / 1.0) * 0.3 + (player.adr / 80) * 0.2 + 0.5);
  
  // Final PIV calculation
  const basePIV = (killImpact + survivalImpact + utilityImpact + clutchImpact) * roleMultiplier * consistencyFactor;
  
  return Math.round(basePIV);
}

/**
 * Get role-specific multiplier for PIV calculation
 */
function getRoleMultiplier(player: RawPlayerData): number {
  const primaryRole = determinePrimaryRole(player);
  
  switch (primaryRole) {
    case 'Spacetaker':
      return 1.1 + (player.entryKills > 0 ? 0.1 : 0);
    case 'AWPer':
      return 1.05 + (player.kills > player.deaths ? 0.1 : 0);
    case 'IGL':
      return 0.95 + (player.assists > player.kills * 0.6 ? 0.15 : 0);
    case 'Support':
      return 1.0 + (player.flashAssists > 5 ? 0.1 : 0);
    case 'Lurker':
      return 1.05 + (player.clutchWins > 0 ? 0.1 : 0);
    case 'Anchor':
      return 1.0 + (player.kast > 70 ? 0.1 : 0);
    default:
      return 1.0;
  }
}

/**
 * Determine primary role from T and CT roles
 */
function determinePrimaryRole(player: RawPlayerData): string {
  if (player.isIGL) return 'IGL';
  
  // Priority system for role determination
  const tRole = parseRole(player.tRole);
  const ctRole = parseRole(player.ctRole);
  
  // If both roles are the same, use that
  if (tRole === ctRole) return tRole;
  
  // Priority: Spacetaker > AWPer > Lurker > Anchor > Support > Rotator
  const rolePriority = [
    'Spacetaker',
    'AWPer', 
    'Lurker',
    'Anchor',
    'Support',
    'Rotator'
  ];
  
  for (const role of rolePriority) {
    if (tRole === role || ctRole === role) return role;
  }
  
  return 'Support'; // Default fallback
}

/**
 * Parse role string to string
 */
function parseRole(roleStr: string): string {
  const normalized = roleStr?.toLowerCase().trim();
  
  switch (normalized) {
    case 'entry':
    case 'spacetaker':
      return 'Spacetaker';
    case 'awp':
    case 'awper':
      return 'AWPer';
    case 'lurker':
      return 'Lurker';
    case 'anchor':
      return 'Anchor';
    case 'support':
      return 'Support';
    case 'igl':
      return 'IGL';
    case 'rifler':
    case 'rotator':
      return 'Rotator';
    default:
      return 'Support';
  }
}

/**
 * Calculate primary metric for player display
 */
function calculatePrimaryMetric(player: RawPlayerData, role: string): { value: number; label: string } {
  switch (role) {
    case 'Spacetaker':
      const entrySuccess = player.entryKills + player.entryDeaths > 0 ? 
        (player.entryKills / (player.entryKills + player.entryDeaths)) * 100 : 0;
      return { value: Math.round(entrySuccess), label: 'Opening Success %' };
    
    case 'AWPer':
      const kdRatio = player.deaths > 0 ? player.kills / player.deaths : player.kills;
      return { value: Math.round(kdRatio * 100) / 100, label: 'K/D Ratio' };
    
    case 'Lurker':
      const clutchSuccess = player.clutchAttempts > 0 ? 
        (player.clutchWins / player.clutchAttempts) * 100 : 0;
      return { value: Math.round(clutchSuccess), label: 'Clutch Success %' };
    
    case 'Support':
      return { value: player.flashAssists, label: 'Flash Assists' };
    
    case 'IGL':
      return { value: Math.round(player.rating * 100) / 100, label: 'Team Rating' };
    
    case 'Anchor':
      return { value: Math.round(player.kast), label: 'KAST %' };
    
    default:
      return { value: Math.round(player.adr), label: 'ADR' };
  }
}

/**
 * Convert raw player data to PlayerWithPIV
 */
export function processRawPlayerData(players: RawPlayerData[]): PlayerWithPIV[] {
  return players.map(player => {
    const primaryRole = determinePrimaryRole(player);
    const piv = calculatePIV(player);
    const kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
    const primaryMetric = calculatePrimaryMetric(player, primaryRole);
    
    // Determine tournament name from eventId
    const tournament = player.eventId === 1 ? 'IEM Katowice 2025' : 'PGL Bucharest 2025';
    
    return {
      id: player.steamId,
      name: player.userName || `Player_${player.steamId}`,
      team: player.teamName,
      steamId: player.steamId,
      role: primaryRole,
      tRole: parseRole(player.tRole),
      ctRole: parseRole(player.ctRole),
      isIGL: player.isIGL,
      piv,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      adr: player.adr,
      kast: player.kast,
      rating: player.rating,
      kd: Math.round(kd * 100) / 100,
      entryKills: player.entryKills,
      entryDeaths: player.entryDeaths,
      multiKills: player.multiKills,
      clutchWins: player.clutchWins,
      clutchAttempts: player.clutchAttempts,
      flashAssists: player.flashAssists,
      rounds: player.rounds,
      maps: player.maps,
      teamRounds: player.teamRounds,
      eventId: player.eventId,
      tournament,
      primaryMetric
    };
  });
}