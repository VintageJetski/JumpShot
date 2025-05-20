import { Router } from 'express';
import { supabaseStorage } from './supabase-storage';
import { setupAuth, ensureAuthenticated } from './auth';

// Create a router
const router = Router();

// Set up authentication routes
setupAuth(router);

// Get events endpoint
router.get('/api/events', async (req, res) => {
  try {
    const events = await supabaseStorage.getEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get players endpoint
router.get('/api/players', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const players = await supabaseStorage.getPlayersWithPIV(eventId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get teams endpoint
router.get('/api/teams', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const teams = await supabaseStorage.getTeamsWithTIR(eventId);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Check database connection endpoint
router.get('/api/check-connection', async (req, res) => {
  try {
    const isConnected = await supabaseStorage.checkConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error checking connection:', error);
    res.status(500).json({ error: 'Failed to check connection' });
  }
});

// Force database refresh (admin only)
router.post('/api/refresh-data', ensureAuthenticated, async (req, res) => {
  try {
    // Clear cache and force refresh by checking connection again
    await supabaseStorage.checkConnection();
    
    // Get fresh data
    const eventId = req.body.eventId || 1;
    const players = await supabaseStorage.getPlayersWithPIV(eventId);
    const teams = await supabaseStorage.getTeamsWithTIR(eventId);
    
    res.json({ 
      success: true,
      playerCount: players.length,
      teamCount: teams.length
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

export default router;