import { TeamWithTIR } from './types';

/**
 * Calculate dynamic OSM based on TIR rankings
 * Vitality (highest TIR) = 1.0, MOUZ (lowest TIR) = 0.84
 * Future expansion: 50th lowest TIR = 0.1
 */
export function calculateOSM(teams: TeamWithTIR[], targetTeam: string): number {
  if (teams.length === 0) return 1.0;
  
  // Sort teams by TIR (highest to lowest)
  const sortedTeams = [...teams].sort((a, b) => b.tir - a.tir);
  
  // Find the target team's rank
  const teamIndex = sortedTeams.findIndex(team => team.name === targetTeam);
  if (teamIndex === -1) return 1.0; // Default if team not found
  
  const totalTeams = sortedTeams.length;
  
  // Current scaling for 16 teams: Vitality (rank 1) = 1.0, MOUZ (rank 16) = 0.84
  // Future scaling: When we have 50+ teams, rank 50 = 0.1
  
  if (totalTeams <= 16) {
    // Current 16-team scaling
    const minOSM = 0.84;
    const maxOSM = 1.0;
    const rank = teamIndex + 1; // Convert 0-based to 1-based ranking
    
    // Linear interpolation for current 16 teams
    return maxOSM - ((rank - 1) / (totalTeams - 1)) * (maxOSM - minOSM);
  } else {
    // Future expansion scaling with logarithmic curve
    const rank = teamIndex + 1;
    
    if (rank === 1) return 1.0; // Highest TIR always gets 1.0
    
    // Logarithmic scale that reaches 0.1 at rank 50
    const scaleFactor = Math.log(50) / Math.log(rank);
    const baseOSM = 0.1 + (0.9 * Math.pow(scaleFactor, 1.5));
    
    return Math.max(0.1, Math.min(1.0, baseOSM));
  }
}

/**
 * Get OSM for all teams with their rankings
 */
export function calculateAllOSM(teams: TeamWithTIR[]): Record<string, { osm: number; rank: number; tir: number }> {
  const sortedTeams = [...teams].sort((a, b) => b.tir - a.tir);
  const result: Record<string, { osm: number; rank: number; tir: number }> = {};
  
  sortedTeams.forEach((team, index) => {
    result[team.name] = {
      osm: calculateOSM(teams, team.name),
      rank: index + 1,
      tir: team.tir
    };
  });
  
  return result;
}