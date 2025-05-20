import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { PlayerRawStats, PlayerRole } from '../shared/schema';

// Configure the WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Create database pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

// Create database instance
export const db = drizzle({ client: pool });

/**
 * Test the database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await db.execute('SELECT 1 as test');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

/**
 * Fetch player data directly from Supabase
 */
export async function fetchPlayersFromSupabase(): Promise<PlayerRawStats[]> {
  try {
    console.log(`Getting player data from Supabase...`);
    
    // Query the player_stats table directly
    const query = `
      SELECT * FROM player_stats
    `;
    
    const result = await db.execute(query);
    const playerData = result.rows as any[];
    
    console.log(`Found ${playerData.length} players in player_stats table`);
    
    if (playerData.length === 0) {
      return [];
    }
    
    // Map to our PlayerRawStats structure
    const playerStats: PlayerRawStats[] = playerData.map(player => {
      // Process player role - use "Support" as default if no role is defined
      let role = PlayerRole.Support;
      let isIGL = false;
      
      if (player.role) {
        if (player.role.toUpperCase().includes('IGL')) {
          isIGL = true;
          role = PlayerRole.IGL;
        } else if (player.role.toUpperCase().includes('AWP')) {
          role = PlayerRole.AWP;
        } else if (player.role.toUpperCase().includes('LURK')) {
          role = PlayerRole.Lurker;
        }
      }
      
      // Also check explicit IGL flag
      if (player.is_igl) {
        isIGL = true;
      }
      
      return {
        steamId: player.steam_id || '',
        playerName: player.user_name || 'Unknown Player',
        teamName: player.team_clan_name || 'Unknown Team',
        // Stats
        kills: player.kills || 0,
        deaths: player.deaths || 0,
        assists: player.assists || 0,
        rating: player.piv || 1.0,
        impact: player.impact || 0,
        adr: player.adr || 0,
        kast: player.kast || 0,
        ct_rating: player.ct_rating || 1.0,
        t_rating: player.t_rating || 1.0,
        // Set role info
        role,
        isIGL,
        // Rounds
        total_rounds: player.total_rounds || 30,
        ct_rounds: player.ct_rounds || 15,
        t_rounds: player.t_rounds || 15,
        // Weapon stats
        awp_kills: player.awp_kills || 0,
        // Opening duels
        opening_kills: player.first_kills || 0,
        opening_deaths: player.first_deaths || 0,
        opening_attempts: (player.first_kills || 0) + (player.first_deaths || 0),
        opening_success: player.first_kills || 0,
        // Utility
        flash_assists: player.assisted_flashes || 0,
        utility_damage: player.utility_damage || 0,
        utility_damage_round: player.utility_damage_round || 0,
        // Percentages
        headshot_percent: player.headshots ? (player.headshots / Math.max(1, player.kills)) * 100 : 0,
        success_in_opening: player.first_kills ? player.first_kills / Math.max(1, player.first_kills + player.first_deaths) : 0,
        // Clutches
        clutches_attempted: player.clutches_attempted || 0,
        clutches_won: player.clutches_won || 0,
        // Per round stats
        kpr: player.kpr || (player.kills / Math.max(1, player.total_rounds || 30)),
        dpr: player.dpr || (player.deaths / Math.max(1, player.total_rounds || 30)),
        // Differentials
        k_diff: (player.kills || 0) - (player.deaths || 0),
        kd_diff: player.kd || (player.kills / Math.max(1, player.deaths)),
        // Round-based stats
        rounds_survived: (player.total_rounds || 30) - (player.deaths || 0),
        rounds_with_kills: player.rounds_with_kills || 0,
        rounds_with_assists: player.rounds_with_assists || 0,
        rounds_with_deaths: player.deaths || 0,
        damage: player.damage || 0,
        rounds_with_kast: player.rounds_with_kast || 0,
        // Event
        eventId: player.event_id || player.eventId || 1
      };
    });
    
    console.log(`Successfully processed ${playerStats.length} players from Supabase`);
    return playerStats;
  } catch (error) {
    console.error('Error fetching players from Supabase:', error);
    throw error;
  }
}

/**
 * Get team data from Supabase
 */
export async function fetchTeamsFromSupabase(): Promise<any[]> {
  try {
    console.log('Fetching team data from Supabase...');
    
    // Query teams table
    const query = `
      SELECT * FROM teams
    `;
    
    const result = await db.execute(query);
    const teamsData = result.rows;
    
    console.log(`Found ${teamsData.length} teams in Supabase`);
    return teamsData;
  } catch (error) {
    console.error('Error fetching teams from Supabase:', error);
    throw error;
  }
}