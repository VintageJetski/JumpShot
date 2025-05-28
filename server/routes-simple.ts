import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // SIMPLE API - RAW DATA ONLY, NO CALCULATIONS
  app.get('/api/players/raw', async (req: Request, res: Response) => {
    try {
      console.log('📊 SERVING RAW PLAYER DATA FROM SUPABASE');
      const { dataRefreshManager } = await import('./dataRefreshManager');
      const rawSQLAdapter = dataRefreshManager.getRawSQLAdapter();
      
      // Get raw player stats and roles data
      const [playersData, rolesData] = await Promise.all([
        rawSQLAdapter.getPlayersData(),
        rawSQLAdapter.getRolesData()
      ]);

      // Send raw data - client will calculate PIV/TIR
      res.json({
        players: playersData,
        roles: rolesData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching raw player data:', error);
      res.status(500).json({ error: 'Failed to fetch player data' });
    }
  });

  // Simple teams endpoint - raw data only
  app.get('/api/teams/raw', async (req: Request, res: Response) => {
    try {
      const { dataRefreshManager } = await import('./dataRefreshManager');
      const rawSQLAdapter = dataRefreshManager.getRawSQLAdapter();
      
      const teamsData = await rawSQLAdapter.getTeamsData();
      
      res.json({
        teams: teamsData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching raw teams data:', error);
      res.status(500).json({ error: 'Failed to fetch teams data' });
    }
  });

  // Keep the old endpoint temporarily for backward compatibility
  app.get('/api/players', async (req: Request, res: Response) => {
    // Redirect to raw endpoint
    res.redirect('/api/players/raw');
  });

  const httpServer = createServer(app);
  return httpServer;
}