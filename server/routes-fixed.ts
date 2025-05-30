import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupSupabaseDirectRoutes } from "./supabase-direct";
import { getPlayersWithRoles } from "./simple-player-fetcher.js";

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

  // RAW DATA API - Simple role fetching
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      console.log('📊 SERVING PLAYER DATA WITH SIMPLE ROLE FETCHING');
      
      const allPlayersFromBothTournaments = await getPlayersWithRoles();
      console.log(`Simple fetcher retrieved ${allPlayersFromBothTournaments.length} total players`);
      
      // Convert to client format using correct field names from simple fetcher
      const playersWithRoles = allPlayersFromBothTournaments.map((player: any) => ({
        steamId: player.steamId,
        name: player.userName,
        team: player.teamName,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        adr: player.adr,
        kast: player.kast,
        rating: player.rating,
        isIGL: player.isIGL || false,
        tRole: player.tRole,
        ctRole: player.ctRole,
        tournament: 'Tournament',
        eventId: player.eventId,
        // Include all raw stats for PIV calculation client-side
        entryKills: player.firstKills || 0,
        entryDeaths: player.firstDeaths || 0,
        multiKills: player.multiKills || 0,
        clutchWins: player.clutchWins || 0,
        clutchAttempts: player.clutchAttempts || 0,
        flashAssists: player.flashAssists || 0,
        rounds: player.rounds || 1,
        maps: player.maps || 1
      }));
      
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