import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupSupabaseDirectRoutes } from "./supabase-direct";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Set up direct Supabase routes (bypasses auth for testing)
  setupSupabaseDirectRoutes(app);

  // Simple test route to verify API is working
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'API working',
      timestamp: new Date().toISOString(),
      supabase: {
        url: !!process.env.SUPABASE_URL,
        key: !!process.env.SUPABASE_SERVICE_KEY
      }
    });
  });

  // RAW DATA API - No calculations, just serve Supabase data
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      console.log('📊 SERVING RAW PLAYER DATA FROM SUPABASE');
      const { dataRefreshManager } = await import('./dataRefreshManager');
      const rawSQLAdapter = dataRefreshManager.getRawSQLAdapter();
      
      console.log('🏆 Fetching all players from both tournaments');
      const rolesData = await rawSQLAdapter.getRolesData();
      
      // Get all players from both tournaments using the new optimized method
      const allRawPlayerStats = await rawSQLAdapter.getAllPlayersFromBothTournaments();
      
      console.log(`📊 Total raw players from all tournaments: ${allRawPlayerStats.length}`);
      
      // Combine raw stats with role data - NO CALCULATIONS
      const playersWithRoles = allRawPlayerStats.map(player => {
        const roleInfo = rolesData.find(role => 
          role.steamId?.toString() === player.steamId?.toString()
        ) || { isIGL: false, tRole: 'Support', ctRole: 'Support' };
        
        return {
          steamId: player.steamId,
          name: player.user_name || player.userName,
          team: player.team_name || player.teamName,
          kills: player.kills,
          deaths: player.deaths,
          assists: player.assists,
          adr: player.adr,
          kast: player.kast,
          rating: player.rating,
          isIGL: roleInfo.isIGL || false,
          tRole: roleInfo.tRole,
          ctRole: roleInfo.ctRole,
          tournament: player.tournament,
          eventId: player.eventId,
          // Include all raw stats for PIV calculation client-side
          entryKills: player.entryKills || 0,
          entryDeaths: player.entryDeaths || 0,
          multiKills: player.multiKills || 0,
          clutchWins: player.clutchWins || 0,
          clutchAttempts: player.clutchAttempts || 0,
          flashAssists: player.flashAssists || 0,
          rounds: player.rounds || 1,
          maps: player.maps || 1
        };
      });
      
      console.log(`📊 Serving ${playersWithRoles.length} raw players`);
      
      res.json({
        players: playersWithRoles,
        count: playersWithRoles.length,
        timestamp: new Date().toISOString(),
        note: "Raw data only - calculate PIV/TIR client-side"
      });

    } catch (error) {
      console.error('Error fetching raw player data:', error);
      res.status(500).json({ error: 'Failed to fetch player data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}