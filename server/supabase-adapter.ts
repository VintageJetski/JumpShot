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
    const result = await pool.query('SELECT 1 as test');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

/**
 * Get all available events from Supabase
 * (Currently hardcoded as IEM Katowice 2025 since events aren't separate in DB)
 */
export async function getEvents(): Promise<{ id: number, name: string }[]> {
  try {
    // Currently there's only one event in the database (IEM Katowice 2025)
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
    
    // Get player data from player_stats table
    const query = `
      SELECT * FROM player_stats
    `;
    
    const result = await pool.query(query);
    
    if (!result.rows.length) {
      console.log('No players found in database');
      return [];
    }
    
    console.log(`Found ${result.rows.length} players in database`);
    
    // Process player data
    const players = result.rows.map(player => {
      // Determine player role from database role field
      let role = PlayerRole.Support; // Default role
      let tRole = 'Support';
      let ctRole = 'Anchor';
      let isIGL = player.is_igl || false;
      
      if (player.role) {
        const roleStr = player.role.toString().toUpperCase();
        if (roleStr.includes('IGL')) {
          role = PlayerRole.IGL;
          isIGL = true;
        } else if (roleStr.includes('AWP')) {
          role = PlayerRole.AWP;
          tRole = 'AWP';
          ctRole = 'AWP';
        } else if (roleStr.includes('LURK')) {
          role = PlayerRole.Lurker;
          tRole = 'Lurker';
          ctRole = 'Rotator';
        } else if (roleStr.includes('SPACE')) {
          role = PlayerRole.Entry;
          tRole = 'Spacetaker';
          ctRole = 'Rotator';
        }
      }
      
      // Calculate KD ratio
      const kills = Number(player.kills) || 0;
      const deaths = Math.max(1, Number(player.deaths) || 1); // Avoid division by zero
      const kd = player.kd || kills / deaths || 1.0;
      
      // Create consistent record for frontend
      return {
        id: player.steam_id.toString(),
        name: player.user_name || 'Unknown Player',
        team: player.team_clan_name || 'Unknown Team',
        teamId: 0, // This will be set later with team data
        role: role,
        tRole: tRole,
        ctRole: ctRole,
        isIGL: isIGL,
        piv: Number(player.piv) || 1.0,
        kd: Number(kd) || 1.0,
        rating: Number(player.piv) || 1.0, // Using PIV as rating
        // Metrics that frontend needs
        metrics: {
          kills: Number(player.kills) || 0,
          deaths: Number(player.deaths) || 0,
          assists: Number(player.assists) || 0,
          adr: 0, // Not directly in DB
          kast: 0, // Not directly in DB
          opening_success: Number(player.first_kills) || 0,
          headshots: Number(player.headshots) || 0,
          clutches: 0 // Not directly in DB
        },
        // Add fields required by frontend
        primaryMetric: {
          name: 'Impact',
          value: Number(player.piv) || 1.0
        },
        // Raw stats needed by frontend
        rawStats: {
          steamId: player.steam_id.toString(),
          kills: Number(player.kills) || 0,
          deaths: Number(player.deaths) || 0,
          assists: Number(player.assists) || 0,
          kd: Number(kd) || 1.0,
          rating: Number(player.piv) || 1.0,
          headshots: Number(player.headshots) || 0,
          openingKills: Number(player.first_kills) || 0,
          openingDeaths: Number(player.first_deaths) || 0,
          utilityDamage: 0, // Not directly in DB
          flashAssists: Number(player.assisted_flashes) || 0,
          smokeThrown: Number(player.smokes_thrown) || 0,
          flashesThrown: Number(player.flashes_thrown) || 0,
          heThrown: Number(player.he_thrown) || 0,
          infernos_thrown: Number(player.infernos_thrown) || 0,
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
    
    // Get all players for this event
    const allPlayers = await getPlayersWithPIV(eventId);
    
    // Get team data from teams table
    const teamsQuery = `
      SELECT * FROM teams
    `;
    
    const teamsResult = await pool.query(teamsQuery);
    console.log(`Found ${teamsResult.rows.length} teams in database`);
    
    if (teamsResult.rows.length === 0) {
      console.log('No teams found in database, generating from player data...');
      return generateTeamsFromPlayers(allPlayers);
    }
    
    // Process team data with associated players
    const teams: TeamWithTIR[] = teamsResult.rows.map(team => {
      // Find all players in this team
      const teamPlayers = allPlayers.filter(p => 
        p.team.toLowerCase() === team.name.toLowerCase()
      );
      
      // Set teamId for players in this team
      teamPlayers.forEach(player => {
        player.teamId = team.id;
      });
      
      // Sort by PIV
      const sortedPlayers = [...teamPlayers].sort((a, b) => b.piv - a.piv);
      const topPlayer = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
      
      return {
        id: team.id.toString(),
        name: team.name,
        logo: '',
        tir: Number(team.tir) || 1.0,
        sumPIV: Number(team.sum_piv) || 0,
        synergy: Number(team.synergy) || 1.0,
        avgPIV: Number(team.avg_piv) || 1.0,
        topPlayer: topPlayer,
        players: sortedPlayers,
        topPlayers: sortedPlayers.slice(0, 5),
        wins: 0, // Not in current DB
        losses: 0, // Not in current DB
        eventId: eventId
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
  
  teamMap.forEach((teamPlayers, teamName) => {
    if (teamPlayers.length === 0) return;
    
    // Sort players by PIV for top players
    const sortedPlayers = [...teamPlayers].sort((a, b) => b.piv - a.piv);
    const topPlayer = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
    
    // Calculate team metrics
    const sumPIV = teamPlayers.reduce((sum, player) => sum + player.piv, 0);
    const avgPIV = teamPlayers.length > 0 ? sumPIV / teamPlayers.length : 1.0;
    
    // Set teamId for all players in this team
    teamPlayers.forEach(player => {
      player.teamId = teamId;
    });
    
    teams.push({
      id: teamId.toString(),
      name: teamName,
      logo: '',
      tir: avgPIV * 1.1, // A simple formula for TIR
      sumPIV: sumPIV,
      synergy: 1.0, // Default synergy
      avgPIV: avgPIV,
      topPlayer: topPlayer,
      players: sortedPlayers,
      topPlayers: sortedPlayers.slice(0, 5),
      wins: 0,
      losses: 0,
      eventId: 1
    });
    
    teamId++;
  });
  
  // Sort teams by TIR
  return teams.sort((a, b) => b.tir - a.tir);
}