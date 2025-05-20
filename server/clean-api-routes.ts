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
 * Get all players with PIV
 */
router.get('/players', async (req: Request, res: Response) => {
  try {
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
    
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

/**
 * Get all teams with TIR
 */
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const teams = await cleanSupabaseService.getTeamsWithTIR();
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams data' });
  }
});

/**
 * Get a team by ID
 */
router.get('/teams/:id', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
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
 * Get players for a specific team
 */
router.get('/teams/:id/players', async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id;
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