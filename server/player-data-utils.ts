import { PlayerRole, PlayerRawStats } from '../shared/schema';

/**
 * Safe function to normalize playerName from database 
 * with fallback if the name is undefined
 */
export function normalizePlayerName(playerName: string | null | undefined): string {
  if (!playerName) return "Unknown Player";
  return playerName.trim();
}

/**
 * Map a role string from the database to our PlayerRole enum
 */
export function mapPlayerRole(roleStr: string | null | undefined): PlayerRole {
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
 * Safely check if a player is an IGL based on database fields
 */
export function isPlayerIGL(roleStr: string | null | undefined, isIGLFlag: boolean | null | undefined): boolean {
  // Explicit flag takes precedence
  if (isIGLFlag === true) return true;
  
  // Check role string for IGL mention
  if (roleStr && roleStr.toUpperCase().includes('IGL')) {
    return true;
  }
  
  return false;
}

/**
 * Safely process player data from any source (CSV or database)
 * to ensure consistent data format
 */
export function processPlayerData(rawData: any): PlayerRawStats {
  // Extract fields with safe defaults
  const steamId = rawData.steam_id || rawData.steamId || "";
  const playerName = normalizePlayerName(rawData.user_name || rawData.playerName);
  const teamName = normalizePlayerName(rawData.team_clan_name || rawData.teamName);
  const team_id = rawData.team_id || 0;
  
  // Basic stats
  const kills = rawData.kills || 0;
  const deaths = rawData.deaths || 0;
  const assists = rawData.assists || 0;
  
  // Determine total rounds
  const totalRounds = rawData.total_rounds || rawData.total_rounds_won ? rawData.total_rounds_won * 2 : 30;
  const ctRounds = rawData.ct_rounds || rawData.ct_rounds_won || Math.floor(totalRounds / 2);
  const tRounds = rawData.t_rounds || rawData.t_rounds_won || (totalRounds - ctRounds);
  
  // Create player object with all required fields
  return {
    steamId,
    playerName,
    teamName,
    team_id,
    
    // Stats
    kills,
    deaths,
    assists,
    adr: rawData.adr || 0,
    kast: rawData.kast || 0,
    rating: rawData.rating || 1.0,
    impact: rawData.impact || 0,
    ct_rating: rawData.ct_rating || 1.0,
    t_rating: rawData.t_rating || 1.0,
    
    // Rounds
    total_rounds: totalRounds,
    ct_rounds: ctRounds,
    t_rounds: tRounds,
    
    // Weapon stats
    awp_kills: rawData.awp_kills || 0,
    
    // Opening duels
    opening_kills: rawData.first_kills || rawData.opening_kills || 0,
    opening_deaths: rawData.first_deaths || rawData.opening_deaths || 0,
    opening_attempts: rawData.opening_attempts || 
      (rawData.first_kills || 0) + (rawData.first_deaths || 0),
    opening_success: rawData.opening_success || rawData.first_kills || 0,
    
    // Utility
    flash_assists: rawData.assisted_flashes || rawData.flash_assists || 0,
    utility_damage: rawData.utility_damage || 0,
    utility_damage_round: rawData.utility_damage_round || 0,
    
    // Percentages
    headshot_percent: rawData.headshot_percent || 
      (rawData.headshots && rawData.kills ? 
        (rawData.headshots / Math.max(1, rawData.kills)) * 100 : 0),
    success_in_opening: rawData.success_in_opening || 
      ((rawData.first_kills || 0) > 0 
        ? (rawData.first_kills || 0) / Math.max(1, (rawData.first_kills || 0) + (rawData.first_deaths || 0)) 
        : 0),
    
    // Clutches
    clutches_attempted: rawData.clutches_attempted || 0,
    clutches_won: rawData.clutches_won || 0,
    
    // Per round stats
    kpr: rawData.kpr || kills / totalRounds,
    dpr: rawData.dpr || deaths / totalRounds,
    
    // Differentials
    k_diff: rawData.k_diff || kills - deaths,
    kd_diff: rawData.kd_diff || rawData.kd || (kills / Math.max(1, deaths)),
    
    // Round-based stats
    rounds_survived: rawData.rounds_survived || (totalRounds - deaths),
    rounds_with_kills: rawData.rounds_with_kills || 0,
    rounds_with_assists: rawData.rounds_with_assists || 0,
    rounds_with_deaths: rawData.rounds_with_deaths || deaths,
    damage: rawData.damage || 0,
    rounds_with_kast: rawData.rounds_with_kast || 0,
    
    // Event
    eventId: rawData.eventId || rawData.event_id || 1
  };
}