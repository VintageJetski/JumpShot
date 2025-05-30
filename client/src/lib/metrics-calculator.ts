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

export interface ClientPlayerWithPIV {
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
 * Calculate PIV (Player Impact Value) using the complete PRD formula:
 * PIV = (RCS × ICF × SC × OSM) + Basic_Metrics_Bonus + Situational_Modifiers + Map_Specific_Adjustments
 */
export function calculatePIV(player: RawPlayerData): number {
  const kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
  
  // Calculate PIV components per PRD specifications
  const rcs = calculateRCS(player);
  const icf = calculateICF(player);
  const sc = calculateSC(player);
  const osm = calculateOSM(player);
  
  // Basic metrics bonus (0.0 to 0.5)
  const basicMetricsBonus = calculateBasicMetricsBonus(player);
  
  // Situational modifiers (-0.2 to +0.3)
  const situationalModifiers = calculateSituationalModifiers(player);
  
  // Map-specific adjustments (-0.1 to +0.1)
  const mapSpecificAdjustments = 0; // Placeholder for map-specific data
  
  // Master PIV formula
  const pivScore = (rcs * icf * sc * osm) + basicMetricsBonus + situationalModifiers + mapSpecificAdjustments;
  
  // Ensure reasonable bounds and convert to 0-100 scale
  return Math.max(0, Math.min(100, pivScore * 100));
}

/**
 * Calculate RCS (Role Core Score) - Role-specific performance metrics (0.0-1.0)
 * Based on PRD role definitions and weightings
 */
function calculateRCS(player: RawPlayerData): number {
  const tRole = parseRole(player.tRole);
  const ctRole = parseRole(player.ctRole);
  const isIGL = player.isIGL;
  
  // Calculate T-side and CT-side RCS separately, then average
  const tRCS = calculateTSideRCS(player, tRole, isIGL);
  const ctRCS = calculateCTSideRCS(player, ctRole, isIGL);
  
  return (tRCS + ctRCS) / 2;
}

/**
 * Calculate T-side RCS based on role
 */
function calculateTSideRCS(player: RawPlayerData, role: string, isIGL: boolean): number {
  if (isIGL) {
    // IGL metrics: Strategic execution, team coordination, adaptive calling
    const teamCoord = Math.min(1.0, player.assists / (player.rounds * 0.5)); // Team coordination proxy
    const economicMgmt = Math.min(1.0, player.adr / 75); // Economic efficiency proxy
    const adaptiveCall = Math.min(1.0, player.rating / 1.1); // Adaptive calling proxy
    return (teamCoord * 0.25 + economicMgmt * 0.15 + adaptiveCall * 0.20) + 0.4;
  }

  switch (role) {
    case 'Entry Fragger':
      const openingKillRate = player.entryKills / Math.max(1, player.entryKills + player.entryDeaths);
      const multiKillRate = player.multiKills / Math.max(1, player.rounds);
      const tradeEff = Math.min(1.0, player.assists / Math.max(1, player.deaths));
      return (openingKillRate * 0.30 + multiKillRate * 0.25 + tradeEff * 0.20) + 0.25;

    case 'Support':
      const flashEff = Math.min(1.0, player.flashAssists / Math.max(1, player.rounds * 0.3));
      const tradeKills = Math.min(1.0, player.assists / Math.max(1, player.rounds * 0.4));
      const utilCoord = Math.min(1.0, (player.flashAssists + player.assists) / Math.max(1, player.rounds * 0.6));
      return (flashEff * 0.35 + tradeKills * 0.30 + utilCoord * 0.20) + 0.15;

    case 'Lurker':
      const infoGather = Math.min(1.0, player.assists / Math.max(1, player.rounds * 0.2)); // Info proxy
      const flankSuccess = Math.min(1.0, player.clutchWins / Math.max(1, player.clutchAttempts));
      const zoneInfluence = Math.min(1.0, player.adr / 60); // Map control proxy
      return (infoGather * 0.40 + flankSuccess * 0.30 + zoneInfluence * 0.20) + 0.10;

    case 'AWPer':
      const pickEff = Math.min(1.0, player.kills / Math.max(1, player.rounds * 0.8));
      const econImpact = Math.min(1.0, player.adr / 85); // Economic impact proxy
      const mapControl = Math.min(1.0, player.kast / 75); // Map control proxy
      return (pickEff * 0.40 + econImpact * 0.25 + mapControl * 0.20) + 0.15;

    default: // Support fallback
      return Math.min(1.0, (player.assists + player.flashAssists) / Math.max(1, player.rounds * 0.5));
  }
}

/**
 * Calculate CT-side RCS based on role
 */
function calculateCTSideRCS(player: RawPlayerData, role: string, isIGL: boolean): number {
  if (isIGL) {
    // Same IGL calculation as T-side
    const teamCoord = Math.min(1.0, player.assists / (player.rounds * 0.5));
    const economicMgmt = Math.min(1.0, player.adr / 75);
    const adaptiveCall = Math.min(1.0, player.rating / 1.1);
    return (teamCoord * 0.25 + economicMgmt * 0.15 + adaptiveCall * 0.20) + 0.4;
  }

  switch (role) {
    case 'Anchor':
      const siteHold = Math.min(1.0, player.kast / 70); // Site hold proxy
      const retakeEff = Math.min(1.0, player.clutchWins / Math.max(1, player.clutchAttempts));
      const econConserv = Math.min(1.0, player.adr / 70); // Economic conservation proxy
      return (siteHold * 0.35 + retakeEff * 0.25 + econConserv * 0.20) + 0.20;

    case 'Rotator':
      const rotationEff = Math.min(1.0, player.assists / Math.max(1, player.rounds * 0.4));
      const adaptiveDef = Math.min(1.0, player.rating / 1.0);
      const retakeUtil = Math.min(1.0, player.flashAssists / Math.max(1, player.rounds * 0.2));
      return (rotationEff * 0.40 + adaptiveDef * 0.25 + retakeUtil * 0.20) + 0.15;

    case 'Support':
      const utilEff = Math.min(1.0, (player.flashAssists + player.assists) / Math.max(1, player.rounds * 0.6));
      const teamBackup = Math.min(1.0, player.assists / Math.max(1, player.rounds * 0.3));
      const flashCoord = Math.min(1.0, player.flashAssists / Math.max(1, player.rounds * 0.2));
      return (utilEff * 0.35 + teamBackup * 0.30 + flashCoord * 0.20) + 0.15;

    case 'AWPer':
      const pickEff = Math.min(1.0, player.kills / Math.max(1, player.rounds * 0.7));
      const mapControlDenial = Math.min(1.0, player.adr / 80);
      const econImpact = Math.min(1.0, player.kast / 70);
      return (pickEff * 0.40 + mapControlDenial * 0.25 + econImpact * 0.20) + 0.15;

    default: // Support fallback
      return Math.min(1.0, (player.assists + player.flashAssists) / Math.max(1, player.rounds * 0.5));
  }
}

/**
 * Calculate ICF (Individual Consistency Factor) - Performance stability (0.0-2.0)
 */
function calculateICF(player: RawPlayerData): number {
  const kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
  
  // Base Performance = sqrt(kills × adr) / (deaths + 1)
  const basePerformance = Math.sqrt(player.kills * player.adr) / (player.deaths + 1);
  
  // Consistency Multiplier = 1 + min(kd_ratio × 0.3, 0.6) + stability_bonus
  const kdBonus = Math.min(kd * 0.3, 0.6);
  const stabilityBonus = Math.min(0.2, player.kast / 100 * 0.2); // KAST as stability proxy
  const consistencyMultiplier = 1 + kdBonus + stabilityBonus;
  
  // Performance variance adjustment (simplified)
  const performanceVariance = Math.max(0.8, Math.min(1.2, player.rating));
  
  const icf = (basePerformance * consistencyMultiplier * performanceVariance) / 100;
  return Math.max(0.5, Math.min(2.0, icf));
}

/**
 * Calculate SC (Synergy Contribution) - Team chemistry impact (0.0-1.0)
 */
function calculateSC(player: RawPlayerData): number {
  const role = determinePrimaryRole(player);
  
  // Base synergy from assists and team-oriented metrics
  const baseSynergy = Math.min(1.0, player.assists / Math.max(1, player.rounds * 0.4));
  
  // Role-specific synergy calculations
  let roleSynergy = 0.5;
  
  switch (role) {
    case 'Entry Fragger':
      // Team setup and space creation value
      roleSynergy = Math.min(1.0, (player.entryKills + player.assists) / Math.max(1, player.rounds * 0.6));
      break;
    case 'Support':
      // Enablement efficiency and utility synergy
      roleSynergy = Math.min(1.0, (player.flashAssists * 2 + player.assists) / Math.max(1, player.rounds * 0.8));
      break;
    case 'AWPer':
      // Pick impact on team and economic team impact
      roleSynergy = Math.min(1.0, player.adr / 80); // Economic/pick impact proxy
      break;
    case 'IGL':
      // Strategy execution and player optimization
      roleSynergy = Math.min(1.0, (player.assists + player.rating) / 2);
      break;
    default:
      roleSynergy = baseSynergy;
  }
  
  return (baseSynergy * 0.4 + roleSynergy * 0.6);
}

/**
 * Calculate OSM (Opponent Strength Multiplier) - Difficulty scaling (0.8-1.2)
 */
function calculateOSM(player: RawPlayerData): number {
  // Base OSM = 1.0
  let osm = 1.0;
  
  // Tournament tier adjustment (Major tournaments are harder)
  const isMajorTournament = player.eventId === 1 || player.eventId === 2; // IEM Katowice and PGL Bucharest
  if (isMajorTournament) {
    osm += 0.1; // Major tournament bonus
  }
  
  // Performance-based opponent strength estimation
  // Higher ADR against better opponents suggests stronger opposition
  if (player.adr > 80) {
    osm += 0.05; // Faced strong opponents
  }
  
  // Rating-based adjustment
  if (player.rating > 1.2) {
    osm += 0.05; // Performed well against good teams
  }
  
  return Math.max(0.8, Math.min(1.2, osm));
}

/**
 * Calculate Basic Metrics Bonus (0.0-0.5)
 */
function calculateBasicMetricsBonus(player: RawPlayerData): number {
  const kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
  const kdBonus = Math.min(0.2, kd / 5); // KD contribution
  const adrBonus = Math.min(0.2, player.adr / 100); // ADR contribution  
  const kastBonus = Math.min(0.1, player.kast / 100); // KAST contribution
  
  return kdBonus + adrBonus + kastBonus;
}

/**
 * Calculate Situational Modifiers (-0.2 to +0.3)
 */
function calculateSituationalModifiers(player: RawPlayerData): number {
  let modifiers = 0;
  
  // Clutch performance bonus
  if (player.clutchWins > 0 && player.clutchAttempts > 0) {
    const clutchRate = player.clutchWins / player.clutchAttempts;
    modifiers += Math.min(0.15, clutchRate * 0.3);
  }
  
  // Multi-kill bonus
  if (player.multiKills > player.rounds * 0.1) {
    modifiers += 0.1;
  }
  
  // Entry performance modifier
  if (player.entryKills > 0 && player.entryDeaths > 0) {
    const entryRate = player.entryKills / (player.entryKills + player.entryDeaths);
    if (entryRate > 0.6) {
      modifiers += 0.1;
    } else if (entryRate < 0.4) {
      modifiers -= 0.1;
    }
  }
  
  return Math.max(-0.2, Math.min(0.3, modifiers));
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
export function processRawPlayerData(players: RawPlayerData[]): ClientPlayerWithPIV[] {
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