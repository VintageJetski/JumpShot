import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { PlayerRole } from '../shared/schema';

// Configure the WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Create database pool - using the provided Supabase URI
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

// Create database instance
export const db = drizzle({ client: pool });

/**
 * Player data with PIV values and role information
 */
export interface PlayerWithPIV {
  id: string;           // Steam ID
  name: string;         // Player name
  team: string;         // Team name
  teamId: number;       // Team ID
  role: PlayerRole;     // Player role (from enum)
  tRole: string;        // T side role as string
  ctRole: string;       // CT side role as string
  isIGL: boolean;       // Is in-game leader
  piv: number;          // Player Impact Value
  kd: number;           // K/D ratio
  rating: number;       // HLTV-like rating
  metrics: {
    kills: number;
    deaths: number;
    assists: number;
    adr: number;
    kast: number;
    opening_success: number;
    headshots: number;
    clutches: number;
  };
  eventId: number;      // Event ID
}

/**
 * Team data with TIR values
 */
export interface TeamWithTIR {
  id: number;           // Team ID
  name: string;         // Team name
  logo: string;         // Team logo URL
  tir: number;          // Team Impact Rating
  topPlayers: PlayerWithPIV[]; // Top players in team
  wins: number;         // Match wins
  losses: number;       // Match losses
  eventId: number;      // Event ID
}

/**
 * Fetch players with PIV values from Supabase
 */
export async function getPlayersWithPIV(eventId: number = 1): Promise<PlayerWithPIV[]> {
  try {
    console.log(`Fetching players with PIV for event ${eventId} from Supabase...`);
    
    // Use raw SQL to get player data with PIV values and role information
    const query = `
      SELECT 
        ps.steam_id,
        ps.user_name,
        ps.team_clan_name,
        ps.team_id,
        ps.piv,
        ps.rating,
        ps.kd,
        ps.role,
        ps.is_igl,
        ps.kills,
        ps.deaths,
        ps.assists,
        ps.adr,
        ps.kast,
        ps.opening_success,
        ps.headshots,
        ps.clutches_won,
        ps.event_id
      FROM player_stats ps
      WHERE ps.event_id = $1
      ORDER BY ps.piv DESC
    `;
    
    const result = await db.execute(query, [eventId]);
    
    if (!result.rows.length) {
      console.log(`No players found for event ${eventId}`);
      return [];
    }
    
    console.log(`Found ${result.rows.length} players for event ${eventId}`);
    
    // Map database results to PlayerWithPIV interface
    const players: PlayerWithPIV[] = result.rows.map((player: any) => {
      // Determine roles from database role field
      let role = PlayerRole.Support;
      let tRole = "Support";
      let ctRole = "Anchor";
      
      if (player.role) {
        if (player.role.toUpperCase().includes('IGL')) {
          role = PlayerRole.IGL;
        } else if (player.role.toUpperCase().includes('AWP')) {
          role = PlayerRole.AWP;
          tRole = "AWP";
          ctRole = "AWP";
        } else if (player.role.toUpperCase().includes('LURK')) {
          role = PlayerRole.Lurker;
          tRole = "Lurker";
          ctRole = "Rotator";
        } else if (player.role.toUpperCase().includes('SPACE')) {
          role = PlayerRole.Entry;
          tRole = "Spacetaker";
          ctRole = "Rotator";
        }
      }
      
      // Create PlayerWithPIV object
      return {
        id: player.steam_id.toString(),
        name: player.user_name,
        team: player.team_clan_name,
        teamId: player.team_id || 0,
        role: role,
        tRole: tRole,
        ctRole: ctRole,
        isIGL: player.is_igl || false,
        piv: player.piv || 1.0,
        kd: player.kd || 1.0,
        rating: player.rating || 1.0,
        metrics: {
          kills: player.kills || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          adr: player.adr || 0,
          kast: player.kast || 0,
          opening_success: player.opening_success || 0,
          headshots: player.headshots || 0,
          clutches: player.clutches_won || 0
        },
        eventId: player.event_id || eventId
      };
    });
    
    return players;
  } catch (error) {
    console.error(`Error fetching players from Supabase:`, error);
    throw error;
  }
}

/**
 * Fetch teams with TIR values from Supabase
 */
export async function getTeamsWithTIR(eventId: number = 1): Promise<TeamWithTIR[]> {
  try {
    console.log(`Fetching teams with TIR for event ${eventId} from Supabase...`);
    
    // Use raw SQL to get team data with TIR values
    const query = `
      SELECT 
        t.id,
        t.name,
        t.logo,
        t.tir,
        t.wins,
        t.losses,
        t.event_id
      FROM teams t
      WHERE t.event_id = $1
      ORDER BY t.tir DESC
    `;
    
    const result = await db.execute(query, [eventId]);
    
    if (!result.rows.length) {
      console.log(`No teams found for event ${eventId}`);
      return [];
    }
    
    console.log(`Found ${result.rows.length} teams for event ${eventId}`);
    
    // Get all players to associate with teams
    const allPlayers = await getPlayersWithPIV(eventId);
    
    // Map database results to TeamWithTIR interface
    const teams: TeamWithTIR[] = await Promise.all(result.rows.map(async (team: any) => {
      // Find top players for this team
      const teamPlayers = allPlayers.filter(p => 
        p.teamId === team.id || 
        p.team.toLowerCase() === team.name.toLowerCase()
      ).sort((a, b) => b.piv - a.piv);
      
      // Create TeamWithTIR object
      return {
        id: team.id,
        name: team.name,
        logo: team.logo || '',
        tir: team.tir || 1.0,
        topPlayers: teamPlayers.slice(0, 5), // Get top 5 players
        wins: team.wins || 0,
        losses: team.losses || 0,
        eventId: team.event_id || eventId
      };
    }));
    
    return teams;
  } catch (error) {
    console.error(`Error fetching teams from Supabase:`, error);
    throw error;
  }
}

/**
 * Get all available events
 */
export async function getEvents(): Promise<{ id: number, name: string }[]> {
  try {
    console.log('Fetching available events from Supabase...');
    
    // Use raw SQL to get unique event IDs and names
    const query = `
      SELECT DISTINCT event_id, event_name
      FROM player_stats
      ORDER BY event_id
    `;
    
    const result = await db.execute(query);
    
    // If no events found, return default
    if (!result.rows.length) {
      return [{ id: 1, name: 'IEM Katowice 2025' }];
    }
    
    // Map results to event objects
    return result.rows.map((event: any) => ({
      id: event.event_id,
      name: event.event_name || `Event ${event.event_id}`
    }));
  } catch (error) {
    console.error('Error fetching events from Supabase:', error);
    // Return default event if error
    return [{ id: 1, name: 'IEM Katowice 2025' }];
  }
}

/**
 * Test the Supabase database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await db.execute('SELECT 1 as test');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}