import { Express, Router, Request, Response } from 'express';
import { Pool } from '@neondatabase/serverless';
import { db } from './db';
import { PlayerWithPIV, TeamWithTIR, PlayerRole } from '@shared/types';

/**
 * Core functions for connecting to Supabase 
 * and retrieving player and team data
 */

/**
 * Check if the database connection is working
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await db.execute('SELECT NOW()');
    return result.rows.length === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

/**
 * Get all available events from the database
 */
export async function getEvents(): Promise<{ id: number, name: string }[]> {
  try {
    const query = `SELECT id, name FROM events`;
    const result = await db.execute(query);
    return result.rows as { id: number, name: string }[];
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
}

/**
 * Get player data with existing PIV values from the database
 */
export async function getPlayersWithPIV(): Promise<PlayerWithPIV[]> {
  try {
    const query = `SELECT * FROM player_stats`;
    const result = await db.execute(query);
    const players = result.rows as any[];
    
    console.log(`Found ${players.length} players in player_stats table`);
    
    return players.map(player => {
      // Map role to enum
      let role = PlayerRole.Support;
      if (player.role) {
        const normalizedRole = String(player.role).trim().toLowerCase();
        if (normalizedRole.includes('awp')) role = PlayerRole.AWP;
        else if (normalizedRole === 'support') role = PlayerRole.Support;
        else if (normalizedRole === 'lurker') role = PlayerRole.Lurker;
        else if (normalizedRole === 'igl') role = PlayerRole.IGL;
        else if (normalizedRole.includes('space')) role = PlayerRole.Spacetaker;
        else if (normalizedRole === 'anchor') role = PlayerRole.Anchor;
        else if (normalizedRole === 'rotator') role = PlayerRole.Rotator;
      }
      
      // Use PIV directly from database
      const pivValue = parseFloat(player.piv) || 1.0;
      const kdValue = parseFloat(player.kd) || 1.0;
      
      return {
        id: player.steam_id || String(player.id) || '',
        name: player.user_name || 'Unknown Player',
        team: player.team_clan_name || '',
        role: role,
        tRole: role,
        ctRole: role,
        isIGL: player.is_igl === 't' || player.is_igl === true,
        isMainAWPer: player.is_main_awper === 't' || player.is_main_awper === true,
        piv: pivValue,
        tPIV: pivValue * 0.95,
        ctPIV: pivValue * 1.05,
        kd: kdValue,
        rating: pivValue * kdValue,
        metrics: {
          kills: player.kills || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          flashAssists: player.assisted_flashes || 0,
          headshotPercentage: player.headshots && player.kills ? 
            ((player.headshots / Math.max(player.kills, 1)) * 100).toFixed(1) : '0.0',
          kd: kdValue,
          adr: 0,
          clutches: 0
        },
        utilityStats: {
          flashesThrown: player.flashes_thrown || 0,
          smokeGrenades: player.smokes_thrown || 0,
          heGrenades: player.he_thrown || 0,
          molotovs: player.infernos_thrown || 0, 
          totalUtility: player.total_utility_thrown || 0
        },
        primaryMetric: {
          value: pivValue,
          label: 'PIV',
          description: 'Player Impact Value'
        },
        rcs: {
          value: 0.75,
          metrics: {
            "Entry Kills": (player.first_kills / Math.max(player.first_kills + player.first_deaths, 1)) || 0.6,
            "Trading": 0.65,
            "Positioning": 0.72,
            "Utility Usage": (player.total_utility_thrown / 200) || 0.6,
            "Support Play": (player.assisted_flashes / 15) || 0.5,
            "Clutch Factor": 0.7,
            "Map Control": 0.68,
            "Consistency": 0.7
          }
        },
        icf: { value: 0.7, sigma: 0.3 },
        sc: { value: 0.7, metric: "Team Contribution" },
        osm: 1.1,
        tMetrics: {
          roleMetrics: {
            "Entry Efficiency": 0.7,
            "Site Control": 0.68,
            "Trade Efficiency": 0.72
          }
        },
        ctMetrics: {
          roleMetrics: {
            "Site Defense": 0.76,
            "Retake Success": 0.67,
            "Position Rotation": 0.63
          }
        },
        rawStats: player
      };
    });
  } catch (error) {
    console.error('Error getting players:', error);
    return [];
  }
}

/**
 * Get team data with existing TIR values from the database
 */
export async function getTeamsWithTIR(): Promise<TeamWithTIR[]> {
  try {
    const query = `SELECT * FROM teams`;
    const result = await db.execute(query);
    const teams = result.rows as any[];
    
    console.log(`Found ${teams.length} teams in teams table`);
    
    // Get all players to associate with teams
    const allPlayers = await getPlayersWithPIV();
    
    // Group players by team
    const playersByTeam: Record<string, PlayerWithPIV[]> = {};
    for (const player of allPlayers) {
      if (!player.team) continue;
      
      if (!playersByTeam[player.team]) {
        playersByTeam[player.team] = [];
      }
      playersByTeam[player.team].push(player);
    }
    
    // Process teams from database
    return teams.map(team => {
      const teamName = team.name || '';
      const teamPlayers = playersByTeam[teamName] || [];
      
      // Sort players by PIV
      const sortedPlayers = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
      
      // Count roles for distribution
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
        if (player.role) {
          roleCount[player.role]++;
        }
      }
      
      // Create top player object
      const topPlayer = {
        id: 'top_player',
        name: team.top_player_name || (sortedPlayers.length > 0 ? sortedPlayers[0].name : 'Top Player'),
        piv: parseFloat(team.top_player_piv) || (sortedPlayers.length > 0 ? sortedPlayers[0].piv : 1.0)
      };
      
      return {
        id: String(team.id) || `team_${teamName}`,
        name: teamName,
        logo: '',
        tir: parseFloat(team.tir) || 1.05,
        sumPIV: parseFloat(team.sum_piv) || 5.0,
        synergy: parseFloat(team.synergy) || 0.85,
        avgPIV: parseFloat(team.avg_piv) || 1.0,
        topPlayer: topPlayer,
        players: teamPlayers,
        topPlayers: sortedPlayers.slice(0, 5),
        wins: 0,
        losses: 0,
        roleDistribution: roleCount,
        strengths: ["Balanced roster", "Strong teamwork"],
        weaknesses: ["Needs more experience", "Inconsistent performance"]
      };
    });
  } catch (error) {
    console.error('Error getting teams:', error);
    return [];
  }
}

/**
 * Create API routes for player and team data
 */
export function createFinalRoutes(): Router {
  const router = Router();
  
  // Health check
  router.get('/health', async (req: Request, res: Response) => {
    const isConnected = await checkDatabaseConnection();
    res.json({ status: 'ok', connected: isConnected });
  });
  
  // Get players
  router.get('/players', async (req: Request, res: Response) => {
    const players = await getPlayersWithPIV();
    res.json(players);
  });
  
  // Get player by ID
  router.get('/players/:id', async (req: Request, res: Response) => {
    const players = await getPlayersWithPIV();
    const player = players.find(p => p.id === req.params.id);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  });
  
  // Get teams
  router.get('/teams', async (req: Request, res: Response) => {
    const teams = await getTeamsWithTIR();
    res.json(teams);
  });
  
  // Get team by ID
  router.get('/teams/:id', async (req: Request, res: Response) => {
    const teams = await getTeamsWithTIR();
    const team = teams.find(t => t.id === req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  });
  
  // Get players for a team
  router.get('/teams/:id/players', async (req: Request, res: Response) => {
    const teams = await getTeamsWithTIR();
    const team = teams.find(t => t.id === req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team.players || []);
  });
  
  // Get events
  router.get('/events', async (req: Request, res: Response) => {
    const events = await getEvents();
    res.json(events);
  });
  
  return router;
}

/**
 * Setup the database and API routes in an Express app
 */
export function setupFinalSolution(app: Express): void {
  // Create and mount the API routes
  const apiRoutes = createFinalRoutes();
  app.use('/api/cs2', apiRoutes);
  
  // Immediately check database connection
  checkDatabaseConnection().then(connected => {
    console.log(`Database connection: ${connected ? 'Available ✅' : 'Unavailable ❌'}`);
  });
}