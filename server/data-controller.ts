import { loadPlayerData } from './csvParser';
import { loadNewPlayerStats } from './newDataParser';
import { supabaseDataService } from './supabase-data-service';
import { PlayerRawStats } from './types';

// Data source enum
export enum DataSource {
  CSV = 'csv',
  SUPABASE = 'supabase',
  HYBRID = 'hybrid' // Uses Supabase for teams and CSV for player statistics
}

// Current data source - set to hybrid mode
export let CURRENT_DATA_SOURCE = DataSource.HYBRID;

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
  if (CURRENT_DATA_SOURCE === DataSource.CSV || CURRENT_DATA_SOURCE === DataSource.HYBRID) {
    try {
      // Try to use the newer data parser first
      const csvPlayers = await loadNewPlayerStats();
      
      if (CURRENT_DATA_SOURCE === DataSource.HYBRID) {
        // In hybrid mode, we supplement with Supabase team data
        try {
          // Get team data from Supabase
          const teams = await supabaseDataService.getAllTeams();
          
          // Match players with their correct teams
          return csvPlayers.map(player => {
            // Try to find a matching team in Supabase
            const matchingTeam = teams.find(team => {
              const teamName = team.name?.toLowerCase() || '';
              return (
                teamName === player.teamName?.toLowerCase() ||
                // Try alternative matching in case CSV team name format differs
                team.id?.toString() === player.teamName
              );
            });
            
            if (matchingTeam && matchingTeam.name) {
              // Use the correct team name from Supabase
              return {
                ...player,
                teamName: matchingTeam.name,
                team: matchingTeam.name
              };
            }
            
            return player;
          });
        } catch (error) {
          console.error('Error enriching CSV data with Supabase team data:', error);
          // If Supabase team mapping fails, just return the CSV data
          return csvPlayers;
        }
      }
      
      return csvPlayers;
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
  
  if (CURRENT_DATA_SOURCE === DataSource.HYBRID) {
    // HYBRID MODE: Get teams from Supabase but enrich with CSV player data
    try {
      // First, get teams from Supabase
      const supabaseTeams = await supabaseDataService.getAllTeams();
      console.log(`Retrieved ${supabaseTeams.length} teams from Supabase`);
      
      // Then, get player data from CSV
      const csvPlayers = await loadNewPlayerStats();
      console.log(`Loaded ${csvPlayers.length} players from CSV for team enrichment`);
      
      // For each team, find and attach its players from CSV
      const enhancedTeams = supabaseTeams.map(team => {
        // Find players that belong to this team
        const teamPlayers = csvPlayers.filter(player => {
          const playerTeam = player.teamName?.toLowerCase() || '';
          const teamName = team.name?.toLowerCase() || '';
          
          return (
            playerTeam === teamName ||
            // Alternative matching methods
            playerTeam.includes(teamName) ||
            teamName.includes(playerTeam) ||
            player.team?.toLowerCase() === teamName
          );
        });
        
        // Calculate team metrics from player data
        let sumPIV = 0;
        let topPlayerName = '';
        let topPlayerPIV = 0;
        
        const formattedPlayers = teamPlayers.map(player => {
          const piv = player.pivValue || 0;
          
          // Track highest PIV player
          if (piv > topPlayerPIV) {
            topPlayerPIV = piv;
            topPlayerName = player.userName;
          }
          
          sumPIV += piv;
          
          // Return player in the expected format
          return {
            id: player.steamId,
            name: player.userName,
            team: team.name,
            role: player.tRole || player.ctRole || 'Support', 
            piv: piv,
            ctPIV: 0, // Will calculate these later if needed
            tPIV: 0,
            kd: player.kd || 1.0,
            primaryMetric: {
              name: 'PIV',
              value: piv
            },
            rawStats: player,
            metrics: {
              rcs: { value: 0, metrics: {} },
              icf: { value: 0, sigma: 0 },
              sc: { value: 0, metric: '' },
              osm: 1,
              piv: piv,
              side: 'Overall'
            }
          };
        });
        
        // Calculate average PIV
        const avgPIV = teamPlayers.length > 0 ? sumPIV / teamPlayers.length : 0;
        
        // Calculate team synergy - simple version based on role distribution
        const roleCount = {};
        teamPlayers.forEach(player => {
          const role = player.role || player.tRole || player.ctRole || 'Unknown';
          roleCount[role] = (roleCount[role] || 0) + 1;
        });
        
        // Calculate role balance (more diverse roles = higher synergy)
        const synergy = Object.keys(roleCount).length > 0 ? 
          Math.min(Object.keys(roleCount).length / 5, 1) * 0.8 : 0;
        
        // Calculate TIR based on PIV and synergy
        const tir = sumPIV * (1 + synergy * 0.2);
        
        // Return enriched team
        return {
          ...team,
          tir: tir, 
          sumPIV: sumPIV,
          synergy: synergy,
          avgPIV: avgPIV,
          topPlayer: {
            name: topPlayerName || 'Unknown',
            piv: topPlayerPIV
          },
          players: formattedPlayers
        };
      });
      
      return enhancedTeams;
    } catch (error) {
      console.error('Error in hybrid team data processing:', error);
      // Fall back to regular Supabase teams
      try {
        return await supabaseDataService.getAllTeams();
      } catch (e) {
        console.error('Fallback to Supabase also failed:', e);
        return [];
      }
    }
  } else if (CURRENT_DATA_SOURCE === DataSource.CSV) {
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
    // For hybrid or Supabase mode, we need to refresh Supabase data
    if (CURRENT_DATA_SOURCE === DataSource.SUPABASE || CURRENT_DATA_SOURCE === DataSource.HYBRID) {
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