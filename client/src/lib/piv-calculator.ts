// Client-side PIV calculation engine
// Takes raw player data from API and calculates PIV locally

export interface RawPlayerData {
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
  entryKills: number;
  entryDeaths: number;
  multiKills: number;
  clutchWins: number;
  clutchAttempts: number;
  flashAssists: number;
  rounds: number;
  maps: number;
}

export interface PlayerWithPIV extends RawPlayerData {
  piv: number;
  kd: number;
  role: string;
  primaryMetric: {
    name: string;
    value: number | string;
  };
  id: string; // For compatibility with existing components
}

// Simple PIV calculation based on role and performance
export function calculatePIV(player: RawPlayerData): number {
  const kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
  const kastScore = player.kast || 0;
  const adrNormalized = Math.min(player.adr / 100, 1.5); // Normalize ADR
  
  // Role-based weight adjustments
  let roleMultiplier = 1.0;
  const primaryRole = player.tRole || 'Support';
  
  switch (primaryRole) {
    case 'AWP':
      roleMultiplier = kd > 1.2 ? 1.2 : 0.9; // Reward high-fragging AWPers
      break;
    case 'Entry Fragger':
      roleMultiplier = player.entryKills > 0 ? 1.1 : 0.95;
      break;
    case 'IGL':
      roleMultiplier = 1.05; // Slight bonus for IGL role
      break;
    case 'Support':
      roleMultiplier = player.flashAssists > 5 ? 1.1 : 1.0;
      break;
    default:
      roleMultiplier = 1.0;
  }
  
  // IGL bonus
  const iglBonus = player.isIGL ? 1.1 : 1.0;
  
  // Calculate base PIV
  const basePIV = (kd * 0.4 + kastScore * 0.3 + adrNormalized * 0.3) * roleMultiplier * iglBonus;
  
  // Return PIV as 0-1 value (will be displayed as 0-100)
  return Math.min(Math.max(basePIV, 0), 1);
}

export function processRawPlayersData(rawPlayers: RawPlayerData[]): PlayerWithPIV[] {
  return rawPlayers.map(player => {
    const piv = calculatePIV(player);
    const kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
    
    // Determine primary role
    const role = player.isIGL ? 'IGL' : (player.tRole || 'Support');
    
    // Create primary metric based on role
    let primaryMetric = { name: 'K/D Ratio', value: kd };
    if (role === 'AWP') {
      primaryMetric = { name: 'K/D Ratio', value: kd };
    } else if (role === 'Support') {
      primaryMetric = { name: 'Flash Assists', value: player.flashAssists };
    } else if (role === 'Entry Fragger') {
      primaryMetric = { name: 'Entry Kills', value: player.entryKills };
    }
    
    return {
      ...player,
      piv,
      kd,
      role,
      primaryMetric,
      id: player.steamId, // Use steamId as ID for compatibility
      // Add missing fields for compatibility
      ctPIV: piv * 0.9, // Placeholder - would calculate separately for CT side
      tPIV: piv * 1.1    // Placeholder - would calculate separately for T side
    };
  });
}