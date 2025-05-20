import { db } from './supabase-db';
import { PlayerRawStats, PlayerRole } from '../shared/schema';
import { mapDatabaseRole, isIGLFromDatabase, normalizeTeamName, createSafePlayerObject } from './role-processing-fix';

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
 * Uses the simplified table structure from Supabase
 */
export class SupabaseAdapter {
  
  /**
   * Get all available event IDs
   * Since there's no events table, we'll use a simulated event
   */
  async getEventIds(): Promise<number[]> {
    try {
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
        try {
          // Calculate rounds
          const totalRounds = player.total_rounds_won ? player.total_rounds_won * 2 : 30; // Estimate total rounds
          const ctRounds = player.ct_rounds_won || Math.floor(totalRounds / 2);
          const tRounds = player.t_rounds_won || (totalRounds - ctRounds);
          
          // Check if player is IGL
          const isIGL = isIGLFromDatabase(player.role, player.is_igl);
          
          // Create safe player object with all required fields
          const rawStats = createSafePlayerObject(player);
          
          // Add it to our collection
          playerStats.push(rawStats);
        } catch (error) {
          console.error(`Error processing player ${player.user_name || player.steam_id}:`, error);
          // Skip this player but continue with others
          continue;
        }
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
   * @param eventId Event ID to fetch team statistics for
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
        name: normalizeTeamName(team.name),
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
}