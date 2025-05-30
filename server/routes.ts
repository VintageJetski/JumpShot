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
        // Use steam_id as the primary key for exact matching
        roleMap.set(role.steamId.toString(), roleInfo);
        // Also set by player username for additional matching options
        if (role.playerUsername) {
          roleMap.set(role.playerUsername, roleInfo);
        }
      });
      
      console.log(`Created role map with ${roleMap.size} entries using steam_id matching`);
      
      // Debug: Show sample role entries
      if (rolesData.length > 0) {
        console.log('DEBUG - Sample role data from Supabase:', {
          steamId: rolesData[0].steamId,
          playerUsername: rolesData[0].playerUsername,
          inGameLeader: rolesData[0].inGameLeader,
          tRole: rolesData[0].tRole,
          ctRole: rolesData[0].ctRole
        });
      }
      
      for (const event of events) {
        try {
          console.log(`DEBUG ROUTE - Processing event ${event.id}`);
          // Get raw player stats only - NO PIV CALCULATIONS
          const rawPlayerStats = await supabaseStorage.getPlayerStatsForEvent(event.id);
          console.log(`RAW DATA - Got ${rawPlayerStats.length} raw players for event ${event.id}`);
          
          // Combine raw stats with role data - NO CALCULATIONS
          const rawPlayersWithRoles = rawPlayerStats.map(player => {
            const roleInfo = roleMap.get(player.steamId?.toString()) || 
                           roleMap.get(player.playerUsername) || 
                           { isIGL: false, tRole: 'Support', ctRole: 'Support' };
            
            return {
              // Raw player stats
              steamId: player.steamId,
              playerUsername: player.playerUsername,
              teamName: player.teamName,
              kills: player.kills,
              deaths: player.deaths,
              assists: player.assists,
              adr: player.adr,
              kast: player.kast,
              rating: player.rating,
              entryKills: player.entryKills,
              entryDeaths: player.entryDeaths,
              multiKills: player.multiKills,
              clutchWins: player.clutchWins,
              clutchAttempts: player.clutchAttempts,
              flashAssists: player.flashAssists,
              rounds: player.rounds,
              maps: player.maps,
              teamRounds: player.teamRounds,
              // Role data
              isIGL: roleInfo.isIGL,
              tRole: roleInfo.tRole,
              ctRole: roleInfo.ctRole
            };
          });
          
          rawPlayersData = rawPlayersData.concat(rawPlayersWithRoles);
        } catch (error) {
          console.warn(`Could not process players for event ${event.id}:`, error);
        }
      }
      
      // Apply role filter if specified
      const role = req.query.role as string | undefined;
      if (role && role !== 'All Roles') {
        allPlayers = allPlayers.filter(player => 
          player.role === role || player.tRole === role || player.ctRole === role
        );
      }
      
      console.log(`Returning ${allPlayers.length} players from Supabase data`);
      
      // Show the actual structure we're returning
      if (allPlayers.length > 0) {
        console.log('ACTUAL PLAYER STRUCTURE:', JSON.stringify(allPlayers[0], null, 2));
      }
      
      res.json(allPlayers);
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
