import { PlayerRole, PlayerWithPIV, TeamWithTIR } from "@shared/types";

/**
 * Interface for player scout data with metrics relevant to team chemistry
 */
export interface PlayerScoutData {
  scoutMetrics: {
    // Overall score from 0-100 for this player's fit with the team
    overall: number;
    
    // Score from 0-100 for this player's role fit
    roleScore: number;
    
    // Score from 0-100 for this player's synergy with team
    synergy: number;
    
    // Score from 0-100 for this player's consistency
    consistency: number;
    
    // Score from 0-100 for this player's statistical performance
    performance: number;
  };
}

/**
 * Interface for role complementary scores
 */
interface RoleComplement {
  [key: string]: {
    [key: string]: number; // Score from 0-100
  }
}

/**
 * Define role complementary matrix - which roles work well together
 * Higher values indicate better synergy between roles
 */
const roleComplementMatrix: RoleComplement = {
  [PlayerRole.IGL]: {
    [PlayerRole.AWP]: 85,
    [PlayerRole.Support]: 75,
    [PlayerRole.Spacetaker]: 80,
    [PlayerRole.Lurker]: 70,
    [PlayerRole.Anchor]: 65,
    [PlayerRole.Rotator]: 60,
  },
  [PlayerRole.AWP]: {
    [PlayerRole.IGL]: 85,
    [PlayerRole.Support]: 90,
    [PlayerRole.Spacetaker]: 75,
    [PlayerRole.Lurker]: 60,
    [PlayerRole.Anchor]: 80,
    [PlayerRole.Rotator]: 70,
  },
  [PlayerRole.Support]: {
    [PlayerRole.IGL]: 75,
    [PlayerRole.AWP]: 90,
    [PlayerRole.Spacetaker]: 95,
    [PlayerRole.Lurker]: 65,
    [PlayerRole.Anchor]: 60,
    [PlayerRole.Rotator]: 65,
  },
  [PlayerRole.Spacetaker]: {
    [PlayerRole.IGL]: 80,
    [PlayerRole.AWP]: 75,
    [PlayerRole.Support]: 95,
    [PlayerRole.Lurker]: 85,
    [PlayerRole.Anchor]: 55,
    [PlayerRole.Rotator]: 60,
  },
  [PlayerRole.Lurker]: {
    [PlayerRole.IGL]: 70,
    [PlayerRole.AWP]: 60,
    [PlayerRole.Support]: 65,
    [PlayerRole.Spacetaker]: 85,
    [PlayerRole.Anchor]: 50,
    [PlayerRole.Rotator]: 55,
  },
  [PlayerRole.Anchor]: {
    [PlayerRole.IGL]: 65,
    [PlayerRole.AWP]: 80,
    [PlayerRole.Support]: 60,
    [PlayerRole.Spacetaker]: 55,
    [PlayerRole.Lurker]: 50,
    [PlayerRole.Rotator]: 90,
  },
  [PlayerRole.Rotator]: {
    [PlayerRole.IGL]: 60,
    [PlayerRole.AWP]: 70,
    [PlayerRole.Support]: 65,
    [PlayerRole.Spacetaker]: 60,
    [PlayerRole.Lurker]: 55,
    [PlayerRole.Anchor]: 90,
  },
};

/**
 * Calculate scout metrics for a player in the context of a specific team
 * @param player The player to evaluate
 * @param team The team context for evaluation
 * @param allPlayers All players in the database for relative comparisons
 * @returns PlayerScoutData with calculated metrics
 */
export function calculatePlayerScoutData(
  player: PlayerWithPIV, 
  team: TeamWithTIR | null,
  allPlayers: PlayerWithPIV[]
): PlayerScoutData {
  // Set default metrics for a new player
  const defaultScoutMetrics = {
    overall: 50,
    roleScore: 50,
    synergy: 50,
    consistency: 50,
    performance: 50,
  };
  
  // If no team context is provided, return default metrics
  if (!team) {
    return { scoutMetrics: defaultScoutMetrics };
  }
  
  // Calculate role score based on player's primary role and PIV
  const roleScore = calculateRoleScore(player, team);
  
  // Calculate synergy with the team's existing players
  const synergy = calculateTeamSynergy(player, team, allPlayers);
  
  // Calculate consistency from ICF metrics
  const consistency = calculateConsistency(player);
  
  // Calculate performance score (K/D, ADR, KAST, etc)
  const performance = calculatePerformance(player, allPlayers);
  
  // Calculate overall score as weighted average of the component scores
  const overall = calculateOverallScore(roleScore, synergy, consistency, performance);
  
  return {
    scoutMetrics: {
      overall,
      roleScore,
      synergy,
      consistency,
      performance
    }
  };
}

/**
 * Calculate how well the player's role fits with the team's needs
 */
function calculateRoleScore(player: PlayerWithPIV, team: TeamWithTIR): number {
  // Get existing team roles
  const teamRoles = team.players.map(p => p.role);
  
  // Base score based on player's PIV relative to average PIV
  const baseScore = Math.min(100, Math.max(30, player.piv * 30));
  
  // Check if team already has player's role
  const hasRole = teamRoles.includes(player.role);
  
  // Check if team already has enough players with the role
  const roleCount = teamRoles.filter(r => r === player.role).length;
  
  // Adjust score based on role uniqueness
  let roleUniquenessModifier = 1.0;
  
  // Every team needs one IGL
  if (player.role === PlayerRole.IGL && !teamRoles.includes(PlayerRole.IGL)) {
    roleUniquenessModifier = 1.5;
  }
  // Every team needs one AWP
  else if (player.role === PlayerRole.AWP && !teamRoles.includes(PlayerRole.AWP)) {
    roleUniquenessModifier = 1.4;
  }
  // Every team needs 1-2 entry players
  else if (player.role === PlayerRole.Spacetaker && roleCount < 2) {
    roleUniquenessModifier = 1.3;
  }
  // Need 1-2 support players
  else if (player.role === PlayerRole.Support && roleCount < 2) {
    roleUniquenessModifier = 1.2;
  }
  // Lurkers are good but not essential in high numbers
  else if (player.role === PlayerRole.Lurker && roleCount < 1) {
    roleUniquenessModifier = 1.1;
  }
  // Penalize for role redundancy
  else if (hasRole && roleCount >= 2) {
    roleUniquenessModifier = 0.7;
  }
  
  // Calculate final score
  const finalScore = Math.min(100, Math.max(0, baseScore * roleUniquenessModifier));
  
  return finalScore;
}

/**
 * Calculate synergy between player and existing team members
 */
function calculateTeamSynergy(
  player: PlayerWithPIV, 
  team: TeamWithTIR,
  allPlayers: PlayerWithPIV[]
): number {
  // If player is already on the team, high synergy by default
  if (player.team === team.name) {
    return Math.min(100, 75 + (player.piv * 8));
  }
  
  // Calculate role compatibility with existing players
  let totalCompatibility = 0;
  let compatibilityCount = 0;
  
  for (const teamPlayer of team.players) {
    const compatibility = getRoleCompatibility(player.role, teamPlayer.role);
    
    totalCompatibility += compatibility;
    compatibilityCount++;
  }
  
  // Average compatibility score (0-100)
  const avgCompatibility = compatibilityCount > 0 
    ? totalCompatibility / compatibilityCount 
    : 60; // Default for empty team
  
  // Factor in player's relative PIV compared to team average
  const teamAvgPIV = team.players.reduce((sum, p) => sum + p.piv, 0) / team.players.length;
  const pivRatio = player.piv / teamAvgPIV;
  
  // Calculate PIV modifier - bonus for higher PIV than team average
  const pivModifier = Math.min(1.3, Math.max(0.7, pivRatio));
  
  // Calculate final synergy score
  const synergyScore = Math.min(100, avgCompatibility * pivModifier);
  
  return synergyScore;
}

/**
 * Get role compatibility score between two roles
 */
function getRoleCompatibility(role1: PlayerRole, role2: PlayerRole): number {
  // Check if roles are defined in our matrix
  if (roleComplementMatrix[role1] && roleComplementMatrix[role1][role2]) {
    return roleComplementMatrix[role1][role2];
  }
  
  // Default compatibility if not specified
  return 50;
}

/**
 * Calculate consistency score based on player metrics
 */
function calculateConsistency(player: PlayerWithPIV): number {
  // Use the ICF (Individual Consistency Factor) if available
  if (player.metrics && player.metrics.icf) {
    // Check if it's an object with value property (ICFMetric)
    if (typeof player.metrics.icf === 'object' && 'value' in player.metrics.icf) {
      // Scale ICF value (typically 0-1) to a 0-100 score
      return Math.min(100, Math.max(0, player.metrics.icf.value * 100));
    } 
    // Or if it's just a number
    else if (typeof player.metrics.icf === 'number') {
      return Math.min(100, Math.max(0, player.metrics.icf * 100));
    }
  }
  
  // Calculate from K/D ratio as fallback
  if (player.kd) {
    // Base score derived from K/D ratio
    const kdScore = Math.min(100, Math.max(0, (player.kd - 0.7) * 50));
    return kdScore;
  }
  
  // Default consistency if metrics missing
  return 50;
}

/**
 * Calculate performance score based on player stats relative to all players
 */
function calculatePerformance(player: PlayerWithPIV, allPlayers: PlayerWithPIV[]): number {
  // Start with PIV as the base metric
  const pivScore = Math.min(100, Math.max(0, player.piv * 30));
  
  // Add bonus for high K/D relative to other players
  const maxKD = Math.max(...allPlayers.map(p => p.kd || 0));
  const kdRelativeScore = maxKD > 0 ? (player.kd / maxKD) * 100 : 50;
  
  // Calculate combined score
  const combinedScore = (pivScore * 0.7) + (kdRelativeScore * 0.3);
  
  return Math.min(100, Math.max(0, combinedScore));
}

/**
 * Calculate overall score as weighted average of component scores
 */
function calculateOverallScore(
  roleScore: number, 
  synergy: number, 
  consistency: number, 
  performance: number
): number {
  // Weights for different components
  const weights = {
    roleScore: 0.35,
    synergy: 0.25,
    consistency: 0.15,
    performance: 0.25
  };
  
  // Calculate weighted score
  const overall = (
    (roleScore * weights.roleScore) +
    (synergy * weights.synergy) +
    (consistency * weights.consistency) +
    (performance * weights.performance)
  );
  
  return Math.round(overall);
}