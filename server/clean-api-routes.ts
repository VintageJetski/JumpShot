import express, { Request, Response, Router } from 'express';
import { cleanSupabaseService } from './clean-supabase-service';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isAvailable = await cleanSupabaseService.checkConnection();
    res.json({
      status: 'ok',
      supabaseAvailable: isAvailable,
      lastRefresh: cleanSupabaseService.getLastRefreshTime()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
});

/**
 * Get available events
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const events = await cleanSupabaseService.getEvents();
    res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to retrieve events' });
  }
});

/**
 * Get all players with PIV from all events combined
 */
router.get('/players', async (req: Request, res: Response) => {
  try {
    const players = await cleanSupabaseService.getPlayersWithPIV();
    res.json(players);
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ error: 'Failed to retrieve players' });
  }
});

/**
 * Get a player by ID
 */
router.get('/players/:id', async (req: Request, res: Response) => {
  try {
    const players = await cleanSupabaseService.getPlayersWithPIV();
    const player = players.find(p => p.id === req.params.id);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    console.error(`Error getting player ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve player' });
  }
});

/**
 * Get all teams with TIR across all events
 */
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const teams = await cleanSupabaseService.getTeamsWithTIR();
    res.json(teams);
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({ error: 'Failed to retrieve teams' });
  }
});

/**
 * Get a team by ID (using amalgamated data across all events)
 */
router.get('/teams/:id', async (req: Request, res: Response) => {
  try {
    const teams = await cleanSupabaseService.getTeamsWithTIR();
    const team = teams.find(t => t.id === req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    console.error(`Error getting team ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve team' });
  }
});

/**
 * Get players for a specific team (using amalgamated data across all events)
 */
router.get('/teams/:id/players', async (req: Request, res: Response) => {
  try {
    const teams = await cleanSupabaseService.getTeamsWithTIR();
    const team = teams.find(t => t.id === req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team.players);
  } catch (error) {
    console.error(`Error getting players for team ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve team players' });
  }
});

/**
 * Refresh data from Supabase
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    await cleanSupabaseService.refreshData();
    res.json({ 
      success: true, 
      message: 'Data refresh completed', 
      timestamp: cleanSupabaseService.getLastRefreshTime() 
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

export default router;