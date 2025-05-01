/**
 * API Manager for CS2 Analytics
 * This module decides which API to use (Node.js or Python) based on availability
 */

import * as nodeApi from './api';
import * as pythonApi from './pythonApi';

// Track Python API availability
let pythonApiAvailable = false;

// Check Python API availability on module load
pythonApi.isPythonApiAvailable().then(available => {
  pythonApiAvailable = available;
  console.log(`Python API is ${available ? 'available' : 'unavailable'}`);
});

/**
 * Fetch all players with option to filter fields
 * @param fields Optional comma-separated list of fields to return
 * @returns Promise with player data
 */
export async function getPlayers(fields?: string): Promise<any[]> {
  // Try Python API first if available (has more advanced metrics)
  if (pythonApiAvailable) {
    try {
      const pythonData = await pythonApi.getPythonPlayers(fields);
      if (pythonData && pythonData.length > 0) {
        return pythonData;
      }
    } catch (error) {
      console.warn('Error using Python API, falling back to Node.js API:', error);
      pythonApiAvailable = false; // Mark as unavailable for future calls
    }
  }
  
  // Fall back to Node.js API
  return nodeApi.getPlayers(fields);
}

/**
 * Fetch a single player by ID (steamId)
 * @param id Player's steam ID
 * @returns Promise with player data
 */
export async function getPlayerCard(id: string): Promise<any> {
  // Try Python API first if available (has more advanced metrics)
  if (pythonApiAvailable) {
    try {
      const pythonData = await pythonApi.getPythonPlayerCard(id);
      if (pythonData) {
        return pythonData;
      }
    } catch (error) {
      console.warn('Error using Python API, falling back to Node.js API:', error);
      pythonApiAvailable = false; // Mark as unavailable for future calls
    }
  }
  
  // Fall back to Node.js API
  return nodeApi.getPlayerCard(id);
}

/**
 * Calculate synergy between multiple players
 * @param ids Array of player IDs (steamId)
 * @returns Promise with synergy matrix data
 */
export async function getSynergy(ids: string[]): Promise<any> {
  // Try Python API first if available (has more advanced metrics)
  if (pythonApiAvailable) {
    try {
      const pythonData = await pythonApi.getPythonSynergy(ids);
      if (pythonData && !pythonData.error) {
        return pythonData;
      }
    } catch (error) {
      console.warn('Error using Python API, falling back to Node.js API:', error);
      pythonApiAvailable = false; // Mark as unavailable for future calls
    }
  }
  
  // Fall back to Node.js API
  return nodeApi.getSynergy(ids);
}

/**
 * Fetch all teams
 * @param fields Optional comma-separated list of fields to return
 * @returns Promise with team data
 */
export async function getTeams(fields?: string): Promise<any[]> {
  // Try Python API first if available (has more advanced metrics)
  if (pythonApiAvailable) {
    try {
      const pythonData = await pythonApi.getPythonTeams(fields);
      if (pythonData && pythonData.length > 0) {
        return pythonData;
      }
    } catch (error) {
      console.warn('Error using Python API, falling back to Node.js API:', error);
      pythonApiAvailable = false; // Mark as unavailable for future calls
    }
  }
  
  // Fall back to Node.js API
  return nodeApi.getTeams(fields);
}

/**
 * Fetch a single team by name
 * @param name Team name
 * @returns Promise with team data
 */
export async function getTeam(name: string): Promise<any> {
  // Try Python API first if available (has more advanced metrics)
  if (pythonApiAvailable) {
    try {
      const pythonData = await pythonApi.getPythonTeam(name);
      if (pythonData) {
        return pythonData;
      }
    } catch (error) {
      console.warn('Error using Python API, falling back to Node.js API:', error);
      pythonApiAvailable = false; // Mark as unavailable for future calls
    }
  }
  
  // Fall back to Node.js API
  return nodeApi.getTeam(name);
}

/**
 * Check if Python API is available (for UI indicators)
 * @returns Boolean indicating if Python advanced metrics are available
 */
export function isPythonApiAvailable(): boolean {
  return pythonApiAvailable;
}

/**
 * Force a check of Python API availability
 * @returns Promise resolving to boolean indicating availability
 */
export async function checkPythonApiAvailability(): Promise<boolean> {
  pythonApiAvailable = await pythonApi.isPythonApiAvailable();
  return pythonApiAvailable;
}
