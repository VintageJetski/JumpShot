import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loadNewPlayerStats } from "./newDataParser";
import { processPlayerStatsWithRoles } from "./newPlayerAnalytics";
import { calculateTeamImpactRatings } from "./teamAnalytics";
import { loadPlayerRoles } from "./roleParser";
import { initializeRoundData } from "./roundDataLoader";
import path from "path";

// Global cache for processed data
let dataInitialized = false;
let dataInitializing = false;

async function initializeDataIfNeeded() {
  if (dataInitialized || dataInitializing) return;
  
  dataInitializing = true;
  try {
    console.log('Loading raw player data...');
    const rawPlayerStats = await loadNewPlayerStats();
    
    console.log('Loading player roles from CSV...');
    const roleMap = await loadPlayerRoles();
    
    console.log('Loading round data...');
    await initializeRoundData();
    
    // Load XYZ coordinate data in background after other data is ready
    setTimeout(async () => {
      try {
        console.log('Loading XYZ coordinate data...');
        const { parseXYZData, processPositionalData } = await import('./xyzDataParser');
        const rawXYZData = await parseXYZData(path.join(process.cwd(), 'attached_assets', 'round_4_mapping_1749572845894.csv'));
        
        console.log(`Loaded ${rawXYZData.length} XYZ position records`);
        
        // Process positional metrics from raw data
        const positionalMetrics = processPositionalData(rawXYZData, 'de_inferno');
        
        // Store XYZ data in storage
        await storage.setXYZData(rawXYZData);
        await storage.setPositionalMetrics(positionalMetrics);
        
        console.log(`Processed ${positionalMetrics.length} positional metrics`);
      } catch (error) {
        console.error('Error loading XYZ data:', error);
      }
    }, 1000);
    
    // Process player data and store in cache
    const processedPlayers = processPlayerStatsWithRoles(rawPlayerStats, roleMap);
    await storage.setPlayers(processedPlayers);
    
    // Calculate and store team data
    const teams = calculateTeamImpactRatings(processedPlayers);
    await storage.setTeams(teams);
    
    console.log(`Loaded ${rawPlayerStats.length} raw player records`);
    console.log(`Processed ${processedPlayers.length} players and ${teams.length} teams`);
    dataInitialized = true;
  } catch (error) {
    console.error('Error loading raw data:', error);
  } finally {
    dataInitializing = false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data asynchronously in background
  initializeDataIfNeeded();
  
  // Simple status endpoint to verify server is working
  app.get('/api/status', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      dataInitialized: dataInitialized,
      dataInitializing: dataInitializing 
    });
  });
  
  // Raw data API routes - no calculations
  app.get('/api/raw/players', async (req: Request, res: Response) => {
    try {
      const rawPlayerStats = await loadNewPlayerStats();
      res.json(rawPlayerStats);
    } catch (error) {
      console.error('Error fetching raw player data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/raw/roles', async (req: Request, res: Response) => {
    try {
      const roleMap = await loadPlayerRoles();
      const rolesArray = Array.from(roleMap.entries()).map(([playerName, roleInfo]) => ({
        playerName,
        ...roleInfo
      }));
      res.json(rolesArray);
    } catch (error) {
      console.error('Error fetching role data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/raw/rounds', async (req: Request, res: Response) => {
    try {
      const { loadRoundData } = await import('./roundAnalytics.js');
      const rounds = await loadRoundData();
      res.json(rounds);
    } catch (error) {
      console.error('Error fetching round data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Legacy endpoints - now return calculated data from frontend
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      console.log('Players API called - checking data status...');
      
      if (!dataInitialized) {
        return res.status(202).json({ 
          message: 'Data still loading, please try again shortly',
          dataInitialized: dataInitialized,
          dataInitializing: dataInitializing 
        });
      }
      
      const role = req.query.role as string | undefined;
      console.log(`Fetching players with role filter: ${role || 'all'}`);
      
      if (role && role !== 'All Roles') {
        const players = await storage.getPlayersByRole(role);
        console.log(`Found ${players.length} players for role ${role}`);
        res.json(players);
      } else {
        const players = await storage.getAllPlayers();
        console.log(`Found ${players.length} total players`);
        res.json(players);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({ message: 'Failed to fetch players' });
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
      const teams = await storage.getAllTeams();
      console.log(`GET /api/teams: Returning ${teams.length} teams`);
      if (teams.length > 0) {
        console.log(`Team sample: ${JSON.stringify(teams[0])}`);
      }
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ message: 'Failed to fetch teams' });
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

  // XYZ Positional Data endpoints
  app.get('/api/xyz/raw', async (req: Request, res: Response) => {
    try {
      const xyzData = await storage.getXYZData();
      // Return empty array if data is still loading
      res.json(xyzData || []);
    } catch (error) {
      console.error('Error fetching XYZ data:', error);
      res.json([]); // Return empty array instead of error to prevent white screen
    }
  });

  app.get('/api/xyz/metrics', async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getPositionalMetrics();
      // Return empty array if metrics are still being calculated
      res.json(metrics || []);
    } catch (error) {
      console.error('Error fetching positional metrics:', error);
      res.json([]); // Return empty array instead of error to prevent white screen
    }
  });

  app.get('/api/xyz/player/:steamId', async (req: Request, res: Response) => {
    try {
      const { steamId } = req.params;
      const playerData = await storage.getPlayerXYZData(steamId);
      res.json(playerData);
    } catch (error) {
      console.error('Error fetching player XYZ data:', error);
      res.status(500).json({ message: 'Failed to fetch player XYZ data' });
    }
  });

  app.get('/api/xyz/round/:roundNum', async (req: Request, res: Response) => {
    try {
      const roundNum = parseInt(req.params.roundNum);
      const roundData = await storage.getRoundXYZData(roundNum);
      res.json(roundData);
    } catch (error) {
      console.error('Error fetching round XYZ data:', error);
      res.status(500).json({ message: 'Failed to fetch round XYZ data' });
    }
  });

  
  const httpServer = createServer(app);
  return httpServer;
}
