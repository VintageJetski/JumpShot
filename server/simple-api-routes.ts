import { Router, Request, Response } from 'express';
import { simpleSupabaseService } from './simple-supabase-service';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  const isConnected = await simpleSupabaseService.checkConnection();
  const lastRefresh = simpleSupabaseService.getLastRefreshTime();
  
  res.json({
    status: 'ok',
    supabaseAvailable: isConnected,
    lastRefresh: lastRefresh?.toISOString() || null
  });
});

/**
 * Get available events
 */
router.get('/events', async (req: Request, res: Response) => {
  const events = await simpleSupabaseService.getEvents();
  res.json(events);
});

/**
 * Get all players with PIV
 */
router.get('/players', async (req: Request, res: Response) => {
  const players = await simpleSupabaseService.getPlayersWithPIV();
  res.json(players);
});

/**
 * Get a player by ID
 */
router.get('/players/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const players = await simpleSupabaseService.getPlayersWithPIV();
  const player = players.find(p => p.id === id);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  res.json(player);
});

/**
 * Get all teams with TIR
 */
router.get('/teams', async (req: Request, res: Response) => {
  const teams = await simpleSupabaseService.getTeamsWithTIR();
  res.json(teams);
});

/**
 * Get a team by ID
 */
router.get('/teams/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const teams = await simpleSupabaseService.getTeamsWithTIR();
  const team = teams.find(t => t.id === id);
  
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  res.json(team);
});

/**
 * Get players for a specific team
 */
router.get('/teams/:id/players', async (req: Request, res: Response) => {
  const id = req.params.id;
  const teams = await simpleSupabaseService.getTeamsWithTIR();
  const team = teams.find(t => t.id === id);
  
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  res.json(team.players || []);
});

/**
 * Refresh data from Supabase
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    await simpleSupabaseService.refreshData();
    const lastRefresh = simpleSupabaseService.getLastRefreshTime();
    
    res.json({
      success: true,
      lastRefresh: lastRefresh?.toISOString() || null
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

export default router;