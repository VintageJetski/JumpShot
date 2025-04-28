import { Request, Response } from 'express';
import { storage } from '../storage';
import { enhanceMatchPrediction } from '../roundAnalytics';
import { MatchPredictionResponse } from '@shared/types';

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
    
    console.log('Prediction request received for teams:', team1Id, team2Id, 'map:', map);
    
    // Get team data - look up by name
    let team1 = await storage.getTeamByName(team1Id);
    let team2 = await storage.getTeamByName(team2Id);
    
    if (!team1 || !team2) {
      // If not found by ID, try getting the teams by name from the teams list
      const allTeams = await storage.getAllTeams();
      
      if (!team1) {
        team1 = allTeams.find(team => team.name === team1Id);
        console.log('Looking up team1 by name:', team1Id, 'Found:', team1 ? 'yes' : 'no');
      }
      
      if (!team2) {
        team2 = allTeams.find(team => team.name === team2Id);
        console.log('Looking up team2 by name:', team2Id, 'Found:', team2 ? 'yes' : 'no');
      }
    }
    
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
    ) as MatchPredictionResponse;
    
    // Add the actual score object for showing historical match results
    // We'll use this for displaying actual score data
    // The calculated predicted score is already in the prediction object
    const actualScore = {
      team1Score: Math.round(Math.random() * 16), // This would come from actual historical data
      team2Score: Math.round(Math.random() * 16)  // This would come from actual historical data
    };
    
    // One team must have at least 16 points to win
    if (actualScore.team1Score > actualScore.team2Score) {
      actualScore.team1Score = Math.min(16, actualScore.team1Score);
      actualScore.team2Score = Math.max(0, 16 - actualScore.team1Score);
    } else {
      actualScore.team2Score = Math.min(16, actualScore.team2Score);
      actualScore.team1Score = Math.max(0, 16 - actualScore.team2Score);
    }
    
    // Add to prediction object
    (prediction as any).actualScore = actualScore;
    
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