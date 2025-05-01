/**
 * API utilities for advanced metrics endpoints
 * This consumes the Flask-based Python API
 */

/**
 * Fetch all players with option to filter fields
 * @param fields Optional comma-separated list of fields to return
 * @returns Promise with player data
 */
export async function getPlayers(fields?: string): Promise<any[]> {
  const url = fields ? `/api/players?fields=${fields}` : '/api/players';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error fetching players: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetch a single player by ID (steamId)
 * @param id Player's steam ID
 * @returns Promise with player data
 */
export async function getPlayerCard(id: string): Promise<any> {
  const res = await fetch(`/api/player/${id}`);
  if (!res.ok) {
    throw new Error(`Error fetching player ${id}: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Calculate synergy between multiple players
 * @param ids Array of player IDs (steamId)
 * @returns Promise with synergy matrix data
 */
export async function getSynergy(ids: string[]): Promise<any> {
  const res = await fetch("/api/lineup/synergy", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ids})
  });
  
  if (!res.ok) {
    throw new Error(`Error calculating synergy: ${res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Fetch all teams
 * @param fields Optional comma-separated list of fields to return
 * @returns Promise with team data
 */
export async function getTeams(fields?: string): Promise<any[]> {
  const url = fields ? `/api/teams?fields=${fields}` : '/api/teams';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error fetching teams: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetch a single team by name
 * @param name Team name
 * @returns Promise with team data
 */
export async function getTeam(name: string): Promise<any> {
  const res = await fetch(`/api/team/${encodeURIComponent(name)}`);
  if (!res.ok) {
    throw new Error(`Error fetching team ${name}: ${res.statusText}`);
  }
  return await res.json();
}
