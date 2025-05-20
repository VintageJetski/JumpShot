import { Pool } from '@neondatabase/serverless';
import { db } from './db';
import { PlayerWithPIV, TeamWithTIR, PlayerRole } from '@shared/types';

/**
 * Clean adapter for Supabase database with precise mapping
 * Based on the actual database schema without assumptions
 */
export class CleanSupabaseAdapter {
  private pool: Pool;

  constructor() {
    this.pool = db.client;
  }

  /**
   * Check database connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection error:', error);
      return false;
    }
  }

  /**
   * Get all available events
   */
  async getEvents(): Promise<{ id: number, name: string }[]> {
    try {
      const result = await this.pool.query('SELECT id, name FROM events');
      return result.rows.map(row => ({
        id: row.id,
        name: row.name
      }));
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Get players with PIV values directly from player_stats table
   * This returns all players regardless of event as we're amalgamating data
   */
  async getPlayersWithPIV(): Promise<PlayerWithPIV[]> {
    try {
      const query = `
        SELECT 
          ps.steam_id, 
          ps.user_name, 
          ps.team_clan_name, 
          ps.kills, 
          ps.headshots, 
          ps.assists, 
          ps.deaths, 
          ps.kd, 
          ps.first_kills, 
          ps.first_deaths,
          ps.assisted_flashes,
          ps.flashes_thrown,
          ps.he_thrown,
          ps.infernos_thrown,
          ps.smokes_thrown,
          ps.total_utility_thrown
        FROM player_stats ps
      `;

      const result = await this.pool.query(query);
      
      console.log(`Found ${result.rows.length} players in database`);
      
      // Map raw database results to PlayerWithPIV objects
      return result.rows.map(player => {
        // Calculate PIV based on player stats
        // This is a simplified calculation - you'd want a more sophisticated algorithm in production
        const kills = parseInt(player.kills || '0');
        const deaths = parseInt(player.deaths || '0');
        const assists = parseInt(player.assists || '0');
        const firstKills = parseInt(player.first_kills || '0');
        const firstDeaths = parseInt(player.first_deaths || '0');
        
        // Use KD from database if available, otherwise calculate
        const kd = parseFloat(player.kd) || (deaths > 0 ? kills / deaths : 1.0);
        
        // Calculate PIV (in a real app would be more complex)
        const kdFactor = kd * 0.3;
        const firstKillRatio = firstDeaths > 0 ? firstKills / firstDeaths : firstKills;
        const firstKillFactor = firstKillRatio * 0.2;
        
        // Calculate utility factor
        const flashAssists = parseInt(player.assisted_flashes || '0');
        const flashesThrown = parseInt(player.flashes_thrown || '10'); // Avoid division by zero
        const flashFactor = (flashAssists / Math.max(10, flashesThrown)) * 0.15;
        
        let piv = 0.8 + kdFactor + firstKillFactor + flashFactor;
        
        // Clamp PIV to reasonable range
        piv = Math.max(0.5, Math.min(2.0, piv));
        
        // Create PlayerWithPIV object
        return {
          id: player.steam_id || `player_${player.user_name?.replace(/\s+/g, '_').toLowerCase()}`,
          name: player.user_name,
          team: player.team_clan_name,
          
          // Default to Support role since we don't have role information
          role: PlayerRole.Support,
          tRole: PlayerRole.Support,
          ctRole: PlayerRole.Support,
          
          // Default values for fields not available in database
          isIGL: false,
          isMainAWPer: false,
          
          // Calculated metrics
          piv: piv,
          tPIV: piv * 0.95,
          ctPIV: piv * 1.05,
          kd: kd,
          rating: piv * kd,
          
          // Stats from database
          metrics: {
            kills: kills,
            deaths: deaths,
            assists: assists,
            flashAssists: flashAssists,
            headshotPercentage: kills > 0 ? 
              ((parseInt(player.headshots || '0') / kills) * 100).toFixed(1) : '0.0',
            kd: kd,
            adr: 0, // Not available in our data
            clutches: 0 // Not available in our data
          },
          
          // Utility stats from database
          utilityStats: {
            flashesThrown: flashesThrown,
            smokeGrenades: parseInt(player.smokes_thrown || '0'),
            heGrenades: parseInt(player.he_thrown || '0'),
            molotovs: parseInt(player.infernos_thrown || '0'),
            totalUtility: parseInt(player.total_utility_thrown || '0')
          },
          
          primaryMetric: {
            value: piv,
            label: 'PIV',
            description: 'Player Impact Value'
          },
          
          // Default values for fields not available in database
          icf: { value: 0.7, sigma: 0.3 },
          sc: { value: 0.7, metric: "Team Contribution" },
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
          
          // Store raw stats
          rawStats: player
        };
      });
    } catch (error) {
      console.error('Error getting players with PIV:', error);
      return [];
    }
  }

  /**
   * Get team data with TIR values directly from teams table 
   * and associate with players
   * This returns all teams regardless of event as we're amalgamating data
   */
  async getTeamsWithTIR(): Promise<TeamWithTIR[]> {
    try {
      // Get all players first
      const players = await this.getPlayersWithPIV();
      
      // Group players by team
      const playersByTeam = new Map<string, PlayerWithPIV[]>();
      for (const player of players) {
        if (!player.team) continue;
        
        if (!playersByTeam.has(player.team)) {
          playersByTeam.set(player.team, []);
        }
        playersByTeam.get(player.team)?.push(player);
      }
      
      // Get all teams from teams table
      const teamsQuery = `SELECT * FROM teams`;
      const teamsResult = await this.pool.query(teamsQuery);
      console.log(`Found ${teamsResult.rows.length} teams in database`);
      
      // Process all teams and merge with player data
      const teams: TeamWithTIR[] = [];
      
      for (const teamRow of teamsResult.rows) {
        const teamName = teamRow.name;
        const teamPlayers = playersByTeam.get(teamName) || [];
        
        // Sort players by PIV
        const sortedPlayers = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
        
        // Calculate team metrics
        const totalPIV = teamPlayers.reduce((sum, p) => sum + (p.piv || 0), 0);
        const avgPIV = teamPlayers.length > 0 ? totalPIV / teamPlayers.length : 1.0;
        
        // Calculate synergy based on team composition
        let synergy = 0.85;
        if (teamPlayers.length >= 2) {
          const pivValues = teamPlayers.map(p => p.piv || 0);
          const pivMean = pivValues.reduce((sum, val) => sum + val, 0) / pivValues.length;
          const pivVariance = pivValues.reduce((sum, val) => sum + Math.pow(val - pivMean, 2), 0) / pivValues.length;
          const pivStdDev = Math.sqrt(pivVariance);
          
          // Higher stdev = lower synergy, lower stdev = higher synergy
          synergy = 0.85 * (1 - (pivStdDev / 2)); 
          synergy = Math.max(0.7, Math.min(0.95, synergy));
        }
        
        // Calculate TIR
        // TIR can come from database if available, otherwise calculate
        const tir = teamRow.tir || (avgPIV * synergy * Math.min(1.15, 0.9 + (teamPlayers.length * 0.05)));
        
        // Count roles
        const roleCount = {
          [PlayerRole.Support]: 0,
          [PlayerRole.AWP]: 0,
          [PlayerRole.Lurker]: 0, 
          [PlayerRole.IGL]: 0,
          [PlayerRole.Spacetaker]: 0,
          [PlayerRole.Anchor]: 0,
          [PlayerRole.Rotator]: 0
        };
        
        // Count roles from team players
        for (const player of teamPlayers) {
          if (player.role) {
            roleCount[player.role]++;
          }
          if (player.isIGL) {
            roleCount[PlayerRole.IGL]++;
          }
        }
        
        // Generate strengths and weaknesses
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
        if (roleCount[PlayerRole.AWP] >= 1) {
          strengths.push("Strong AWP presence");
        } else {
          weaknesses.push("Lack of dedicated AWPer");
        }
        
        // Check IGL
        if (roleCount[PlayerRole.IGL] >= 1) {
          strengths.push("Strong leadership");
        } else {
          weaknesses.push("Needs dedicated IGL");
        }
        
        // Ensure we have at least one strength and weakness
        if (strengths.length === 0) {
          strengths.push("Developing team chemistry");
        }
        if (weaknesses.length === 0) {
          weaknesses.push("Needs more experience");
        }
        
        // Get top player
        const topPlayer = sortedPlayers.length > 0 ? {
          id: sortedPlayers[0].id,
          name: sortedPlayers[0].name,
          piv: sortedPlayers[0].piv
        } : {
          id: teamRow.top_player_name ? `player_${teamRow.top_player_name.replace(/\s+/g, '_').toLowerCase()}` : 'unknown',
          name: teamRow.top_player_name || 'Unknown',
          piv: teamRow.top_player_piv || 1.0
        };
        
        // Create team object
        teams.push({
          id: `team_${teamName.replace(/\s+/g, '_').toLowerCase()}`,
          name: teamName,
          logo: '', // No logo available
          tir: tir,
          sumPIV: teamRow.sum_piv || totalPIV,
          synergy: teamRow.synergy || synergy,
          avgPIV: teamRow.avg_piv || avgPIV,
          topPlayer: topPlayer,
          players: teamPlayers,
          topPlayers: sortedPlayers.slice(0, 5),
          wins: 0, // Not available
          losses: 0, // Not available
          roleDistribution: roleCount,
          strengths: strengths.slice(0, 3),
          weaknesses: weaknesses.slice(0, 3)
        });
      }
      
      return teams;
    } catch (error) {
      console.error('Error getting teams with TIR:', error);
      return [];
    }
  }
}

export const cleanSupabaseAdapter = new CleanSupabaseAdapter();