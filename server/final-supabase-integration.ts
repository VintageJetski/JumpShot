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
    
    // First get the tables in the database
    try {
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      const tablesResult = await db.execute(tablesQuery);
      console.log('Available tables:', tablesResult.rows.map(r => r.table_name).join(', '));
    } catch (error) {
      console.error('Error checking tables:', error);
    }
    
    // Try to get event information from player_stats table
    try {
      const columnsQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'player_stats'
      `;
      
      const columnsResult = await db.execute(columnsQuery);
      console.log('player_stats columns:', columnsResult.rows.map(r => r.column_name).join(', '));
    } catch (error) {
      console.error('Error checking player_stats columns:', error);
    }
    
    // Hard-code event for now until we understand the schema better
    return [{ id: 1, name: 'IEM Katowice 2025' }];
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
    
    // Get player data from player_stats table with all columns
    const query = `
      SELECT * FROM player_stats
    `;
    
    const result = await db.execute(query);
    
    if (!result.rows.length) {
      console.log('No players found in database');
      return [];
    }
    
    console.log(`Found ${result.rows.length} players in database`);
    
    // Process player data
    const players = result.rows.map(player => {
      // Determine player role from CSV role data
      let playerRole = PlayerRole.Support; // Default role
      let tRole = 'Support';
      let ctRole = 'Anchor';
      let isIGL = false;
      
      if (player.role) {
        const roleStr = player.role.toUpperCase();
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
      }
      
      // Also check for is_igl field
      if (player.is_igl) {
        isIGL = true;
      }
      
      // Calculate KD ratio safely
      const kills = player.kills || 0;
      const deaths = Math.max(1, player.deaths || 1); // Avoid division by zero
      const kd = kills / deaths;
      
      // Create consistent record for frontend
      return {
        id: String(player.steam_id || ''),
        name: player.user_name || 'Unknown Player',
        team: player.team_clan_name || 'No Team',
        teamId: 0, // Will be filled in later if needed
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
        // Add mandatory fields required by frontend
        primaryMetric: {
          name: 'Impact',
          value: player.impact || 1.0
        },
        rawStats: {
          kills: player.kills || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          kd: kd || 1.0,
          adr: player.adr || 0,
          kast: player.kast || 0,
          // Include any additional fields needed by frontend
          steamId: String(player.steam_id || '')
        }
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
    
    // Check if teams table exists
    try {
      const teamsQuery = `
        SELECT * FROM teams
      `;
      
      const teamsResult = await db.execute(teamsQuery);
      console.log(`Found ${teamsResult.rows.length} teams in database`);
      
      if (teamsResult.rows.length > 0) {
        // Process team data with players
        const teams = teamsResult.rows.map(team => {
          // Find all players in this team
          const teamPlayers = allPlayers.filter(p => 
            p.team.toLowerCase() === team.name.toLowerCase()
          );
          
          // Sort by PIV
          const sortedPlayers = [...teamPlayers].sort((a, b) => b.piv - a.piv);
          
          return {
            id: team.id || 0,
            name: team.name,
            logo: '',
            tir: team.tir || 1.0,
            topPlayers: sortedPlayers.slice(0, 5),
            wins: team.wins || 0,
            losses: team.losses || 0,
            // Add mandatory fields required by frontend
            topPlayer: sortedPlayers[0] || null,
            players: sortedPlayers,
            sumPIV: sortedPlayers.reduce((sum, player) => sum + player.piv, 0),
            avgPIV: sortedPlayers.length > 0 
              ? sortedPlayers.reduce((sum, player) => sum + player.piv, 0) / sortedPlayers.length 
              : 0,
            synergy: 1.0,
            eventId
          };
        });
        
        return teams;
      }
    } catch (error) {
      console.error('Error fetching teams from table:', error);
    }
    
    // If no teams found or error, generate from player data
    return generateTeamsFromPlayers(allPlayers);
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
        topPlayer: sortedPlayers[0] || null,
        players: sortedPlayers,
        sumPIV: totalPIV,
        avgPIV: averagePIV,
        synergy: 1.0,
        eventId: 1
      });
    }
  }
  
  // Sort teams by TIR
  return teams.sort((a, b) => b.tir - a.tir);
}