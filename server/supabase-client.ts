import { createClient } from '@supabase/supabase-js';
import { PlayerWithPIV, TeamWithTIR, PlayerRole } from '../shared/schema';

// Supabase configuration
const supabaseUrl = 'https://rrtfmkpqembrnieogqmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydGZta3BxZW1icm5pZW9ncW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzU3NTgsImV4cCI6MjA2MDg1MTc1OH0.vGYFngVJawK0xPzKHX-HbIxwaswluZ65N89KXrZHilQ';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Store data in memory for caching purposes
const cache = {
  players: null as PlayerWithPIV[] | null,
  teams: null as TeamWithTIR[] | null,
  lastFetched: {
    players: 0,
    teams: 0
  }
};

// Cache expiry time (1 hour)
const CACHE_EXPIRY = 60 * 60 * 1000;

/**
 * Fetch players from Supabase
 */
export async function fetchPlayers(forceRefresh: boolean = false): Promise<PlayerWithPIV[]> {
  // Return cached data if available and not expired
  const now = Date.now();
  if (
    !forceRefresh && 
    cache.players && 
    now - cache.lastFetched.players < CACHE_EXPIRY
  ) {
    console.log('Using cached player data');
    return cache.players;
  }

  console.log('Fetching players from Supabase...');
  try {
    // Fetch players from Supabase
    const { data, error } = await supabase
      .from('players')
      .select('*');
    
    if (error) throw error;
    
    // Convert Supabase format to our application format
    const players: PlayerWithPIV[] = data.map(player => ({
      id: player.id,
      name: player.name,
      team: player.team || '',
      role: mapRoleString(player.tRole || 'Support'),
      tRole: mapRoleString(player.tRole || 'Support'),
      ctRole: mapRoleString(player.ctRole || 'Support'),
      isIGL: player.isIGL || false,
      piv: player.piv || 0,
      ctPIV: 0, // Will be calculated later
      tPIV: 0, // Will be calculated later
      kd: player.kdr || 1.0,
      primaryMetric: {
        name: 'PIV',
        value: player.piv || 0
      },
      rawStats: {
        id: player.id,
        name: player.name,
        steamId: player.id,
        userName: player.name,
        teamName: player.team || '',
        kills: player.averageKills || 0,
        deaths: player.averageDeaths || 0,
        kd: player.kdr || 1.0,
        headshots: player.averageHS || 0,
        // ... other properties needed for PlayerRawStats
      },
      metrics: {
        rcs: { value: 0, metrics: {} },
        icf: { value: 0, sigma: 0 },
        sc: { value: 0, metric: '' },
        osm: 1,
        piv: player.piv || 0,
        side: 'Overall'
      }
    }));
    
    // Update cache
    cache.players = players;
    cache.lastFetched.players = now;
    
    return players;
    
  } catch (error) {
    console.error('Error fetching players from Supabase:', error);
    throw error;
  }
}

/**
 * Fetch teams from Supabase
 */
export async function fetchTeams(forceRefresh: boolean = false): Promise<TeamWithTIR[]> {
  // Return cached data if available and not expired
  const now = Date.now();
  if (
    !forceRefresh && 
    cache.teams && 
    now - cache.lastFetched.teams < CACHE_EXPIRY
  ) {
    console.log('Using cached team data');
    return cache.teams;
  }

  console.log('Fetching teams from Supabase...');
  try {
    // Fetch teams from Supabase
    const { data, error } = await supabase
      .from('teams')
      .select('*');
    
    if (error) throw error;
    
    // First fetch players to associate with teams
    const players = await fetchPlayers(forceRefresh);
    
    // Convert Supabase format to our application format
    const teams: TeamWithTIR[] = data.map(team => {
      // Get players for this team
      const teamPlayers = players.filter(p => p.team === team.id);
      
      return {
        id: team.id,
        name: team.name,
        tir: team.tir || 0,
        sumPIV: teamPlayers.reduce((sum, p) => sum + p.piv, 0),
        synergy: 0, // Calculate synergy factor
        avgPIV: teamPlayers.length > 0 ? teamPlayers.reduce((sum, p) => sum + p.piv, 0) / teamPlayers.length : 0,
        topPlayer: teamPlayers.length > 0 
          ? { name: teamPlayers.sort((a, b) => b.piv - a.piv)[0].name, piv: teamPlayers.sort((a, b) => b.piv - a.piv)[0].piv }
          : { name: 'Unknown', piv: 0 },
        players: teamPlayers
      };
    });
    
    // Update cache
    cache.teams = teams;
    cache.lastFetched.teams = now;
    
    return teams;
    
  } catch (error) {
    console.error('Error fetching teams from Supabase:', error);
    throw error;
  }
}

/**
 * Refresh all cached data
 */
export async function refreshAllData(): Promise<void> {
  console.log('Refreshing all data from Supabase...');
  try {
    await Promise.all([
      fetchPlayers(true),
      fetchTeams(true)
    ]);
    console.log('All data refreshed successfully');
  } catch (error) {
    console.error('Error refreshing data:', error);
    throw error;
  }
}

/**
 * Map role string to PlayerRole enum
 */
function mapRoleString(roleStr: string): PlayerRole {
  if (!roleStr) return PlayerRole.Support;
  
  switch (roleStr.toLowerCase()) {
    case 'awp':
    case 'awper':
      return PlayerRole.AWP;
    case 'entry':
    case 'spacetaker':
      return PlayerRole.Spacetaker;
    case 'igl':
      return PlayerRole.IGL;
    case 'lurker':
      return PlayerRole.Lurker;
    case 'anchor':
      return PlayerRole.Anchor;
    case 'rotator':
      return PlayerRole.Rotator;
    case 'support':
    default:
      return PlayerRole.Support;
  }
}