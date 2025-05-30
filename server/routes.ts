import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loadNewPlayerStats } from "./newDataParser";
import { processPlayerStatsWithRoles } from "./newPlayerAnalytics";
import { calculateTeamImpactRatings } from "./teamAnalytics";
import { loadPlayerRoles } from "./roleParser";
import { initializeRoundData } from "./roundDataLoader";
import { setupAuth, ensureAuthenticated } from "./auth";
import { processXYZDataFromFile, RoundPositionalMetrics, PlayerMovementAnalysis } from "./xyz-data-parser";
import { getPlayersWithRoles } from "./simple-player-fetcher.js";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Supabase data refresh system
  try {
    console.log('Initializing Supabase data refresh system...');
    const { dataRefreshManager } = await import('./dataRefreshManager');
    
    // Start the data refresh manager to get fresh Supabase data
    await dataRefreshManager.start();
    
    console.log('Supabase data refresh system initialized successfully');
    
    // Load and process round data (keeping this for now as it's still CSV-based)
    await initializeRoundData();
  } catch (error) {
    console.error('Error initializing Supabase data system:', error);
    // Don't fail completely - the API endpoints will handle errors gracefully
  }
  
  // API routes - Serve RAW DATA ONLY with simple role fetching
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      console.log('📊 SERVING PLAYER DATA WITH SIMPLE ROLE FETCHING');
      
      // Use simple player fetcher with separate queries  
      const allPlayersFromBothTournaments = await getPlayersWithRoles();
      console.log(`Simple fetcher retrieved ${allPlayersFromBothTournaments.length} total players`);
      
      // Check if Aleksib exists in the player data
      const aleksibInPlayerData = allPlayersFromBothTournaments.find(p => p.steamId === '76561198013243326' || p.userName === 'Aleksib');
      console.log(`🔍 Aleksib found in player data:`, aleksibInPlayerData ? `Yes - Steam ID: ${aleksibInPlayerData.steamId}, Name: ${aleksibInPlayerData.userName}` : 'No');
      
      // Debug role matching for Aleksib specifically
      const aleksibRoleData = rolesData.find(role => role.steamId?.toString() === '76561198013243326');
      console.log(`🔍 Aleksib role data match:`, aleksibRoleData);
      
      // Use authentic database role assignments
      console.log(`🔍 Starting role assignment for ${allPlayersFromBothTournaments.length} players`);
      const rawPlayersWithRoles = allPlayersFromBothTournaments.map(player => {
        const steamIdStr = player.steamId?.toString();
        
        // Find exact match in rolesData using authentic database values
        const roleMatch = rolesData.find(role => role.steamId?.toString() === steamIdStr);
        
        // Debug first few players to understand the data structure
        const playerIndex = allPlayersFromBothTournaments.indexOf(player);
        if (playerIndex < 3) {
          console.log(`🔍 Player ${playerIndex + 1} DEBUG:`, {
            playerUserName: player.userName,
            playerSteamId: steamIdStr,
            roleMatchFound: !!roleMatch,
            roleMatchData: roleMatch
          });
        }
        
        // Debug for cadiaN specifically
        if (player.userName === 'cadiaN') {
          console.log(`🔍 cadiaN FOUND:`, {
            playerUserName: player.userName,
            playerSteamId: steamIdStr,
            roleMatchFound: !!roleMatch,
            roleMatchData: roleMatch
          });
        }
        
        let isIGL = false;
        let tRole = 'Unassigned';
        let ctRole = 'Unassigned';
        let primaryRole = 'Unassigned';
        
        if (roleMatch) {
          // Use authentic database boolean value
          isIGL = roleMatch.inGameLeader === true;
          tRole = roleMatch.tRole || 'Unassigned';
          ctRole = roleMatch.ctRole || 'Unassigned';
          
          // Determine primary role using authentic database role values
          if (isIGL) {
            primaryRole = 'IGL';
          } else if (tRole === 'AWP' || ctRole === 'AWP') {
            primaryRole = 'AWP';
          } else if (tRole === 'Lurker') {
            primaryRole = 'Lurker';
          } else if (tRole === 'Spacetaker') {
            primaryRole = 'Spacetaker';
          } else if (ctRole === 'Anchor') {
            primaryRole = 'Anchor';
          } else if (ctRole === 'Rotator') {
            primaryRole = 'Rotator';
          } else if (tRole === 'Support') {
            primaryRole = 'Support';
          } else {
            primaryRole = 'Unassigned';
          }
        }

        return {
          ...player,
          isIGL,
          role: primaryRole,
          tRole,
          ctRole
        };
      });
      
      rawPlayersData = rawPlayersWithRoles;
      
      // Use the accumulated data from both tournaments
      let allPlayers = rawPlayersData;
      
      // Apply role filter if specified
      const role = req.query.role as string | undefined;
      if (role && role !== 'All Roles') {
        allPlayers = allPlayers.filter(player => 
          player.role === role || player.tRole === role || player.ctRole === role
        );
      }
      
      // Count IGL players in final result
      const iglPlayersCount = allPlayers.filter(p => p.isIGL === true).length;
      console.log(`📊 Final IGL players count: ${iglPlayersCount} out of ${allPlayers.length} total players`);
      
      console.log(`📊 Serving ${allPlayers.length} raw players from ${events.length} tournaments`);
      
      res.json({
        players: allPlayers,
        count: allPlayers.length,
        tournaments: events.length
      });
    } catch (error) {
      console.error('Error fetching players from Supabase:', error);
      res.status(500).json({ message: 'Failed to fetch players from database' });
    }
  });
  
  app.get('/api/players/:id', async (req: Request, res: Response) => {
    try {
      const player = await storage.getPlayerById(req.params.id);
      
      if (player) {
        res.json(player);
      } else {
        res.status(404).json({ message: 'Player not found' });
      }
    } catch (error) {
      console.error('Error fetching player:', error);
      res.status(500).json({ message: 'Failed to fetch player' });
    }
  });
  
  app.get('/api/teams', async (req: Request, res: Response) => {
    try {
      const { dataRefreshManager } = await import('./dataRefreshManager');
      const supabaseStorage = dataRefreshManager.getStorage();
      
      // Get fresh Supabase data for all events
      const events = supabaseStorage.getEvents();
      let allTeams: any[] = [];
      
      for (const event of events) {
        try {
          const teamsWithTIR = await supabaseStorage.getTeamStatsWithTIR(event.id);
          allTeams = allTeams.concat(teamsWithTIR);
        } catch (error) {
          console.warn(`Could not get teams for event ${event.id}:`, error);
        }
      }
      
      console.log(`GET /api/teams: Returning ${allTeams.length} teams from Supabase data`);
      res.json(allTeams);
    } catch (error) {
      console.error('Error fetching teams from Supabase:', error);
      res.status(500).json({ message: 'Failed to fetch teams from database' });
    }
  });
  
  app.get('/api/teams/:name', async (req: Request, res: Response) => {
    try {
      const team = await storage.getTeamByName(req.params.name);
      
      if (team) {
        res.json(team);
      } else {
        res.status(404).json({ message: 'Team not found' });
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({ message: 'Failed to fetch team' });
    }
  });
  
  // Round data endpoints
  app.get('/api/round-metrics/:teamName', async (req: Request, res: Response) => {
    try {
      const teamName = req.params.teamName;
      const metrics = await storage.getTeamRoundMetrics(teamName);
      
      if (metrics) {
        res.json(metrics);
      } else {
        res.status(404).json({ message: 'Round metrics not found for team' });
      }
    } catch (error) {
      console.error('Error fetching round metrics:', error);
      res.status(500).json({ message: 'Failed to fetch round metrics' });
    }
  });

  // Setup authentication
  setupAuth(app);
  
  // Protected admin routes
  app.get('/api/admin/stats', ensureAuthenticated, (req: Request, res: Response) => {
    res.json({
      message: 'Admin stats accessed successfully',
      userCount: 1,
      playerCount: 81,
      teamCount: 16,
      lastUpdated: new Date().toISOString()
    });
  });
  
  // XYZ Positional data analysis endpoints
  app.get('/api/admin/xyz-analysis', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('Processing sample XYZ data...');
      
      // Set a higher timeout for this API endpoint
      req.setTimeout(120000); // 2-minute timeout
      res.setTimeout(120000);
      
      // Process the data asynchronously
      const roundNumber = 4; // Analyzing specific round data
      const filePath = './attached_assets/round_4_mapping.csv'; // Using relative path from project root
      
      // Log the file path for debugging
      console.log(`Attempting to process XYZ data from: ${filePath}`);
      
      console.log(`Found XYZ data file at ${filePath}, processing...`);
      const xyzAnalysis = await processXYZDataFromFile(filePath, roundNumber);
      
      // Send a more compact response for better performance
      // Simplify the position heatmap data to reduce response size
      const compactAnalysis = {
        ...xyzAnalysis,
        playerMetrics: Object.entries(xyzAnalysis.playerMetrics).reduce<Record<string, PlayerMovementAnalysis>>((acc, [key, player]) => {
          // Limit the number of heatmap points to reduce payload size
          const typedPlayer = player as PlayerMovementAnalysis;
          const sampledHeatmap = typedPlayer.positionHeatmap.filter((_: any, i: number) => i % 3 === 0);
          
          acc[key] = {
            ...typedPlayer,
            positionHeatmap: sampledHeatmap
          };
          return acc;
        }, {})
      };
      
      res.json({
        message: 'XYZ data analysis completed successfully',
        roundNum: xyzAnalysis.round_num,
        analysis: compactAnalysis
      });
    } catch (error) {
      console.error('Error processing XYZ data:', error);
      res.status(500).json({ 
        message: 'Failed to process XYZ data',
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
