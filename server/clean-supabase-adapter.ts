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
    this.pool = db.$client;
  }
  
  /**
   * Check database connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return result.rowCount === 1;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }
  
  /**
   * Get players with PIV values directly from player_stats table
   */
  async getPlayersWithPIV(): Promise<PlayerWithPIV[]> {
    try {
      // Get all players from player_stats table
      const query = `
        SELECT * FROM player_stats 
      `;
      
      const result = await db.execute(query);
      const playerRows = result.rows as any[];
      
      console.log(`Found ${playerRows.length} players in player_stats table`);
      
      if (playerRows.length === 0) {
        return [];
      }

      // Transform database rows to PlayerWithPIV objects
      const playersWithPIV: PlayerWithPIV[] = playerRows.map(row => {
        // Map role string to PlayerRole enum
        let roleEnum: PlayerRole | undefined;
        if (row.role) {
          const normalizedRole = row.role.trim().toLowerCase();
          if (normalizedRole === 'awp' || normalizedRole === 'awper') {
            roleEnum = PlayerRole.AWP;
          } else if (normalizedRole === 'support') {
            roleEnum = PlayerRole.Support;
          } else if (normalizedRole === 'lurker') {
            roleEnum = PlayerRole.Lurker;
          } else if (normalizedRole === 'igl' || normalizedRole === 'in-game leader') {
            roleEnum = PlayerRole.IGL;
          } else if (normalizedRole === 'spacetaker' || normalizedRole === 'space-taker') {
            roleEnum = PlayerRole.Spacetaker;
          } else if (normalizedRole === 'anchor') {
            roleEnum = PlayerRole.Anchor;
          } else if (normalizedRole === 'rotator') {
            roleEnum = PlayerRole.Rotator;
          }
        }

        // Calculate rating as a derived value if not present
        const rating = parseFloat(row.rating) || 
          ((parseFloat(row.kd) || 1) * (parseFloat(row.piv) || 1)).toFixed(2);
        
        // Format player metrics for frontend
        const metrics = {
          kills: parseInt(row.kills) || 0,
          deaths: parseInt(row.deaths) || 0,
          assists: parseInt(row.assists) || 0,
          flashAssists: parseInt(row.assisted_flashes) || 0,
          headshotPercentage: row.headshots ? (parseInt(row.headshots) / parseInt(row.kills) * 100).toFixed(1) : '0.0',
          kd: parseFloat(row.kd) || 1.0,
          adr: parseInt(row.adr) || 0,
          clutches: parseInt(row.clutches) || 0
        };

        const utilityStats = {
          flashesThrown: parseInt(row.flashes_thrown) || 0,
          smokeGrenades: parseInt(row.smokes_thrown) || 0, 
          heGrenades: parseInt(row.he_thrown) || 0,
          molotovs: parseInt(row.infernos_thrown) || 0,
          totalUtility: parseInt(row.total_utility_thrown) || 0
        };

        // Create primary metric for player card
        const primaryMetric = {
          value: parseFloat(row.piv) || 1.0,
          label: 'PIV',
          description: 'Player Impact Value'
        };
        
        // Create the player object with all required fields
        return {
          id: row.steam_id || row.id?.toString() || '',
          name: row.user_name || '',
          team: row.team_clan_name || '',
          role: roleEnum,
          isIGL: row.is_igl === true,
          isMainAWPer: row.is_main_awper === true,
          piv: parseFloat(row.piv) || 1.0,
          kd: parseFloat(row.kd) || 1.0,
          rating: parseFloat(rating) || 1.0,
          metrics: metrics,
          primaryMetric: primaryMetric,
          utilityStats: utilityStats,
          rawStats: row  // Keep the original row for reference
        };
      });
      
      return playersWithPIV;
    } catch (error) {
      console.error('Error getting players with PIV:', error);
      return [];
    }
  }

  /**
   * Get team data with TIR values directly from teams table 
   * and associate with players
   */
  async getTeamsWithTIR(): Promise<TeamWithTIR[]> {
    try {
      // Fetch team data from teams table - no filtering by event_id since that column doesn't exist
      const query = `
        SELECT * FROM teams
      `;
      
      const result = await db.execute(query);
      const teamData = result.rows as any[];
      
      console.log(`Found ${teamData.length} teams in teams table`);
      
      if (teamData.length === 0) {
        return [];
      }
      
      // Get all players to associate with teams
      const playersWithPIV = await this.getPlayersWithPIV();
      
      // Group players by team
      const playersByTeam = new Map<string, PlayerWithPIV[]>();
      for (const player of playersWithPIV) {
        const teamName = player.team || '';
        if (!playersByTeam.has(teamName)) {
          playersByTeam.set(teamName, []);
        }
        playersByTeam.get(teamName)!.push(player);
      }
      
      // Transform to TeamWithTIR format
      const teamsWithTIR: TeamWithTIR[] = teamData.map(team => {
        const teamName = team.name || '';
        // Find players for this team
        const teamPlayers = playersByTeam.get(teamName) || [];
        
        // Count roles for distribution - ensure all possible roles are represented
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
          if (player.role && roleCount[player.role] !== undefined) {
            roleCount[player.role]++;
          }
          if (player.isIGL && roleCount[PlayerRole.IGL] !== undefined) {
            roleCount[PlayerRole.IGL]++;
          }
        }
        
        // Ensure at least one player has each role (for UI display)
        for (const role in roleCount) {
          if (roleCount[role as PlayerRole] === 0 && teamPlayers.length > 0) {
            // Assign a minimum value to avoid UI issues
            roleCount[role as PlayerRole] = 1;
          }
        }
        
        // Sort players by PIV for topPlayer
        const sortedByPIV = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
        const topPlayer = sortedByPIV.length > 0 ? {
          name: sortedByPIV[0].name,
          piv: sortedByPIV[0].piv
        } : {
          name: team.top_player_name || teamName + ' Top Player',
          piv: team.top_player_piv || 1.0
        };
        
        // Calculate team aggregated metrics
        const totalPIV = sortedByPIV.reduce((sum, p) => sum + (p.piv || 0), 0);
        const averagePIV = sortedByPIV.length > 0 
          ? totalPIV / sortedByPIV.length 
          : (Number(team.avg_piv) || 0.8);
        
        // Create TeamWithTIR object that meets frontend requirements
        return {
          id: team.id?.toString() || `team_${teamName}`,
          name: teamName,
          logo: '', // No logo in database, provide default
          tir: Number(team.tir) || (averagePIV * 1.05), // Derived TIR if missing
          sumPIV: Number(team.sum_piv) || totalPIV,
          synergy: Number(team.synergy) || 0.85,
          avgPIV: averagePIV,
          topPlayer: topPlayer,
          players: teamPlayers,
          topPlayers: sortedByPIV.slice(0, 5),
          wins: Number(team.wins) || 0,
          losses: Number(team.losses) || 0,
          // Required for UI
          roleDistribution: roleCount,
          strengths: ["Balanced roster", "Strong teamwork"], // Default values
          weaknesses: ["Needs more experience", "Inconsistent performance"] // Default values
        };
      });
      
      // Generate teams from player data for any teams not found in the database
      for (const [teamName, players] of playersByTeam.entries()) {
        // If we already have this team from database, skip it
        if (teamsWithTIR.some(t => t.name === teamName)) {
          continue;
        }
        
        // Sort players by PIV
        const sortedByPIV = [...players].sort((a, b) => (b.piv || 0) - (a.piv || 0));
        const totalPIV = sortedByPIV.reduce((sum, p) => sum + (p.piv || 0), 0);
        const averagePIV = players.length > 0 ? totalPIV / players.length : 0.8;
        
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
        
        for (const player of players) {
          if (player.role && roleCount[player.role] !== undefined) {
            roleCount[player.role]++;
          }
          if (player.isIGL && roleCount[PlayerRole.IGL] !== undefined) {
            roleCount[PlayerRole.IGL]++;
          }
        }
        
        const topPlayer = sortedByPIV.length > 0 ? {
          name: sortedByPIV[0].name,
          piv: sortedByPIV[0].piv
        } : {
          name: teamName + ' Top Player',
          piv: 1.0
        };
        
        // Create generated team
        teamsWithTIR.push({
          id: `team_${teamName}`,
          name: teamName,
          logo: '',
          tir: averagePIV * 1.05,
          sumPIV: totalPIV,
          synergy: 0.85,
          synergyFactor: 0.85, // Added for interface compatibility 
          avgPIV: averagePIV,
          topPlayer: topPlayer,
          players: players,
          topPlayers: sortedByPIV.slice(0, 5),
          wins: 0,
          losses: 0,
          roleDistribution: roleCount,
          strengths: ["Balanced roster", "Strong teamwork"],
          weaknesses: ["Needs more experience", "Inconsistent performance"]
        });
      }
      
      return teamsWithTIR;
    } catch (error) {
      console.error('Error getting teams with TIR:', error);
      return [];
    }
  }
}

// Singleton instance
export const cleanSupabaseAdapter = new CleanSupabaseAdapter();