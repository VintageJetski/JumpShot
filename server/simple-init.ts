import { PlayerWithPIV, TeamWithTIR } from "@shared/schema";
import { loadNewPlayerStats } from "./newDataParser";
import { loadPlayerRoles } from "./roleParser";
import { processPlayerStatsWithRoles } from "./newPlayerAnalytics";

export async function initializePlayerData(): Promise<{ players: PlayerWithPIV[], teams: TeamWithTIR[] }> {
  try {
    console.log("Loading new player stats from CSV...");
    const rawStats = await loadNewPlayerStats();
    
    console.log("Loading player roles from CSV...");
    const roleMap = await loadPlayerRoles();
    
    console.log("Loading and processing round data...");
    const { processRoundData } = await import("./roundAnalytics");
    const roundMetrics = await processRoundData();
    
    console.log("Processing players with role assignments...");
    const processedPlayers = processPlayerStatsWithRoles(rawStats, roleMap);
    
    // Generate teams from processed players
    const teamMap = new Map<string, TeamWithTIR>();
    processedPlayers.forEach(player => {
      if (!teamMap.has(player.team)) {
        const teamPlayers = processedPlayers.filter(p => p.team === player.team);
        const avgPIV = teamPlayers.reduce((sum, p) => sum + p.piv, 0) / teamPlayers.length;
        const topPlayer = teamPlayers.reduce((best, current) => 
          current.piv > best.piv ? current : best
        );
        
        teamMap.set(player.team, {
          id: player.team.toLowerCase().replace(/\s+/g, '-'),
          name: player.team,
          players: teamPlayers,
          tir: avgPIV,
          sumPIV: teamPlayers.reduce((sum, p) => sum + p.piv, 0),
          synergy: avgPIV * 1.1, // Simple synergy calculation
          avgPIV: avgPIV,
          topPlayer: topPlayer.stats.userName
        });
      }
    });
    
    console.log(`Processed ${processedPlayers.length} players and ${teamMap.size} teams`);
    
    return {
      players: processedPlayers,
      teams: Array.from(teamMap.values())
    };
  } catch (error) {
    console.error("Failed to initialize player data:", error);
    throw error;
  }
}