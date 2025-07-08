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
        const { parseXYZData } = await import('./xyzDataParser');
        const rawXYZData = await parseXYZData(path.join(process.cwd(), 'attached_assets', 'round_4_mapping_1749572845894.csv'));
        
        console.log(`Loaded ${rawXYZData.length} XYZ position records`);
        
        // Store raw XYZ data in storage (skip heavy processing for now)
        await storage.setXYZData(rawXYZData);
        await storage.setPositionalMetrics([]); // Empty for now to unblock the API
        
        console.log(`Stored ${rawXYZData.length} XYZ records for API access`);
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
      const { round, limit = 5000, offset = 0 } = req.query;
      const fullData = await storage.getXYZData();
      
      let filteredData = fullData || [];
      
      // Filter by round if specified
      if (round && round !== 'all') {
        filteredData = filteredData.filter(d => d.round_num === parseInt(round as string));
      }
      
      // Apply pagination
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      res.json({
        data: paginatedData,
        total: filteredData.length,
        hasMore: endIndex < filteredData.length,
        round: round || 'all'
      });
    } catch (error) {
      console.error('Error fetching XYZ data:', error);
      res.status(500).json({ error: 'Failed to fetch XYZ data' });
    }
  });

  app.get('/api/xyz/metrics', async (req: Request, res: Response) => {
    try {
      // For now, return a simple success response to unblock the UI
      res.json([]);
    } catch (error) {
      console.error('Error fetching positional metrics:', error);
      res.json([]);
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

  // Phase 3: Predictive Analytics endpoints
  app.get('/api/predictive/match-state', async (req: Request, res: Response) => {
    try {
      const { analyzeMatchState } = await import('./predictiveAnalytics.js');
      const matchState = analyzeMatchState(xyzData);
      res.json(matchState);
    } catch (error) {
      console.error('Error analyzing match state:', error);
      res.status(500).json({ error: 'Failed to analyze match state' });
    }
  });

  app.get('/api/predictive/insights', async (req: Request, res: Response) => {
    try {
      const { generatePredictiveInsights } = await import('./predictiveAnalytics.js');
      const insights = generatePredictiveInsights(xyzData);
      res.json(insights);
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  });

  app.get('/api/predictive/momentum', async (req: Request, res: Response) => {
    try {
      const { calculateMomentumMetrics } = await import('./predictiveAnalytics.js');
      const momentum = calculateMomentumMetrics(xyzData);
      res.json(momentum);
    } catch (error) {
      console.error('Error calculating momentum:', error);
      res.status(500).json({ error: 'Failed to calculate momentum' });
    }
  });

  app.get('/api/predictive/next-phase', async (req: Request, res: Response) => {
    try {
      const { predictNextPhase } = await import('./predictiveAnalytics.js');
      const nextPhase = predictNextPhase(xyzData);
      res.json(nextPhase);
    } catch (error) {
      console.error('Error predicting next phase:', error);
      res.status(500).json({ error: 'Failed to predict next phase' });
    }
  });

  // Phase 4: Advanced Tactical Intelligence endpoints
  app.get('/api/tactical/formations', async (req: Request, res: Response) => {
    try {
      const { analyzeTacticalFormations } = await import('./tacticalIntelligence.js');
      const formations = analyzeTacticalFormations(xyzData);
      res.json(formations);
    } catch (error) {
      console.error('Error analyzing formations:', error);
      res.status(500).json({ error: 'Failed to analyze formations' });
    }
  });

  app.get('/api/tactical/map-control', async (req: Request, res: Response) => {
    try {
      const { analyzeMapControl } = await import('./tacticalIntelligence.js');
      const mapControl = analyzeMapControl(xyzData);
      res.json(mapControl);
    } catch (error) {
      console.error('Error analyzing map control:', error);
      res.status(500).json({ error: 'Failed to analyze map control' });
    }
  });

  app.get('/api/tactical/advantage', async (req: Request, res: Response) => {
    try {
      const { assessTacticalAdvantage } = await import('./tacticalIntelligence.js');
      const advantage = assessTacticalAdvantage(xyzData);
      res.json(advantage);
    } catch (error) {
      console.error('Error assessing tactical advantage:', error);
      res.status(500).json({ error: 'Failed to assess tactical advantage' });
    }
  });

  app.get('/api/tactical/execute-timing', async (req: Request, res: Response) => {
    try {
      const { predictExecuteTiming } = await import('./tacticalIntelligence.js');
      const timing = predictExecuteTiming(xyzData);
      res.json(timing);
    } catch (error) {
      console.error('Error predicting execute timing:', error);
      res.status(500).json({ error: 'Failed to predict execute timing' });
    }
  });

  app.get('/api/tactical/information-warfare', async (req: Request, res: Response) => {
    try {
      const { analyzeInformationWarfare } = await import('./tacticalIntelligence.js');
      const warfare = analyzeInformationWarfare(xyzData);
      res.json(warfare);
    } catch (error) {
      console.error('Error analyzing information warfare:', error);
      res.status(500).json({ error: 'Failed to analyze information warfare' });
    }
  });

  app.get('/api/tactical/intelligence', async (req: Request, res: Response) => {
    try {
      const { generateTacticalIntelligence } = await import('./tacticalIntelligence.js');
      const intelligence = generateTacticalIntelligence(xyzData);
      res.json(intelligence);
    } catch (error) {
      console.error('Error generating tactical intelligence:', error);
      res.status(500).json({ error: 'Failed to generate tactical intelligence' });
    }
  });

  // Phase 5: Competitive Intelligence endpoints
  app.get('/api/intelligence/competitive', async (req: Request, res: Response) => {
    try {
      const { analyzeCompetitiveIntelligence } = await import('./competitiveIntelligence.js');
      const intelligence = analyzeCompetitiveIntelligence(xyzData);
      res.json(intelligence);
    } catch (error) {
      console.error('Error analyzing competitive intelligence:', error);
      res.status(500).json({ error: 'Failed to analyze competitive intelligence' });
    }
  });

  app.get('/api/intelligence/patterns', async (req: Request, res: Response) => {
    try {
      const { performPatternRecognition } = await import('./competitiveIntelligence.js');
      const patterns = performPatternRecognition(xyzData);
      res.json(patterns);
    } catch (error) {
      console.error('Error performing pattern recognition:', error);
      res.status(500).json({ error: 'Failed to perform pattern recognition' });
    }
  });

  app.get('/api/intelligence/match-outcome', async (req: Request, res: Response) => {
    try {
      const { predictMatchOutcome } = await import('./competitiveIntelligence.js');
      const outcome = predictMatchOutcome(xyzData);
      res.json(outcome);
    } catch (error) {
      console.error('Error predicting match outcome:', error);
      res.status(500).json({ error: 'Failed to predict match outcome' });
    }
  });

  app.get('/api/intelligence/recommendations', async (req: Request, res: Response) => {
    try {
      const { generateStrategicRecommendations } = await import('./competitiveIntelligence.js');
      const recommendations = generateStrategicRecommendations(xyzData);
      res.json(recommendations);
    } catch (error) {
      console.error('Error generating strategic recommendations:', error);
      res.status(500).json({ error: 'Failed to generate strategic recommendations' });
    }
  });

  app.get('/api/intelligence/report', async (req: Request, res: Response) => {
    try {
      const { generateCompetitiveIntelligenceReport } = await import('./competitiveIntelligence.js');
      const report = generateCompetitiveIntelligenceReport(xyzData);
      res.json(report);
    } catch (error) {
      console.error('Error generating intelligence report:', error);
      res.status(500).json({ error: 'Failed to generate intelligence report' });
    }
  });

  
  const httpServer = createServer(app);
  return httpServer;
}
