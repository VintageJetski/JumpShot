/**
 * Python API utilities for advanced metrics endpoints
 * This module consumes the Flask-based Python API
 */

// Base URL for the Python API
const PYTHON_API_BASE_URL = 'http://localhost:5001/api';

/**
 * Fetch all players with option to filter fields
 * @param fields Optional comma-separated list of fields to return
 * @returns Promise with player data
 */
export async function getPythonPlayers(fields?: string): Promise<any[]> {
  try {
    const url = fields
      ? `${PYTHON_API_BASE_URL}/players?fields=${fields}`
      : `${PYTHON_API_BASE_URL}/players`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch players: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching players from Python API:', error);
    return [];
  }
}

/**
 * Fetch a single player by ID (steamId)
 * @param id Player's steam ID
 * @returns Promise with player data
 */
export async function getPythonPlayerCard(id: string): Promise<any> {
  try {
    const response = await fetch(`${PYTHON_API_BASE_URL}/player/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch player: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching player from Python API:', error);
    return null;
  }
}

/**
 * Calculate synergy between multiple players
 * @param ids Array of player IDs (steamId)
 * @returns Promise with synergy matrix data
 */
export async function getPythonSynergy(ids: string[]): Promise<any> {
  try {
    const response = await fetch(`${PYTHON_API_BASE_URL}/lineup/synergy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerIds: ids }),
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate synergy: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calculating synergy from Python API:', error);
    return { error: 'Failed to calculate synergy' };
  }
}

/**
 * Fetch all teams
 * @param fields Optional comma-separated list of fields to return
 * @returns Promise with team data
 */
export async function getPythonTeams(fields?: string): Promise<any[]> {
  try {
    const url = fields
      ? `${PYTHON_API_BASE_URL}/teams?fields=${fields}`
      : `${PYTHON_API_BASE_URL}/teams`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching teams from Python API:', error);
    return [];
  }
}

/**
 * Fetch a single team by name
 * @param name Team name
 * @returns Promise with team data
 */
export async function getPythonTeam(name: string): Promise<any> {
  try {
    const response = await fetch(`${PYTHON_API_BASE_URL}/team/${name}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch team: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team from Python API:', error);
    return null;
  }
}

/**
 * Utility function to check if the Python API is available
 * @returns Promise<boolean> True if the API is available
 */
export async function isPythonApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_API_BASE_URL}/players`, { 
      method: 'HEAD',
      // 1 second timeout
      signal: AbortSignal.timeout(1000) 
    });
    return response.ok;
  } catch (error) {
    console.log('Python API not available:', error);
    return false;
  }
}
