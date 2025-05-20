import { PlayerRole, PlayerRawStats } from '../shared/schema';

/**
 * Enhanced player role mapping function to handle roles as they appear in the Supabase database
 * Handles null values, different case variations, and custom role names
 */
export function mapDatabaseRole(roleStr: string | null | undefined): PlayerRole {
  if (!roleStr) return PlayerRole.Support;
  
  const normalizedRole = roleStr.toUpperCase().trim();
  
  switch (normalizedRole) {
    case 'IGL':
    case 'IN-GAME LEADER':
    case 'LEADER':
      return PlayerRole.IGL;
      
    case 'AWP':
    case 'AWPER':
    case 'SNIPER':
    case 'MAIN AWPER':
      return PlayerRole.AWP;
      
    case 'ENTRY':
    case 'ENTRY FRAGGER':
    case 'ENTRYFRAGGER':
      return PlayerRole.Entry;
      
    case 'LURK':
    case 'LURKER':
      return PlayerRole.Lurker;
      
    case 'SUPPORT':
    case 'RIFLER':
    case 'RIFLE':
    default:
      return PlayerRole.Support;
  }
}

/**
 * Safe way to determine if a player is an IGL from database values
 */
export function isIGLFromDatabase(roleStr: string | null | undefined, isIGLFlag: boolean | null | undefined): boolean {
  // If there's an explicit is_igl flag, use it
  if (isIGLFlag === true) return true;
  
  // Check if role string explicitly mentions IGL
  if (roleStr && (
    roleStr.toUpperCase().includes('IGL') || 
    roleStr.toUpperCase().includes('LEADER')
  )) {
    return true;
  }
  
  return false;
}

/**
 * Helper to fix team name processing, ensuring consistent team names
 */
export function normalizeTeamName(teamName: string | null | undefined): string {
  if (!teamName) return "Unknown Team";
  
  return teamName.trim();
}

/**
 * Create a safe player object by ensuring all required fields have default values
 */
export function createSafePlayerObject(rawPlayer: any): PlayerRawStats {
  return {
    steamId: rawPlayer.steam_id || "",
    playerName: rawPlayer.user_name || "",
    team_id: 0,
    teamName: normalizeTeamName(rawPlayer.team_clan_name),
    
    // Set default values for all required fields
    kills: rawPlayer.kills || 0,
    deaths: rawPlayer.deaths || 0,
    assists: rawPlayer.assists || 0,
    adr: 0,
    kast: 0,
    rating: 1.0,
    impact: 0,
    ct_rating: 1.0,
    t_rating: 1.0,
    total_rounds: 30,
    ct_rounds: 15,
    t_rounds: 15,
    awp_kills: 0,
    opening_kills: rawPlayer.first_kills || 0,
    opening_deaths: rawPlayer.first_deaths || 0,
    opening_attempts: (rawPlayer.first_kills || 0) + (rawPlayer.first_deaths || 0),
    opening_success: rawPlayer.first_kills || 0,
    flash_assists: rawPlayer.assisted_flashes || 0,
    utility_damage: 0,
    utility_damage_round: 0,
    headshot_percent: rawPlayer.headshots ? (rawPlayer.headshots / Math.max(1, rawPlayer.kills)) * 100 : 0,
    success_in_opening: (rawPlayer.first_kills || 0) > 0 
      ? (rawPlayer.first_kills || 0) / Math.max(1, (rawPlayer.first_kills || 0) + (rawPlayer.first_deaths || 0)) 
      : 0,
    clutches_attempted: 0,
    clutches_won: 0,
    kpr: rawPlayer.kills ? rawPlayer.kills / 30 : 0,
    dpr: rawPlayer.deaths ? rawPlayer.deaths / 30 : 0,
    k_diff: (rawPlayer.kills || 0) - (rawPlayer.deaths || 0),
    kd_diff: rawPlayer.kd || ((rawPlayer.kills || 0) / Math.max(1, (rawPlayer.deaths || 1))),
    rounds_survived: 30 - (rawPlayer.deaths || 0),
    rounds_with_kills: 0,
    rounds_with_assists: 0,
    rounds_with_deaths: rawPlayer.deaths || 0,
    damage: 0,
    rounds_with_kast: 0,
    eventId: 1
  };
}