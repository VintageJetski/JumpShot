import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { PlayerRole, PlayerWithPIV, TeamWithTIR } from '../shared/schema';

// Configure WebSocket for Neon/Supabase
neonConfig.webSocketConstructor = ws;

// Create database pool with the provided connection string
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create database instance
export const db = drizzle({ client: pool });

/**
 * Role mapping from database strings to enum values
 */
const roleMapping: Record<string, PlayerRole> = {
  'IGL': PlayerRole.IGL,
  'AWP': PlayerRole.AWP,
  'LURKER': PlayerRole.Lurker,
  'SUPPORT': PlayerRole.Support,
  'SPACETAKER': PlayerRole.Entry,
  'ANCHOR': PlayerRole.Support,
  'ROTATOR': PlayerRole.Entry
};

/**
 * Check if the database connection is available
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await db.execute('SELECT 1 as test');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

/**
 * Get all available events from Supabase
 */
export async function getEvents(): Promise<{ id: number, name: string }[]> {
  try {
    console.log('Getting events from Supabase...');
    
    const query = `
      SELECT DISTINCT event_id, event_name 
      FROM player_stats
      ORDER BY event_id
    `;
    
    const result = await db.execute(query);
    
    if (!result.rows.length) {
      return [{ id: 1, name: 'IEM Katowice 2025' }];
    }
    
    return result.rows.map(row => ({
      id: row.event_id || 1,
      name: row.event_name || `Event ${row.event_id}`
    }));
  } catch (error) {
    console.error('Error getting events:', error);
    return [{ id: 1, name: 'IEM Katowice 2025' }];
  }
}

/**
 * Get player data with PIV values from Supabase
 */
export async function getPlayersWithPIV(eventId: number = 1): Promise<PlayerWithPIV[]> {
  try {
    console.log(`Getting players with PIV for event ${eventId}...`);
    
    // Get player data from player_stats table
    const query = `
      SELECT 
        ps.*,
        t.name as team_name,
        ps.role as role_string
      FROM player_stats ps
      LEFT JOIN teams t ON ps.team_id = t.id
      WHERE ps.event_id = $1
    `;
    
    const result = await db.execute(query, [eventId]);
    
    console.log(`Found ${result.rows.length} players in database for event ${eventId}`);
    
    // Process player data
    const players = result.rows.map(player => {
      // Determine player role from database or csv role data
      const roleStr = player.role_string?.toUpperCase() || '';
      let playerRole = PlayerRole.Support; // Default role
      let tRole = 'Support';
      let ctRole = 'Anchor';
      let isIGL = !!player.is_igl;
      
      if (roleStr.includes('IGL')) {
        playerRole = PlayerRole.IGL;
        isIGL = true;
      } else if (roleStr.includes('AWP')) {
        playerRole = PlayerRole.AWP;
        tRole = 'AWP';
        ctRole = 'AWP';
      } else if (roleStr.includes('LURK')) {
        playerRole = PlayerRole.Lurker;
        tRole = 'Lurker';
        ctRole = 'Rotator';
      } else if (roleStr.includes('SPACE')) {
        playerRole = PlayerRole.Entry;
        tRole = 'Spacetaker';
        ctRole = 'Rotator';
      }
      
      // Calculate KD ratio safely
      const kills = player.kills || 0;
      const deaths = Math.max(1, player.deaths || 1); // Avoid division by zero
      const kd = kills / deaths;
      
      return {
        id: player.steam_id?.toString() || '',
        name: player.user_name || 'Unknown Player',
        team: player.team_clan_name || player.team_name || 'No Team',
        teamId: player.team_id || 0,
        role: playerRole,
        tRole,
        ctRole,
        isIGL,
        // Use stored PIV if available, otherwise fallback to rating
        piv: player.piv || player.rating || 1.0,
        kd: player.kd || kd || 1.0,
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
        eventId
      };
    });
    
    return players;
  } catch (error) {
    console.error('Error getting players with PIV:', error);
    throw error;
  }
}

/**
 * Get team data with TIR values from Supabase
 */
export async function getTeamsWithTIR(eventId: number = 1): Promise<TeamWithTIR[]> {
  try {
    console.log(`Getting teams with TIR for event ${eventId}...`);
    
    // First, get all players for this event
    const allPlayers = await getPlayersWithPIV(eventId);
    
    // Get team data from teams table
    const query = `
      SELECT * FROM teams
      WHERE event_id = $1
    `;
    
    const result = await db.execute(query, [eventId]);
    
    // If no teams found in database, generate from player data
    if (!result.rows.length) {
      console.log('No teams found in database, generating from player data...');
      return generateTeamsFromPlayers(allPlayers);
    }
    
    console.log(`Found ${result.rows.length} teams in database for event ${eventId}`);
    
    // Process team data with players
    const teams = result.rows.map(team => {
      // Find all players in this team
      const teamPlayers = allPlayers.filter(p => 
        p.teamId === team.id || 
        p.team.toLowerCase() === team.name.toLowerCase()
      );
      
      // Sort by PIV
      const sortedPlayers = [...teamPlayers].sort((a, b) => b.piv - a.piv);
      
      return {
        id: team.id,
        name: team.name,
        logo: team.logo || '',
        tir: team.tir || 1.0,
        topPlayers: sortedPlayers.slice(0, 5),
        wins: team.wins || 0,
        losses: team.losses || 0,
        eventId
      };
    });
    
    return teams;
  } catch (error) {
    console.error('Error getting teams with TIR:', error);
    throw error;
  }
}

/**
 * Generate team data from player information when team data is not available
 */
function generateTeamsFromPlayers(players: PlayerWithPIV[]): TeamWithTIR[] {
  console.log('Generating teams from player data...');
  
  // Group players by team
  const teamMap = new Map<string, PlayerWithPIV[]>();
  
  players.forEach(player => {
    const teamName = player.team || 'Unknown Team';
    if (!teamMap.has(teamName)) {
      teamMap.set(teamName, []);
    }
    teamMap.get(teamName)?.push(player);
  });
  
  // Generate team objects
  const teams: TeamWithTIR[] = [];
  let teamId = 1;
  
  for (const [teamName, teamPlayers] of teamMap.entries()) {
    if (teamPlayers.length > 0) {
      // Sort players by PIV for top players
      const sortedPlayers = [...teamPlayers].sort((a, b) => b.piv - a.piv);
      
      // Calculate team TIR (average of player PIVs)
      const totalPIV = teamPlayers.reduce((sum, player) => sum + player.piv, 0);
      const averagePIV = teamPlayers.length > 0 ? totalPIV / teamPlayers.length : 1.0;
      
      teams.push({
        id: teamId++,
        name: teamName,
        logo: '',
        tir: averagePIV,
        topPlayers: sortedPlayers.slice(0, 5),
        wins: 0,
        losses: 0,
        eventId: teamPlayers[0]?.eventId || 1
      });
    }
  }
  
  // Sort teams by TIR
  return teams.sort((a, b) => b.tir - a.tir);
}