import { db } from './supabase-db';
import { PlayerRawStats, PlayerRole } from '../shared/schema';

// Define TeamRawStats interface to match existing schema in the application
export interface TeamRawStats {
  name: string;
  players: number;
  logo: string;
  wins: number;
  losses: number;
  eventId: number;
}

/**
 * Adapter to transform database models into application models
 */
export class SupabaseAdapter {
  
  /**
   * Get all available event IDs
   * Since there's no events table, we'll simulate events for now
   */
  async getEventIds(): Promise<number[]> {
    try {
      // Simulate event IDs since there's no events table
      return [1]; // Just return event ID 1 for now
    } catch (error) {
      console.error('Error getting event IDs:', error);
      return [];
    }
  }

  /**
   * Get all players for a specific event
   * @param eventId Event ID to fetch players for (ignored since we don't have events table)
   */
  async getPlayersForEvent(eventId: number = 1): Promise<PlayerRawStats[]> {
    try {
      console.log(`Getting players from player_stats table...`);
      
      // Query the player_stats table directly
      const query = `
        SELECT * FROM player_stats
      `;
      
      const playerResult = await db.execute(query);
      const playerData = playerResult.rows as any[];
      
      console.log(`Found ${playerData.length} players in player_stats table`);
      
      if (playerData.length === 0) {
        return [];
      }
      
      // Process each player to create PlayerRawStats objects
      const playerStats: PlayerRawStats[] = [];
      
      for (const player of playerData) {
        // Calculate rounds
        const totalRounds = player.total_rounds_won * 2 || 30; // Estimate total rounds based on rounds won
        const ctRounds = player.ct_rounds_won || Math.floor(totalRounds / 2);
        const tRounds = player.t_rounds_won || (totalRounds - ctRounds);
        
        // Determine role from the role and secondary_role fields
        let primaryRole = this.mapRoleString(player.role);
        let secondaryRole = this.mapRoleString(player.secondary_role);
        
        // Create player raw stats object
        const playerRawStats: PlayerRawStats = {
          steamId: player.steam_id,
          playerName: player.user_name,
          team_id: 0, // We'll get this from team lookup
          teamName: player.team_clan_name || '',
          
          // Stats derived from player_stats
          kills: player.kills || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          
          // Estimated values for stats not directly available
          adr: 0, // Not directly available
          kast: 0, // Not directly available
          rating: 1.0, // Not directly available
          impact: 0, // Not directly available
          ct_rating: 1.0, // Not directly available
          t_rating: 1.0, // Not directly available
          
          // Rounds data
          total_rounds: totalRounds,
          ct_rounds: ctRounds,
          t_rounds: tRounds,
          
          // Special kill types
          awp_kills: 0, // Not directly available
          opening_kills: player.first_kills || 0,
          opening_deaths: player.first_deaths || 0,
          opening_attempts: (player.first_kills || 0) + (player.first_deaths || 0),
          opening_success: player.first_kills || 0,
          
          // Utility stats
          flash_assists: player.assisted_flashes || 0,
          utility_damage: 0, // Not directly available
          utility_damage_round: 0, // Not directly available
          
          // Headshot and opening stats
          headshot_percent: player.headshots ? (player.headshots / Math.max(1, player.kills)) * 100 : 0,
          success_in_opening: (player.first_kills || 0) > 0 
            ? (player.first_kills || 0) / Math.max(1, (player.first_kills || 0) + (player.first_deaths || 0)) 
            : 0,
          
          // Clutch stats
          clutches_attempted: 0, // Not directly available
          clutches_won: 0, // Not directly available
          
          // Per round stats
          kpr: player.kills ? player.kills / totalRounds : 0,
          dpr: player.deaths ? player.deaths / totalRounds : 0,
          
          // K/D differential
          k_diff: (player.kills || 0) - (player.deaths || 0),
          kd_diff: player.kd || ((player.kills || 0) / Math.max(1, (player.deaths || 1))),
          
          // Round-specific stats
          rounds_survived: totalRounds - (player.deaths || 0),
          rounds_with_kills: 0, // Not directly available
          rounds_with_assists: 0, // Not directly available
          rounds_with_deaths: player.deaths || 0,
          damage: 0, // Not directly available
          rounds_with_kast: 0, // Not directly available
          
          // Event info
          eventId: eventId
        };
        
        playerStats.push(playerRawStats);
      }
      
      console.log(`Successfully processed ${playerStats.length} players`);
      return playerStats;
    } catch (error) {
      console.error(`Error getting players:`, error);
      return [];
    }
  }
  
  /**
   * Get team statistics for a specific event
   * @param eventId Event ID to fetch team statistics for (ignored since we don't have events table)
   */
  async getTeamsForEvent(eventId: number = 1): Promise<TeamRawStats[]> {
    try {
      console.log(`Getting teams from teams table...`);
      
      // Query the teams table directly
      const query = `
        SELECT * FROM teams
      `;
      
      const result = await db.execute(query);
      const teamsData = result.rows as { 
        id: number, 
        name: string,
        tir: number,
        sum_piv: number,
        synergy: number,
        avg_piv: number,
        top_player_name: string,
        top_player_piv: number
      }[];
      
      console.log(`Found ${teamsData.length} teams in teams table`);
      
      if (!teamsData || teamsData.length === 0) {
        return [];
      }
      
      // Now get player counts for each team
      const playerQuery = `
        SELECT team_clan_name, COUNT(*) as player_count
        FROM player_stats
        GROUP BY team_clan_name
      `;
      
      const playerResult = await db.execute(playerQuery);
      const playerCounts = playerResult.rows as { 
        team_clan_name: string, 
        player_count: string 
      }[];
      
      // Create a map of team name to player count
      const teamCountMap = new Map<string, number>();
      for (const count of playerCounts) {
        teamCountMap.set(count.team_clan_name, parseInt(count.player_count, 10));
      }
      
      // Create team stats objects
      const teamStats: TeamRawStats[] = teamsData.map(team => ({
        name: team.name,
        players: teamCountMap.get(team.name) || 5, // Default to 5 if count not found
        logo: '', // Not available in the database
        wins: Math.round((team.tir || 1) * 3), // Estimate wins from TIR
        losses: Math.round((1 - (team.tir || 1) / 10) * 3), // Estimate losses inversely related to TIR
        eventId
      }));
      
      return teamStats;
    } catch (error) {
      console.error(`Error getting teams:`, error);
      return [];
    }
  }
  
  /**
   * Maps role string from database to PlayerRole enum
   */
  private mapRoleString(roleStr: string | null): PlayerRole {
    if (!roleStr) return PlayerRole.Support;
    
    const roleMap: Record<string, PlayerRole> = {
      'IGL': PlayerRole.IGL,
      'AWP': PlayerRole.AWP,
      'RIFLER': PlayerRole.Support,
      'ENTRY': PlayerRole.Entry,
      'LURK': PlayerRole.Lurker,
      'SUPPORT': PlayerRole.Support
    };
    
    return roleMap[roleStr.toUpperCase()] || PlayerRole.Support;
  }
}