import { Pool } from '@neondatabase/serverless';
import { db } from './db';
import { PlayerWithPIV, TeamWithTIR, PlayerRole } from '@shared/types';

/**
 * Adapter for raw Supabase database interaction
 * Processes raw match data to calculate derived metrics
 */
export class SupabaseRawAdapter {
  /**
   * Check database connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      const result = await db.execute('SELECT NOW()');
      return result.rows.length === 1;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }
  
  /**
   * Get available events
   */
  async getEvents(): Promise<{ id: number, name: string }[]> {
    try {
      const query = `SELECT id, name FROM events`;
      const result = await db.execute(query);
      return result.rows as { id: number, name: string }[];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Get raw player statistics and calculate PIV values
   */
  async getPlayersWithPIV(): Promise<PlayerWithPIV[]> {
    try {
      // Get raw player statistics from database
      const query = `SELECT * FROM player_stats`;
      const result = await db.execute(query);
      const playerRows = result.rows as any[];
      
      console.log(`Found ${playerRows.length} players in player_stats table`);
      
      if (playerRows.length === 0) {
        return [];
      }
      
      // Transform players with calculated PIV values
      return playerRows.map(player => {
        // Map role to enum
        let role = PlayerRole.Support;
        if (player.role) {
          const normalizedRole = String(player.role).trim().toLowerCase();
          if (normalizedRole.includes('awp')) role = PlayerRole.AWP;
          else if (normalizedRole === 'support') role = PlayerRole.Support;
          else if (normalizedRole === 'lurker') role = PlayerRole.Lurker;
          else if (normalizedRole === 'igl') role = PlayerRole.IGL;
          else if (normalizedRole.includes('space')) role = PlayerRole.Spacetaker;
          else if (normalizedRole === 'anchor') role = PlayerRole.Anchor;
          else if (normalizedRole === 'rotator') role = PlayerRole.Rotator;
        }
        
        // Calculate KD ratio
        const kills = player.kills || 0;
        const deaths = player.deaths || 1; // Avoid division by zero
        const kd = parseFloat(player.kd) || kills / deaths;
        
        // Calculate PIV (a more complex algorithm would go here in a real app)
        // For now, we'll base it on a combination of KD, headshots %, flash assists, and first kills
        const hsPercentage = kills > 0 ? (player.headshots || 0) / kills : 0;
        const firstKillImpact = ((player.first_kills || 0) / Math.max(1, (player.first_kills || 0) + (player.first_deaths || 0))) * 0.5;
        const utilityContribution = ((player.assisted_flashes || 0) / 15) * 0.2;
        
        // PIV = base value * (KD influence) * (headshot bonus) + utility + first kill impact
        let pivValue = 0.8 * (kd * 0.75) * (1 + hsPercentage * 0.25) + utilityContribution + firstKillImpact;
        
        // Normalize PIV to a reasonable range (0.5 to 2.0)
        pivValue = Math.max(0.5, Math.min(2.0, pivValue));
        
        // Create complex nested metrics for PlayerDetailPage
        const entryValue = (player.first_kills || 0) / Math.max(1, (player.first_kills || 0) + (player.first_deaths || 0)) || 0.6;
        const supportValue = (player.assisted_flashes || 10) / 15 || 0.5;
        const utilityValue = (player.total_utility_thrown || 100) / 200 || 0.6;
        
        return {
          id: player.steam_id || String(player.id) || '',
          name: player.user_name || 'Unknown Player',
          team: player.team_clan_name || '',
          role: role,
          tRole: role,
          ctRole: role,
          isIGL: player.is_igl === 't' || player.is_igl === true,
          isMainAWPer: player.is_main_awper === 't' || player.is_main_awper === true,
          piv: pivValue,
          tPIV: pivValue * 0.95,
          ctPIV: pivValue * 1.05,
          kd: kd,
          rating: pivValue * kd,
          metrics: {
            kills: kills,
            deaths: deaths,
            assists: player.assists || 0,
            flashAssists: player.assisted_flashes || 0,
            headshotPercentage: (hsPercentage * 100).toFixed(1),
            kd: kd,
            adr: 0, // Not available in raw data
            clutches: 0 // Not available in raw data
          },
          utilityStats: {
            flashesThrown: player.flashes_thrown || 0,
            smokeGrenades: player.smokes_thrown || 0,
            heGrenades: player.he_thrown || 0,
            molotovs: player.infernos_thrown || 0, 
            totalUtility: player.total_utility_thrown || 0
          },
          primaryMetric: {
            value: pivValue,
            label: 'PIV',
            description: 'Player Impact Value'
          },
          // Additional metrics for the detailed view
          rcs: {
            value: 0.75,
            metrics: {
              "Entry Kills": entryValue,
              "Trading": 0.65,
              "Positioning": 0.72,
              "Utility Usage": utilityValue,
              "Support Play": supportValue,
              "Clutch Factor": 0.7,
              "Map Control": 0.68,
              "Consistency": 0.7
            }
          },
          icf: { value: 0.7, sigma: 0.3 },
          sc: { value: supportValue, metric: "Team Contribution" },
          osm: 1.1,
          tMetrics: {
            roleMetrics: {
              "Entry Efficiency": 0.7,
              "Site Control": 0.68,
              "Trade Efficiency": 0.72
            }
          },
          ctMetrics: {
            roleMetrics: {
              "Site Defense": 0.76,
              "Retake Success": 0.67,
              "Position Rotation": 0.63
            }
          },
          rawStats: player
        };
      });
    } catch (error) {
      console.error('Error getting players with PIV:', error);
      return [];
    }
  }

  /**
   * Get teams and calculate TIR values based on player statistics
   */
  async getTeamsWithTIR(): Promise<TeamWithTIR[]> {
    try {
      // Get all players first to calculate team metrics
      const players = await this.getPlayersWithPIV();
      
      // Group players by team
      const playersByTeam: Record<string, PlayerWithPIV[]> = {};
      for (const player of players) {
        if (!player.team) continue;
        
        if (!playersByTeam[player.team]) {
          playersByTeam[player.team] = [];
        }
        playersByTeam[player.team].push(player);
      }
      
      // Create team objects with calculated metrics
      const teams: TeamWithTIR[] = [];
      
      for (const [teamName, teamPlayers] of Object.entries(playersByTeam)) {
        // Skip teams with no players
        if (teamPlayers.length === 0) continue;
        
        // Sort players by PIV for top players
        const sortedPlayers = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
        
        // Calculate team metrics
        const totalPIV = teamPlayers.reduce((sum, p) => sum + (p.piv || 0), 0);
        const avgPIV = totalPIV / teamPlayers.length;
        
        // Calculate synergy factor (would be more complex in a real app)
        // For now, it increases with team balance and decreases with standard deviation of PIVs
        let synergy = 0.85; // Base synergy
        
        if (teamPlayers.length >= 5) {
          // Calculate PIV standard deviation
          const pivValues = teamPlayers.map(p => p.piv || 0);
          const pivMean = pivValues.reduce((sum, val) => sum + val, 0) / pivValues.length;
          const pivVariance = pivValues.reduce((sum, val) => sum + Math.pow(val - pivMean, 2), 0) / pivValues.length;
          const pivStdDev = Math.sqrt(pivVariance);
          
          // Higher stdev = lower synergy, lower stdev = higher synergy
          synergy = 0.85 * (1 - (pivStdDev / 2)); 
          
          // Ensure synergy stays in reasonable bounds
          synergy = Math.max(0.7, Math.min(0.95, synergy));
        }
        
        // Calculate TIR (Team Impact Rating)
        // TIR = average PIV * synergy factor * team size bonus
        const teamSizeBonus = Math.min(1.15, 0.9 + (teamPlayers.length * 0.05));
        const tir = avgPIV * synergy * teamSizeBonus;
        
        // Count roles for distribution
        const roleCount = {
          [PlayerRole.Support]: 0,
          [PlayerRole.AWP]: 0,
          [PlayerRole.Lurker]: 0, 
          [PlayerRole.IGL]: 0,
          [PlayerRole.Spacetaker]: 0,
          [PlayerRole.Anchor]: 0,
          [PlayerRole.Rotator]: 0
        };
        
        // Count roles from player data
        for (const player of teamPlayers) {
          if (player.role) {
            roleCount[player.role]++;
          }
        }
        
        // Create top player object
        const topPlayer = sortedPlayers.length > 0 ? {
          id: sortedPlayers[0].id,
          name: sortedPlayers[0].name,
          piv: sortedPlayers[0].piv
        } : {
          id: 'unknown',
          name: 'Unknown',
          piv: 1.0
        };
        
        // Generate strengths and weaknesses based on team composition
        const strengths = [];
        const weaknesses = [];
        
        // Check role balance
        const roleBalance = Object.values(roleCount).filter(count => count > 0).length;
        if (roleBalance >= 5) {
          strengths.push("Balanced roster");
        } else if (roleBalance <= 3) {
          weaknesses.push("Limited role diversity");
        }
        
        // Check AWPers
        if (roleCount[PlayerRole.AWP] >= 2) {
          strengths.push("Strong AWP presence");
        } else if (roleCount[PlayerRole.AWP] === 0) {
          weaknesses.push("Lack of dedicated AWPer");
        }
        
        // Check IGL
        if (roleCount[PlayerRole.IGL] >= 1) {
          strengths.push("Strong leadership");
        } else {
          weaknesses.push("Needs dedicated IGL");
        }
        
        // Check support
        if (roleCount[PlayerRole.Support] >= 2) {
          strengths.push("Strong support lineup");
        }
        
        // Ensure we have at least one strength and weakness
        if (strengths.length === 0) {
          strengths.push("Developing team chemistry");
        }
        if (weaknesses.length === 0) {
          weaknesses.push("Needs more experience");
        }
        
        // Create the team object
        teams.push({
          id: `team_${teamName.replace(/\s+/g, '_').toLowerCase()}`,
          name: teamName,
          logo: '',
          tir: tir,
          sumPIV: totalPIV,
          synergy: synergy,
          avgPIV: avgPIV,
          topPlayer: topPlayer,
          players: teamPlayers,
          topPlayers: sortedPlayers.slice(0, 5),
          wins: 0, // Not available in raw data
          losses: 0, // Not available in raw data
          roleDistribution: roleCount,
          strengths: strengths.slice(0, 3),
          weaknesses: weaknesses.slice(0, 3)
        });
      }
      
      console.log(`Generated ${teams.length} teams with TIR values from player data`);
      return teams;
    } catch (error) {
      console.error('Error generating teams with TIR:', error);
      return [];
    }
  }
}

export const supabaseRawAdapter = new SupabaseRawAdapter();