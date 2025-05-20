import { Express, Request, Response } from 'express';
import { createServer, Server } from 'http';
import { supabaseStorage } from './supabase-storage';
import { dataRefreshManager } from './dataRefreshManager';
import { ensureAuthenticated } from './auth';

export function registerRoutes(app: Express): Server {
  // Status endpoint to check Supabase connectivity
  app.get('/api/status', async (req: Request, res: Response) => {
    const isSupabaseAvailable = dataRefreshManager.isSupabaseAvailable();
    const lastRefresh = dataRefreshManager.getLastRefreshTime();
    res.json({
      supabaseConnected: isSupabaseAvailable,
      lastRefresh,
      serverTime: new Date(),
    });
  });

  // Get all available events
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const events = await supabaseStorage.getEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Get players for specific event with PIV calculations
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
      const players = await supabaseStorage.getPlayersWithPIV(eventId);
      res.json(players);
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({ error: 'Failed to fetch players' });
    }
  });

  // Get teams for specific event with TIR calculations
  app.get('/api/teams', async (req: Request, res: Response) => {
    try {
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
      const teams = await supabaseStorage.getTeamsWithTIR(eventId);
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  });

  // Force refresh of data (admin only)
  app.post('/api/admin/refresh-data', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      await dataRefreshManager.refreshData();
      const lastRefresh = dataRefreshManager.getLastRefreshTime();
      res.json({ success: true, lastRefresh });
    } catch (error) {
      console.error('Error refreshing data:', error);
      res.status(500).json({ success: false, error: 'Failed to refresh data' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}