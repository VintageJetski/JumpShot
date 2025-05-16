import { loadPlayerData } from './csvParser';
import { loadNewPlayerStats } from './newDataParser';
import { supabaseDataService } from './supabase-data-service';
import { PlayerRawStats } from './types';

// Data source enum
export enum DataSource {
  CSV = 'csv',
  SUPABASE = 'supabase'
}

// Current data source - default to Supabase
export let CURRENT_DATA_SOURCE = DataSource.SUPABASE;

/**
 * Set the current data source
 */
export function setDataSource(source: DataSource): void {
  CURRENT_DATA_SOURCE = source;
  console.log(`Data source set to: ${source}`);
}

/**
 * Refresh data from the current source
 * Used after toggling the data source
 */
export async function refreshData(): Promise<void> {
  console.log(`Refreshing data from current source: ${CURRENT_DATA_SOURCE}`);
  
  try {
    if (CURRENT_DATA_SOURCE === DataSource.SUPABASE) {
      await supabaseDataService.refreshAllData();
      console.log('Successfully refreshed data from Supabase');
    } else {
      // For CSV, we don't need to do anything as data is loaded at startup
      console.log('Using existing CSV data (no refresh needed)');
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
    throw error;
  }
}

/**
 * Get players from the current data source
 */
export async function getPlayers(): Promise<PlayerRawStats[]> {
  if (CURRENT_DATA_SOURCE === DataSource.CSV) {
    try {
      // Try to use the newer data parser first
      return await loadNewPlayerStats();
    } catch (error) {
      console.log('Falling back to original CSV parser');
      return await loadPlayerData();
    }
  } else {
    // Fetch from Supabase
    try {
      const players = await supabaseDataService.getAllPlayers();
      return supabaseDataService.convertPlayersToRawStats(players);
    } catch (error) {
      console.error('Error fetching players from Supabase:', error);
      // Fall back to CSV if Supabase fails
      console.log('Falling back to CSV data source due to Supabase error');
      return await loadNewPlayerStats();
    }
  }
}

/**
 * Get teams from the current data source
 */
export async function getTeams() {
  console.log(`Getting teams from ${CURRENT_DATA_SOURCE}`);
  if (CURRENT_DATA_SOURCE === DataSource.CSV) {
    // Generate team data from player data for CSV
    try {
      const players = await getPlayers();
      console.log(`Loaded ${players.length} players for team generation`);
      
      // Extract unique teams and build team objects
      const teamMap = new Map();
      
      players.forEach(player => {
        if (!player.team) return;
        
        // Normalize team name to create consistent IDs
        const teamName = player.team.trim();
        const teamId = teamName.toLowerCase().replace(/\s+/g, '-');
        
        if (!teamMap.has(teamId)) {
          teamMap.set(teamId, {
            id: teamId,
            name: teamName,
            players: [],
            tir: 0 // Will be calculated later
          });
        }
        
        // Add player to the team
        const team = teamMap.get(teamId);
        team.players.push({
          id: player.id,
          name: player.name,
          team: teamName,
          role: player.tRole || player.ctRole, // Use tRole as primary if available
          piv: player.pivValue || 0,
          rawStats: player
        });
      });
      
      // Calculate a simple TIR (Team Impact Rating) based on player PIVs
      Array.from(teamMap.values()).forEach(team => {
        if (team.players.length > 0) {
          const totalPIV = team.players.reduce((sum, player) => sum + (player.piv || 0), 0);
          team.tir = totalPIV / team.players.length;
        }
      });
      
      return Array.from(teamMap.values());
    } catch (error) {
      console.error('Error generating teams from CSV data:', error);
      return []; // Return empty array on error
    }
  } else {
    // Fetch from Supabase
    try {
      return await supabaseDataService.getAllTeams();
    } catch (error) {
      console.error('Error fetching teams from Supabase:', error);
      // Return empty array as fallback
      return [];
    }
  }
}

/**
 * Schedule regular data refreshes
 * @param intervalMinutes How often to refresh data in minutes
 */
export function scheduleDataRefresh(intervalMinutes: number = 1440): NodeJS.Timeout {
  const intervalMs = intervalMinutes * 60 * 1000; // Convert minutes to milliseconds
  
  console.log(`Scheduling data refresh every ${intervalMinutes} minutes`);
  
  // Set up recurring refresh
  const interval = setInterval(async () => {
    console.log('Performing scheduled data refresh...');
    try {
      await refreshData();
      console.log('Scheduled data refresh completed successfully');
    } catch (error) {
      console.error('Error during scheduled data refresh:', error);
    }
  }, intervalMs);
  
  return interval;
}

/**
 * Initialize the data controller
 */
export async function initializeDataController(): Promise<void> {
  console.log(`Initializing data controller with source: ${CURRENT_DATA_SOURCE}`);
  
  // Perform initial data load
  try {
    if (CURRENT_DATA_SOURCE === DataSource.SUPABASE) {
      await supabaseDataService.refreshAllData();
    }
    
    // Set up daily refresh schedule (1440 minutes = 24 hours)
    scheduleDataRefresh(1440);
    
    console.log('Data controller initialized successfully');
  } catch (error) {
    console.error('Error initializing data controller:', error);
    throw error;
  }
}