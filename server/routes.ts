import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { loadNewPlayerStats } from "./newDataParser";
import { loadPlayerRoles } from "./loadRoleData";
import { processPlayerStatsWithRoles } from "./newPlayerAnalytics";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // === CSV DATA ENDPOINTS (WORKING SYSTEM) ===
  
  app.get("/api/players", async (req, res) => {
    try {
      console.log('📊 SERVING RAW PLAYER DATA FROM CSV FILES');
      
      // Load data from CSV files (proven working approach)
      const rawPlayerStats = await loadNewPlayerStats();
      const rolesMap = await loadPlayerRoles();
      
      console.log(`Loaded ${rawPlayerStats.length} players from CSV`);
      console.log(`Loaded ${rolesMap.size} role assignments from CSV`);
      
      // Combine raw stats with role data - NO PIV CALCULATIONS
      const playersWithRoles = rawPlayerStats.map(player => {
        const playerKey = player.player_name || player.userName || 'Unknown';
        const roleInfo = rolesMap.get(playerKey);
        
        return {
          // Raw player statistics
          player_name: player.player_name || player.userName,
          team_name: player.team_name || player.teamName,
          steamId: player.steam_id || player.steamId,
          kills: player.kills || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          adr: player.adr || 0,
          kast: player.kast || 0,
          rating: player.rating || 0,
          
          // Role information
          isIGL: roleInfo?.isIGL || false,
          tRole: roleInfo?.tRole || 'Support',
          ctRole: roleInfo?.ctRole || 'Support',
          
          // Additional statistics for PIV calculation
          entryKills: player.entry_kills || player.entryKills || 0,
          entryDeaths: player.entry_deaths || player.entryDeaths || 0,
          multiKills: player.multi_kills || player.multiKills || 0,
          clutchWins: player.clutch_wins || player.clutchWins || 0,
          clutchAttempts: player.clutch_attempts || player.clutchAttempts || 0,
          flashAssists: player.flash_assists || player.flashAssists || 0,
          rounds: player.rounds_played || player.rounds || 16,
          maps: player.maps_played || player.maps || 1
        };
      });
      
      console.log(`📊 Serving ${playersWithRoles.length} raw players from CSV`);
      
      res.json({
        players: playersWithRoles,
        count: playersWithRoles.length,
        timestamp: new Date().toISOString(),
        note: "Raw data from CSV files - calculate PIV/TIR client-side"
      });
      
    } catch (error) {
      console.error('Error loading player data from CSV:', error);
      res.status(500).json({ 
        error: 'Failed to load player data',
        players: [],
        count: 0
      });
    }
  });

  app.get("/api/teams", async (req, res) => {
    try {
      console.log('📊 SERVING RAW TEAM DATA FROM CSV FILES');
      
      const rawPlayerStats = await loadNewPlayerStats();
      
      // Group players by team
      const teamsMap = new Map();
      
      rawPlayerStats.forEach(player => {
        const teamName = player.team_name || player.teamName || 'Unknown Team';
        
        if (!teamsMap.has(teamName)) {
          teamsMap.set(teamName, {
            name: teamName,
            players: [],
            totalKills: 0,
            totalDeaths: 0,
            totalAssists: 0,
            totalRounds: 0,
            playerCount: 0
          });
        }
        
        const team = teamsMap.get(teamName);
        team.players.push(player);
        team.totalKills += player.kills || 0;
        team.totalDeaths += player.deaths || 0;
        team.totalAssists += player.assists || 0;
        team.totalRounds += player.rounds_played || player.rounds || 16;
        team.playerCount++;
      });
      
      const teams = Array.from(teamsMap.values()).map(team => ({
        ...team,
        avgKD: team.totalDeaths > 0 ? (team.totalKills / team.totalDeaths) : team.totalKills,
        avgADR: team.playerCount > 0 ? (team.totalKills * 100) / (team.playerCount * team.totalRounds) : 0
      }));
      
      console.log(`📊 Serving ${teams.length} teams from CSV data`);
      
      res.json({
        teams,
        count: teams.length,
        timestamp: new Date().toISOString(),
        note: "Raw team data from CSV files"
      });
      
    } catch (error) {
      console.error('Error loading team data from CSV:', error);
      res.status(500).json({ 
        error: 'Failed to load team data',
        teams: [],
        count: 0
      });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      // Return the IEM Katowice 2025 event from CSV data
      const events = [
        {
          id: 1,
          name: "IEM Katowice 2025",
          displayName: "IEM Katowice 2025",
          startDate: "2025-02-01",
          endDate: "2025-02-09",
          location: "Katowice, Poland",
          tier: "S-Tier",
          status: "completed"
        }
      ];
      
      res.json({
        events,
        count: events.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error loading events:', error);
      res.status(500).json({ 
        error: 'Failed to load events',
        events: [],
        count: 0
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}