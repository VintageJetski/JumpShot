import { storage } from './storage';
import { RoundData, TeamRoundMetrics } from '@shared/schema';
import { loadRoundData, groupRoundsByMatch, calculateTeamRoundMetrics } from './roundAnalytics';

/**
 * Loads round data from CSV and processes it into team metrics
 * This function should be called during app initialization
 */
export async function initializeRoundData(): Promise<void> {
  try {
    console.log('Loading and processing round data...');
    
    // Load raw round data from CSV
    const rounds = await loadRoundData();
    console.log(`Loaded ${rounds.length} rounds from CSV`);
    
    // Group rounds by match
    const matchMap = groupRoundsByMatch(rounds);
    console.log(`Grouped rounds into ${matchMap.size} matches`);
    
    // Get unique team names
    const teamNames = new Set<string>();
    rounds.forEach(round => {
      teamNames.add(round.ctTeam);
      teamNames.add(round.tTeam);
    });
    
    console.log(`Found ${teamNames.size} teams in round data`);
    
    // Calculate metrics for each team
    const teamNamesArray = Array.from(teamNames);
    for (const teamName of teamNamesArray) {
      // Calculate team round metrics for this team
      const teamRounds = rounds.filter(round => 
        round.ctTeam === teamName || round.tTeam === teamName
      );
      
      if (teamRounds.length === 0) continue;
      
      const teamMetrics = calculateTeamRoundMetrics(teamRounds, teamName);
      
      // Store team metrics
      await storage.setTeamRoundMetrics(teamMetrics);
      
      console.log(`Processed round metrics for team: ${teamName}`);
    }
    
    console.log('Round data processing complete');
  } catch (error) {
    console.error('Error loading round data:', error);
  }
}