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
  
  // API routes - Serve RAW DATA ONLY, no calculated metrics
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      console.log('📊 SERVING RAW PLAYER DATA FROM SUPABASE');
      const { dataRefreshManager } = await import('./dataRefreshManager');
      const supabaseStorage = dataRefreshManager.getStorage();
      
      // Force processing of both tournaments to get all 105+ players
      const events = [
        { id: 1, name: 'IEM_Katowice_2025' },
        { id: 2, name: 'PGL_Bucharest_2025' }
      ];
      let rawPlayersData: any[] = [];
      
      // Get roles data from Supabase database using steam_id matching
      const rawSQLAdapter = dataRefreshManager.getRawSQLAdapter();
      const rolesData = await rawSQLAdapter.getRolesData();
      console.log(`Loaded ${rolesData.length} role assignments from Supabase database`);
      
      // Convert roles data to Map format using steam_id as primary key
      const roleMap = new Map();
      rolesData.forEach(role => {
        const roleInfo = {
          team: 'Unknown', // Team info will come from players table join
          player: role.playerUsername || 'Unknown',
          isIGL: role.inGameLeader,
          tRole: role.tRole,
          ctRole: role.ctRole
        };
        // Use steam_id as the primary key for exact matching with multiple formats
        const steamIdStr = role.steamId.toString();
        roleMap.set(steamIdStr, roleInfo);
        // Also try without leading/trailing whitespace
        roleMap.set(steamIdStr.trim(), roleInfo);
        // Also set by player username for additional matching options
        if (role.playerUsername) {
          roleMap.set(role.playerUsername, roleInfo);
        }
      });
      
      console.log(`Created role map with ${roleMap.size} entries using steam_id matching`);
      
      // Debug: Show sample role entries and roleMap contents
      if (rolesData.length > 0) {
        console.log('DEBUG - Sample role data from Supabase:', {
          steamId: rolesData[0].steamId,
          steamIdType: typeof rolesData[0].steamId,
          inGameLeader: rolesData[0].inGameLeader,
          tRole: rolesData[0].tRole,
          ctRole: rolesData[0].ctRole
        });
        
        // Count IGL players in roles data
        const iglCount = rolesData.filter(role => role.inGameLeader).length;
        console.log(`DEBUG - Total IGL players in roles data: ${iglCount}`);
      }
      
      console.log(`Fetching ALL players from BOTH tournaments using raw SQL adapter...`);
      
      // Bypass storage limitations and get all players directly using raw SQL
      const allPlayersFromBothTournaments = await rawSQLAdapter.getAllPlayersFromBothTournaments();
      console.log(`Raw SQL retrieved ${allPlayersFromBothTournaments.length} total players from both tournaments`);
      
      // Combine raw stats with role data - NO PIV CALCULATIONS  
      const rawPlayersWithRoles = allPlayersFromBothTournaments.map(player => {
        // Try multiple matching strategies for Steam ID
        const steamIdStr = player.steamId?.toString();
        const roleInfo = roleMap.get(steamIdStr) || 
                       roleMap.get(player.userName) || 
                       { isIGL: false, tRole: 'Support', ctRole: 'Support' };
        
        // Debug logging for first few players
        if (allPlayersFromBothTournaments.indexOf(player) < 3) {
          console.log(`Player ${player.userName} (${steamIdStr}): Role match found = ${roleMap.has(steamIdStr)}, isIGL = ${roleInfo.isIGL}`);
        }
        
        return {
          ...player,
          isIGL: roleInfo.isIGL,
          tRole: roleInfo.tRole,
          ctRole: roleInfo.ctRole
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
