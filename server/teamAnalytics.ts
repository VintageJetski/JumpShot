import { PlayerWithPIV, TeamWithTIR } from '@shared/schema';

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
  
  // Calculate TIR for each team
  const teams: TeamWithTIR[] = [];
  
  teamMap.forEach((teamPlayers, teamName) => {
    // Calculate sum of player PIVs
    const sumPIV = teamPlayers.reduce((sum, player) => sum + player.piv, 0);
    
    // Calculate synergy layer (TSL)
    // In a real implementation, this would use chain-kill conversion
    // Here we use a simplified formula that considers player interactions
    const synergy = calculateTeamSynergy(teamPlayers);
    
    // Find the top player by PIV
    const topPlayer = teamPlayers.reduce((top, player) => 
      player.piv > top.piv ? player : top, teamPlayers[0]);
    
    // Calculate TIR
    const tir = sumPIV + synergy;
    
    // Calculate average PIV
    const avgPIV = sumPIV / teamPlayers.length;
    
    teams.push({
      id: teamName.replace(/\s+/g, '-').toLowerCase(),
      name: teamName,
      tir: Number(tir.toFixed(2)),
      sumPIV: Number(sumPIV.toFixed(2)),
      synergy: Number(synergy.toFixed(2)),
      avgPIV: Number(avgPIV.toFixed(2)),
      topPlayer: {
        name: topPlayer.name,
        piv: topPlayer.piv
      },
      players: teamPlayers
    });
  });
  
  // Sort teams by TIR descending
  return teams.sort((a, b) => b.tir - a.tir);
}

/**
 * Calculate team synergy layer
 */
function calculateTeamSynergy(players: PlayerWithPIV[]): number {
  // Role diversity bonus
  const uniqueRoles = new Set(players.map(p => p.role));
  const roleDiversityFactor = uniqueRoles.size / 6; // 6 possible roles
  
  // Assisted flashes factor (proxy for coordination)
  const totalAssistedFlashes = players.reduce((sum, p) => sum + p.rawStats.assistedFlashes, 0);
  const assistedFlashesFactor = Math.min(1, totalAssistedFlashes / (players.length * 10));
  
  // Simplified calculation
  const alpha = 0.1; // Weight factor for synergy
  
  return alpha * (roleDiversityFactor + assistedFlashesFactor) * players.length;
}
