import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loadNewPlayerStats } from "./newDataParser";
import { processPlayerStatsWithRoles } from "./newPlayerAnalytics";
import { calculateTeamImpactRatings } from "./teamAnalytics";
import { loadPlayerRoles } from "./roleParser";
import { initializeRoundData } from "./roundDataLoader";
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data on server start
  try {
    console.log('Loading and processing player data...');
    const rawPlayerStats = await loadNewPlayerStats();
    
    // Load player roles from CSV
    console.log('Loading player roles from CSV...');
    const roleMap = await loadPlayerRoles();
    
    // Process player stats with roles and calculate PIV
    const playersWithPIV = processPlayerStatsWithRoles(rawPlayerStats, roleMap);
    
    // Calculate team TIR
    const teamsWithTIR = calculateTeamImpactRatings(playersWithPIV);
    
    // Store processed data
    await storage.setPlayers(playersWithPIV);
    await storage.setTeams(teamsWithTIR);
    
    console.log(`Processed ${playersWithPIV.length} players and ${teamsWithTIR.length} teams`);
    
    // Load and process round data
    await initializeRoundData();
  } catch (error) {
    console.error('Error initializing data:', error);
  }
  
  // API routes
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      const role = req.query.role as string | undefined;
      
      if (role && role !== 'All Roles') {
        const players = await storage.getPlayersByRole(role);
        res.json(players);
      } else {
        const players = await storage.getAllPlayers();
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

  // Weights endpoint

  // Weights endpoint
  app.get('/api/weights', async (req: Request, res: Response) => {
    try {      
      const weightsPath = path.join(process.cwd(), 'clean/weights/latest/learned_weights.csv');
      
      // Check if weights file exists
      if (!fs.existsSync(weightsPath)) {
        return res.status(404).json({
          error: 'No learned weights available',
          weights: {},
          metadata: {
            date: new Date().toISOString().split('T')[0],
            version: 'default',
            samples: 0
          }
        });
      }
      
      // Read and parse weights CSV
      const fileContent = fs.readFileSync(weightsPath, 'utf8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });
      
      // Extract metadata
      const metadata = {
        date: new Date().toISOString().split('T')[0],
        version: 'unknown',
        samples: 0
      };
      
      // Process weights
      const weights = {};
      
      records.forEach(record => {
        if (record.feature.startsWith('metadata_')) {
          const key = record.feature.replace('metadata_', '');
          metadata[key] = isNaN(record.weight) ? record.weight : parseFloat(record.weight);
        } else {
          weights[record.feature] = parseFloat(record.weight);
        }
      });
      
      res.json({
        weights,
        metadata
      });
    } catch (error) {
      console.error('Error fetching weights:', error);
      res.status(500).json({
        error: `Error loading weights: ${error.message}`,
        weights: {},
        metadata: {
          date: new Date().toISOString().split('T')[0],
          version: 'error',
          samples: 0
        }
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
