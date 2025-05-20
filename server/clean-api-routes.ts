import express, { Request, Response } from 'express';
import { cleanSupabaseService } from './clean-supabase-service';

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  const isConnected = await cleanSupabaseService.checkConnection();
  const lastRefresh = cleanSupabaseService.getLastRefreshTime();
  
  res.json({
    status: 'ok',
    databaseConnected: isConnected,
    lastRefresh: lastRefresh ? lastRefresh.toISOString() : null
  });
});

/**
 * Get available events
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const events = await cleanSupabaseService.getEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events data' });
  }
});

/**
 * Get all players with PIV from all events combined
 */
router.get('/players', async (req: Request, res: Response) => {
  try {
    // Get amalgamated player data across all events
    const players = await cleanSupabaseService.getPlayersWithPIV();
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players data' });
  }
});

/**
 * Get a player by ID
 */
router.get('/players/:id', async (req: Request, res: Response) => {
  try {
    const playerId = req.params.id;
    const players = await cleanSupabaseService.getPlayersWithPIV();
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Restructure player data to match what PlayerDetailPage component expects
    const restructuredPlayer = {
      ...player,
      // Move nested metrics into the structure expected by PlayerDetailPage
      metrics: {
        ...player.metrics,
        rcs: player.rcs,
        icf: player.icf,
        sc: player.sc,
        osm: player.osm
      }
    };
    
    res.json(restructuredPlayer);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

/**
 * Get all teams with TIR across all events
 */
router.get('/teams', async (req: Request, res: Response) => {
  try {
    // Get amalgamated team data across all events
    const teams = await cleanSupabaseService.getTeamsWithTIR();
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams data' });
  }
});

/**
 * Get a team by ID (using amalgamated data across all events)
 */
router.get('/teams/:id', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
    
    // Get all teams from all events
    const teams = await cleanSupabaseService.getTeamsWithTIR();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team data' });
  }
});

/**
 * Get players for a specific team (using amalgamated data across all events)
 */
router.get('/teams/:id/players', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
    
    // Get all teams across all events
    const teams = await cleanSupabaseService.getTeamsWithTIR();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team.players);
  } catch (error) {
    console.error('Error fetching team players:', error);
    res.status(500).json({ error: 'Failed to fetch team players data' });
  }
});

/**
 * Refresh data from Supabase
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    await cleanSupabaseService.refreshData();
    const lastRefresh = cleanSupabaseService.getLastRefreshTime();
    
    res.json({
      success: true,
      lastRefresh: lastRefresh ? lastRefresh.toISOString() : null
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

export default router;