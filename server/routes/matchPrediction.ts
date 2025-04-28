import { Request, Response } from 'express';
import { storage } from '../storage';
import { enhanceMatchPrediction } from '../roundAnalytics';

/**
 * Handle match prediction request
 * POST /api/match-prediction
 * Expects body with team1Id, team2Id, and map
 */
export async function handleMatchPrediction(req: Request, res: Response) {
  try {
    const { team1Id, team2Id, map } = req.body;
    
    if (!team1Id || !team2Id || !map) {
      return res.status(400).json({ 
        error: 'Missing required parameters: team1Id, team2Id, map' 
      });
    }
    
    // Get team data
    const team1 = await storage.getTeamByName(team1Id);
    const team2 = await storage.getTeamByName(team2Id);
    
    if (!team1 || !team2) {
      return res.status(404).json({ 
        error: 'One or both teams not found' 
      });
    }
    
    // Get round metrics for each team
    const team1RoundMetrics = await storage.getTeamRoundMetrics(team1.name);
    const team2RoundMetrics = await storage.getTeamRoundMetrics(team2.name);
    
    if (!team1RoundMetrics || !team2RoundMetrics) {
      return res.status(404).json({ 
        error: 'Round metrics not available for one or both teams'
      });
    }
    
    // Enhance match prediction with round-based metrics
    const prediction = enhanceMatchPrediction(
      team1, 
      team2, 
      team1RoundMetrics, 
      team2RoundMetrics, 
      map
    );
    
    return res.json({ 
      prediction,
      team1: {
        id: team1.id,
        name: team1.name,
        tir: team1.tir
      },
      team2: {
        id: team2.id,
        name: team2.name,
        tir: team2.tir
      },
      map
    });
  } catch (error) {
    console.error('Error making match prediction:', error);
    return res.status(500).json({ 
      error: 'Failed to generate match prediction' 
    });
  }
}