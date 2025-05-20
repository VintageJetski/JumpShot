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
          id: player.steam_id || `player_${Math.random().toString(36).substring(2, 10)}`,
          name: player.user_name || 'Unknown Player',
          team: player.team_clan_name || 'No Team',
          teamId: 0,
          role: role,
          tRole: role, // Consistent with the schema
          ctRole: role, // Consistent with the schema
          isIGL: isIglFlag,
          piv: Number(player.piv) || 1.0,
          kd: Number(player.kd) || (Number(player.kills || 0) / Math.max(1, Number(player.deaths || 1))),
          rating: Number(player.rating || player.piv) || 1.0,
          // Required metrics
          metrics: {
            kills: Number(player.kills) || 0,
            deaths: Number(player.deaths) || 0,
            assists: Number(player.assists) || 0,
            adr: Number(player.adr) || 0,
            kast: Number(player.kast) || 0,
            opening_success: Number(player.first_kills) || 0,
            headshots: Number(player.headshots) || 0,
            clutches: Number(player.clutches_won) || 0,
          },
          // Primary metric required by the UI
          primaryMetric: {
            name: 'PIV',
            value: Number(player.piv) || 1.0
          },
          // Required by the UI
          rawStats: {
            steamId: player.steam_id || '',
            kills: Number(player.kills) || 0,
            deaths: Number(player.deaths) || 0,
            assists: Number(player.assists) || 0,
            kd: Number(player.kd) || 1.0,
            rating: Number(player.piv) || 1.0
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
        
        // Sort players by PIV for topPlayer
        const sortedByPIV = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
        const topPlayer = sortedByPIV.length > 0 ? {
          name: sortedByPIV[0].name,
          piv: sortedByPIV[0].piv
        } : {
          name: team.top_player_name || teamName + ' Top Player',
          piv: team.top_player_piv || 1.0
        };
        
        // Create TeamWithTIR object that meets frontend requirements
        return {
          id: team.id?.toString() || `${teamName}_${eventId}`,
          name: teamName,
          logo: team.logo || '',
          tir: Number(team.tir) || 1.0,
          sumPIV: Number(team.sum_piv) || sortedByPIV.reduce((sum, p) => sum + (p.piv || 0), 0),
          synergy: Number(team.synergy) || 1.0,
          avgPIV: Number(team.avg_piv) || (sortedByPIV.length ? sortedByPIV.reduce((sum, p) => sum + (p.piv || 0), 0) / sortedByPIV.length : 0),
          topPlayer: topPlayer, // Using the safe topPlayer object with required properties
          players: teamPlayers,
          topPlayers: sortedByPIV.slice(0, 5),
          wins: Number(team.wins) || 0,
          losses: Number(team.losses) || 0,
          eventId: eventId
        };
      });
      
      return teamsWithTIR;
    } catch (error) {
      console.error('Error getting teams with TIR:', error);
      return [];
    }
  }
  
  /**
   * Get all available events from the database
   */
  async getEvents(): Promise<{ id: number, name: string }[]> {
    try {
      // Try to find event_id in player_stats table
      const query = `
        SELECT DISTINCT 
          COALESCE(event_id, 1) as id,
          CASE 
            WHEN event_id = 1 THEN 'IEM Katowice 2025'
            WHEN event_id = 2 THEN 'ESL Pro League S19'
            ELSE 'Tournament ' || COALESCE(event_id, 1)::text
          END as name
        FROM player_stats
        ORDER BY id
      `;
      
      const result = await db.execute(query);
      
      if (result.rows && result.rows.length > 0) {
        console.log(`Found ${result.rows.length} events in database`);
        return result.rows.map(row => ({
          id: Number(row.id),
          name: row.name
        }));
      }
      
      // Fallback to at least two events
      return [
        { id: 1, name: 'IEM Katowice 2025' },
        { id: 2, name: 'ESL Pro League S19' }
      ];
    } catch (error) {
      console.error('Error getting events:', error);
      // Fallback to at least two events
      return [
        { id: 1, name: 'IEM Katowice 2025' },
        { id: 2, name: 'ESL Pro League S19' }
      ];
    }
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