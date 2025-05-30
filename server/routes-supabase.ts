import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { getPlayerStats, getEvents, getTeamStats } from "./data-service";
import { testSupabaseConnection, testPostgresConnection } from "./supabase-client";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const supabaseOk = await testSupabaseConnection();
      const postgresOk = await testPostgresConnection();
      
      res.json({
        status: supabaseOk && postgresOk ? "healthy" : "degraded",
        supabase: supabaseOk,
        postgres: postgresOk,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ status: "unhealthy", error: String(error) });
    }
  });

  // Players endpoint - uses exact schema from PRD
  app.get("/api/players", async (req, res) => {
    try {
      console.log('📊 FETCHING PLAYER DATA FROM SUPABASE');
      
      const eventId = req.query.event_id ? parseInt(req.query.event_id as string) : undefined;
      const playerStats = await getPlayerStats(eventId);
      
      // Transform to match frontend expectations while preserving raw data
      const players = playerStats.map(player => ({
        // Core identifiers
        steam_id: player.steam_id,
        player_name: player.user_name,
        team_name: player.team_clan_name,
        event_id: player.event_id,
        
        // Raw statistics for PIV calculation
        kills: player.kills || 0,
        deaths: player.deaths || 0,
        assists: player.assists || 0,
        kd: player.kd || 0,
        adr: player.adr_total || 0,
        kast: player.kast_total || 0,
        
        // Advanced stats
        headshots: player.headshots || 0,
        first_kills: player.first_kills || 0,
        first_deaths: player.first_deaths || 0,
        awp_kills: player.awp_kills || 0,
        
        // Utility stats
        flash_assists: player.assisted_flashes || 0,
        util_thrown: player.total_util_thrown || 0,
        util_damage: player.total_util_dmg || 0
      }));
      
      console.log(`📊 Serving ${players.length} players from Supabase`);
      
      res.json({
        players,
        count: players.length,
        timestamp: new Date().toISOString(),
        source: "supabase",
        event_id: eventId
      });
      
    } catch (error) {
      console.error('Error fetching players from Supabase:', error);
      res.status(500).json({ 
        error: 'Failed to fetch player data from database',
        players: [],
        count: 0
      });
    }
  });

  // Teams endpoint
  app.get("/api/teams", async (req, res) => {
    try {
      console.log('📊 FETCHING TEAM DATA FROM SUPABASE');
      
      const eventId = req.query.event_id ? parseInt(req.query.event_id as string) : undefined;
      const teamStats = await getTeamStats(eventId);
      
      const teams = teamStats.map(team => ({
        name: team.team_clan_name,
        player_count: parseInt(team.player_count) || 0,
        avg_kd: parseFloat(team.avg_kd) || 0,
        avg_adr: parseFloat(team.avg_adr) || 0,
        total_kills: parseInt(team.total_kills) || 0,
        total_deaths: parseInt(team.total_deaths) || 0
      }));
      
      console.log(`📊 Serving ${teams.length} teams from Supabase`);
      
      res.json({
        teams,
        count: teams.length,
        timestamp: new Date().toISOString(),
        source: "supabase",
        event_id: eventId
      });
      
    } catch (error) {
      console.error('Error fetching teams from Supabase:', error);
      res.status(500).json({ 
        error: 'Failed to fetch team data from database',
        teams: [],
        count: 0
      });
    }
  });

  // Events endpoint
  app.get("/api/events", async (req, res) => {
    try {
      const events = await getEvents();
      
      const formattedEvents = events.map(event => ({
        id: event.event_id,
        name: event.event_name,
        displayName: event.event_name
      }));
      
      res.json({
        events: formattedEvents,
        count: formattedEvents.length,
        timestamp: new Date().toISOString(),
        source: "supabase"
      });
      
    } catch (error) {
      console.error('Error fetching events from Supabase:', error);
      res.status(500).json({ 
        error: 'Failed to fetch events from database',
        events: [],
        count: 0
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}