import { db } from './supabase-db';
import { PlayerRawStats, PlayerWithPIV, PlayerRole, TeamWithTIR } from '../shared/schema';
import { mapPlayerRole, isPlayerIGL } from './player-data-utils';

/**
 * Direct adapter for Supabase database
 * Uses the simplified structure found in the actual database
 */
export class DirectSupabaseAdapter {
  /**
   * Get player data with PIV values directly from Supabase
   */
  async getPlayersWithPIV(eventId: number = 1): Promise<PlayerWithPIV[]> {
    try {
      // Fetch player data from player_stats table
      const query = `
        SELECT * FROM player_stats
      `;
      
      const result = await db.execute(query);
      const playerData = result.rows as any[];
      
      console.log(`Found ${playerData.length} players in Supabase`);
      
      if (playerData.length === 0) {
        return [];
      }
      
      // Transform the data to PlayerWithPIV format
      const playersWithPIV: PlayerWithPIV[] = playerData.map(player => {
        // Map the role string to our PlayerRole enum
        const role = mapPlayerRole(player.role);
        const isIglFlag = isPlayerIGL(player.role, player.is_igl);
        
        // Create PlayerWithPIV object
        return {
          id: player.steam_id,
          name: player.user_name,
          teamName: player.team_clan_name,
          team_id: 0,
          role: role,
          isIGL: isIglFlag,
          piv: player.piv || 1.0,
          kd: player.kd || (player.kills / Math.max(1, player.deaths)),
          rating: player.rating || 1.0,
          // Additional calculated fields
          metrics: {
            kills: player.kills || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            adr: player.adr || 0,
            kast: player.kast || 0,
            opening_success: player.first_kills_success || 0,
            headshots: player.headshots || 0,
            clutches: player.clutches_won || 0,
          }
        };
      });
      
      return playersWithPIV;
    } catch (error) {
      console.error('Error getting players with PIV:', error);
      return [];
    }
  }
  
  /**
   * Get team data with TIR values directly from Supabase
   */
  async getTeamsWithTIR(eventId: number = 1): Promise<TeamWithTIR[]> {
    try {
      // Fetch team data from teams table
      const query = `
        SELECT * FROM teams
      `;
      
      const result = await db.execute(query);
      const teamData = result.rows as any[];
      
      console.log(`Found ${teamData.length} teams in Supabase`);
      
      if (teamData.length === 0) {
        return [];
      }
      
      // Get all players to associate with teams
      const playersWithPIV = await this.getPlayersWithPIV(eventId);
      
      // Group players by team
      const playersByTeam = new Map<string, PlayerWithPIV[]>();
      for (const player of playersWithPIV) {
        const teamName = player.teamName || '';
        if (!playersByTeam.has(teamName)) {
          playersByTeam.set(teamName, []);
        }
        playersByTeam.get(teamName)!.push(player);
      }
      
      // Transform to TeamWithTIR format
      const teamsWithTIR: TeamWithTIR[] = teamData.map(team => {
        const teamName = team.name;
        const teamPlayers = playersByTeam.get(teamName) || [];
        
        // Count roles for distribution
        const roleCount = {
          [PlayerRole.Support]: 0,
          [PlayerRole.AWP]: 0,
          [PlayerRole.Lurker]: 0,
          [PlayerRole.IGL]: 0,
          [PlayerRole.Entry]: 0
        };
        
        for (const player of teamPlayers) {
          if (player.role) {
            roleCount[player.role]++;
          }
          if (player.isIGL) {
            roleCount[PlayerRole.IGL]++;
          }
        }
        
        // Create TeamWithTIR object
        return {
          id: `${teamName}_${eventId}`,
          name: teamName,
          logo: '',
          players: teamPlayers.map(p => p.id),
          tir: team.tir || 1.0,
          averagePIV: team.avg_piv || 0,
          wins: team.wins || 0,
          losses: team.losses || 0,
          eventId: eventId,
          roleDistribution: roleCount,
          strengths: team.strengths ? team.strengths.split(',') : ["Balanced roster"],
          weaknesses: team.weaknesses ? team.weaknesses.split(',') : ["Needs more experience"]
        };
      });
      
      return teamsWithTIR;
    } catch (error) {
      console.error('Error getting teams with TIR:', error);
      return [];
    }
  }
  
  /**
   * Get all available events (simulated for now)
   */
  async getEvents(): Promise<{ id: number, name: string }[]> {
    return [{ id: 1, name: 'IEM_Katowice_2025' }];
  }
  
  /**
   * Check database connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      const result = await db.execute('SELECT 1 as test');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }
}