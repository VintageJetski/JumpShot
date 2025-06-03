import { PlayerWithPIV, TeamWithTIR } from './types';

/**
 * Calculate team synergy layer
 */
export function calculateTeamSynergy(players: PlayerWithPIV[]): number {
  if (players.length === 0) return 0;
  
  // Role distribution score
  const roles = players.map(p => p.role);
  const uniqueRoles = new Set(roles);
  const roleDistributionScore = uniqueRoles.size / 7; // Normalize by max possible roles
  
  // K/D variance (lower variance = better synergy)
  const kdValues = players.map(p => p.rawStats.kd);
  const avgKD = kdValues.reduce((sum, kd) => sum + kd, 0) / kdValues.length;
  const kdVariance = kdValues.reduce((sum, kd) => sum + Math.pow(kd - avgKD, 2), 0) / kdValues.length;
  const kdSynergyScore = 1 / (1 + kdVariance); // Convert variance to 0-1 score
  
  // Utility coordination score
  const totalUtility = players.reduce((sum, p) => sum + p.rawStats.totalUtilityThrown, 0);
  const avgUtilityPerPlayer = totalUtility / players.length;
  const utilityBalance = players.reduce((sum, p) => {
    return sum + Math.abs(p.rawStats.totalUtilityThrown - avgUtilityPerPlayer);
  }, 0) / players.length;
  const utilitySynergyScore = 1 / (1 + utilityBalance / avgUtilityPerPlayer);
  
  // Combined synergy score
  return (roleDistributionScore * 0.4) + (kdSynergyScore * 0.35) + (utilitySynergyScore * 0.25);
}

/**
 * Calculate TIR (Team Impact Rating) for each team
 */
export function calculateTeamImpactRatings(players: PlayerWithPIV[]): TeamWithTIR[] {
  // Group players by team
  const teamMap = new Map<string, PlayerWithPIV[]>();
  
  players.forEach(player => {
    if (!teamMap.has(player.team)) {
      teamMap.set(player.team, []);
    }
    teamMap.get(player.team)!.push(player);
  });
  
  const teams: TeamWithTIR[] = [];
  
  teamMap.forEach((teamPlayers, teamName) => {
    if (teamPlayers.length === 0) return;
    
    // Calculate team metrics
    const sumPIV = teamPlayers.reduce((sum, player) => sum + player.metrics.piv, 0);
    const avgPIV = sumPIV / teamPlayers.length;
    const synergy = calculateTeamSynergy(teamPlayers);
    
    // Find top player
    const topPlayer = teamPlayers.reduce((best, current) => 
      current.metrics.piv > best.metrics.piv ? current : best
    );
    
    // Calculate TIR: (Average PIV × Team Size Factor × Synergy)
    const teamSizeFactor = Math.min(teamPlayers.length / 5, 1); // Normalize for 5-player teams
    const tir = avgPIV * teamSizeFactor * (1 + synergy);
    
    teams.push({
      id: `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`,
      name: teamName,
      players: teamPlayers,
      tir,
      sumPIV,
      synergy,
      avgPIV,
      topPlayerName: topPlayer.name,
      topPlayerPIV: topPlayer.metrics.piv
    });
  });
  
  // Sort teams by TIR (highest first)
  return teams.sort((a, b) => b.tir - a.tir);
}