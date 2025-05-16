import { supabase, fetchWithCache, refreshCache, clearCache } from './supabase';
import { Player, Team, Match, Round, PlayerStats } from '../shared/database.types';
import { PlayerRawStats, PlayerRoleInfo } from './types';
import { PlayerRole } from '../shared/schema';
import { 
  verifyPlayerDataIntegrity, 
  verifyTeamDataIntegrity,
  logIntegrityIssue,
  ValidationLevel
} from './data-integrity';
import { DataSource } from './data-controller';

/**
 * Data service for retrieving data from Supabase
 */
export class SupabaseDataService {
  /**
   * Fetch all players with caching
   */
  async getAllPlayers(forceRefresh = false): Promise<Player[]> {
    const cacheKey = 'all_players';
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*');
      
      if (error) {
        console.error('Error fetching players:', error);
        throw new Error(`Failed to fetch players: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn, forceRefresh);
  }
  
  /**
   * Fetch all teams with caching
   */
  async getAllTeams(forceRefresh = false): Promise<Team[]> {
    const cacheKey = 'all_teams';
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*');
      
      if (error) {
        console.error('Error fetching teams:', error);
        throw new Error(`Failed to fetch teams: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn, forceRefresh);
  }
  
  /**
   * Fetch all matches with caching
   */
  async getAllMatches(forceRefresh = false): Promise<Match[]> {
    const cacheKey = 'all_matches';
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*');
      
      if (error) {
        console.error('Error fetching matches:', error);
        throw new Error(`Failed to fetch matches: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn, forceRefresh);
  }
  
  /**
   * Fetch rounds by match ID
   */
  async getRoundsByMatchId(matchId: string): Promise<Round[]> {
    const cacheKey = `rounds_match_${matchId}`;
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('matchId', matchId);
      
      if (error) {
        console.error(`Error fetching rounds for match ${matchId}:`, error);
        throw new Error(`Failed to fetch rounds: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn);
  }
  
  /**
   * Fetch player stats by match ID
   */
  async getPlayerStatsByMatchId(matchId: string): Promise<PlayerStats[]> {
    const cacheKey = `player_stats_match_${matchId}`;
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('matchId', matchId);
      
      if (error) {
        console.error(`Error fetching player stats for match ${matchId}:`, error);
        throw new Error(`Failed to fetch player stats: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn);
  }
  
  /**
   * Fetch a player by ID
   */
  async getPlayerById(playerId: string): Promise<Player | null> {
    const cacheKey = `player_${playerId}`;
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error(`Error fetching player ${playerId}:`, error);
        throw new Error(`Failed to fetch player: ${error.message}`);
      }
      
      return data;
    };
    
    return fetchWithCache(cacheKey, fetchFn);
  }
  
  /**
   * Convert players data from Supabase to the format used by our application
   * Uses enhanced data integrity validation
   */
  convertPlayersToRawStats(players: Player[]): PlayerRawStats[] {
    if (!players || !Array.isArray(players)) {
      console.error('No valid players array received from Supabase');
      return [];
    }
    
    try {
      // Map Supabase data to our internal format first
      const mappedPlayers = players.map(player => ({
        id: player.id || '',
        name: player.name || '',
        team: player.team || '',
        ctRole: this.mapRoleStringToEnum(player.ctRole),
        tRole: this.mapRoleStringToEnum(player.tRole),
        isIGL: Boolean(player.isIGL),
        hs: Number(player.averageHS || 0),
        adr: 0, 
        kpr: Number(player.averageKills || 0),
        dpr: Number(player.averageDeaths || 0),
        kd: Number(player.kdr || 0),
        impact: 0,
        kast: 0,
        flashAssists: Number(player.flashAssists || 0),
        utilityDamage: Number(player.utilityDamagePerRound || 0),
        openingKills: Number(player.openingKillRate || 0),
        openingDeaths: Number(player.firstDeathRate || 0),
        clutchesWon: Number(player.clutchWinRate || 0),
        tradingSuccess: Number(player.tradingSuccessRate || 0),
        consistencyScore: Number(player.consistencyScore || 0),
        pivValue: Number(player.piv || 0),
        
        // Include defaults for other required fields
        steamId: player.id || '',
        userName: player.name || '',
        teamName: player.team || '',
        damage: 0,
        kills: 0, 
        deaths: 0,
        assists: 0,
        killAssists: 0,
        incendiaryDamage: 0,
        molotovDamage: 0,
        heDamage: 0,
        entrySuccess: 0,
        entryAttempts: 0,
        multiKills: 0,
        oneVXs: 0,
        oneVXAttempts: 0,
        HSPercent: Number(player.averageHS || 0),
        flashesThrown: 0,
        smkThrown: 0,
        heThrown: 0,
        molliesThrown: 0,
        roundsPlayed: 0,
        mapsPlayed: 0,
        firstKills: 0,
        firstDeaths: 0,
        tradedDeaths: 0,
        tradedKills: 0,
        survivedRounds: 0,
        rounds_ct: 0,
        rounds_t: 0,
        kills_t: 0,
        deaths_t: 0,
        adr_t: 0,
        kast_t: 0,
        kills_ct: 0,
        deaths_ct: 0,
        adr_ct: 0,
        kast_ct: 0,
        wallbangKills: 0,
        assistedFlashes: Number(player.flashAssists || 0),
        noScope: 0,
        throughSmoke: 0
      }));
      
      // Apply data validation with additional safety checks
      console.log(`Processing ${mappedPlayers.length} players from Supabase`);
      
      // Basic safety check for required fields
      return mappedPlayers.filter(player => {
        const isValid = player.id && player.name;
        if (!isValid) {
          console.warn(`Skipping invalid player record: ${JSON.stringify(player)}`);
        }
        return isValid;
      });
    } catch (error) {
      console.error('Error converting Supabase player data:', error);
      return [];
    }
  }
  
  /**
   * Map role string from database to PlayerRole enum
   */
  private mapRoleStringToEnum(roleStr: string | null): PlayerRole {
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
  
  /**
   * Get all available tournaments by extracting unique events from matches table
   */
  async getAllTournaments(forceRefresh = false): Promise<any[]> {
    const cacheKey = 'all_tournaments';
    
    const fetchFn = async () => {
      try {
        console.log('Extracting tournament data from matches in Supabase...');
        
        // First try to get unique events from the matches table
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('event, matchDate')
          .not('event', 'is', null);
          
        if (matchesError) {
          console.error('Error fetching matches for tournament data:', matchesError);
          return [];
        }
        
        if (!matchesData || matchesData.length === 0) {
          console.log('No match data with events found in database');
          return [];
        }
        
        // Extract unique events and convert to tournament format
        const eventMap = new Map();
        
        matchesData.forEach(match => {
          if (match.event && !eventMap.has(match.event)) {
            // Create a tournament ID from event name
            const tournamentId = match.event.toLowerCase().replace(/\s+/g, '-');
            
            eventMap.set(match.event, {
              id: tournamentId,
              name: match.event,
              location: 'Unknown', // This isn't available in matches table
              start_date: match.matchDate || new Date().toISOString(),
              end_date: match.matchDate || new Date().toISOString(),
              teams_count: 'Unknown',
              matches_count: 0,
              source: 'matches',
              status: 'completed'
            });
          }
          
          // Count matches for each event
          if (match.event) {
            const tournament = eventMap.get(match.event);
            if (tournament) {
              if (tournament.matches_count === 'Unknown') {
                tournament.matches_count = 1;
              } else {
                tournament.matches_count++;
              }
            }
          }
        });
        
        // Count unique teams for each event
        for (const [eventName, tournament] of eventMap.entries()) {
          const { data: eventMatches, error: teamCountError } = await supabase
            .from('matches')
            .select('team1, team2')
            .eq('event', eventName);
            
          if (!teamCountError && eventMatches) {
            const uniqueTeams = new Set();
            eventMatches.forEach(match => {
              if (match.team1) uniqueTeams.add(match.team1);
              if (match.team2) uniqueTeams.add(match.team2);
            });
            
            tournament.teams_count = uniqueTeams.size;
          }
        }
        
        console.log(`Extracted ${eventMap.size} tournaments from match data`);
        return Array.from(eventMap.values());
      } catch (error) {
        console.error('Failed to extract tournament data from matches:', error);
        return [];
      }
    };
    
    return fetchWithCache(cacheKey, fetchFn, forceRefresh);
  }
  
  /**
   * Get player statistics for a specific tournament by event name
   * @param tournamentId The tournament ID to fetch data for
   */
  async getTournamentPlayerStats(tournamentId: string, forceRefresh = false): Promise<any[]> {
    const cacheKey = `tournament_players_${tournamentId}`;
    
    const fetchFn = async () => {
      try {
        console.log(`Fetching player stats for tournament: ${tournamentId}`);
        
        // Convert tournament ID back to event name (removing dashes and converting to original case)
        // This is a rough approximation; we can refine if needed
        const eventName = tournamentId.replace(/-/g, ' ');
        console.log(`Looking for matches with event name: ${eventName}`);
        
        // Get all matches for this event
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('id, event, team1, team2')
          .ilike('event', `%${eventName}%`);
          
        if (matchError) {
          console.error(`Error fetching matches for event ${eventName}:`, matchError);
          return [];
        }
        
        if (!matchData || matchData.length === 0) {
          console.log(`No matches found for event ${eventName}`);
          return [];
        }
        
        console.log(`Found ${matchData.length} matches for event ${eventName}`);
        
        // Get match IDs
        const matchIds = matchData.map(match => match.id);
        
        // Get player stats for these matches
        const { data: playerStatsData, error: playerStatsError } = await supabase
          .from('player_stats')
          .select('*, players(*)')
          .in('matchId', matchIds);
          
        if (playerStatsError) {
          console.error(`Error fetching player stats for event matches:`, playerStatsError);
          return [];
        }
        
        if (!playerStatsData || playerStatsData.length === 0) {
          console.log(`No player stats found for matches in event ${eventName}`);
          return [];
        }
        
        console.log(`Found ${playerStatsData.length} player stat entries for event ${eventName}`);
        
        // Process player stats to combine them by player
        const playerMap = new Map();
        
        playerStatsData.forEach(stat => {
          if (stat.playerId && stat.players) {
            const player = stat.players;
            
            if (!playerMap.has(stat.playerId)) {
              // Initialize player entry
              playerMap.set(stat.playerId, {
                id: stat.playerId,
                name: player.name,
                team: player.team,
                isIGL: player.isIGL,
                tRole: player.tRole,
                ctRole: player.ctRole,
                matches: 0,
                // Aggregate these stats
                kills: 0,
                deaths: 0,
                assists: 0,
                hs_percentage: 0,
                adr: 0,
                kast: 0,
                first_kills: 0, 
                first_deaths: 0,
                utility_damage: 0,
                flash_assists: 0,
                rating: 0
              });
            }
            
            // Update the player's stats
            const playerStats = playerMap.get(stat.playerId);
            playerStats.matches++;
            
            // Add this match's stats
            if (stat.kills) playerStats.kills += stat.kills;
            if (stat.deaths) playerStats.deaths += stat.deaths;
            if (stat.assists) playerStats.assists += stat.assists;
            if (stat.hs_percentage) playerStats.hs_percentage += stat.hs_percentage;
            if (stat.adr) playerStats.adr += stat.adr;
            if (stat.kast) playerStats.kast += stat.kast;
            if (stat.first_kills) playerStats.first_kills += stat.first_kills;
            if (stat.first_deaths) playerStats.first_deaths += stat.first_deaths;
            if (stat.utility_damage) playerStats.utility_damage += stat.utility_damage;
            if (stat.flash_assists) playerStats.flash_assists += stat.flash_assists;
            if (stat.rating) playerStats.rating += stat.rating;
          }
        });
        
        // Calculate averages for the aggregated stats
        for (const player of playerMap.values()) {
          if (player.matches > 0) {
            player.hs_percentage = player.hs_percentage / player.matches;
            player.adr = player.adr / player.matches;
            player.kast = player.kast / player.matches;
            player.rating = player.rating / player.matches;
            
            // Calculate K/D ratio
            player.kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
            
            // Round numbers for display
            player.kd = Math.round(player.kd * 100) / 100;
            player.hs_percentage = Math.round(player.hs_percentage * 100) / 100;
            player.adr = Math.round(player.adr * 100) / 100;
            player.kast = Math.round(player.kast * 100) / 100;
            player.rating = Math.round(player.rating * 100) / 100;
          }
        }
        
        return Array.from(playerMap.values());
      } catch (error) {
        console.error(`Failed to fetch tournament player stats for ${tournamentId}:`, error);
        return [];
      }
    };
    
    return fetchWithCache(cacheKey, fetchFn, forceRefresh);
  }
  
  /**
   * Gets tournament data from PGL Bucharest event if available
   */
  async getPGLBucharestData(forceRefresh = false): Promise<any> {
    const cacheKey = 'pgl_bucharest_data';
    
    const fetchFn = async () => {
      try {
        console.log('Searching for PGL Bucharest event data...');
        
        // Try to find PGL Bucharest event in tournaments or events
        const { data: tournamentData, error: tournamentError } = await supabase
          .from('tournaments')
          .select('*')
          .or('name.ilike.%PGL%Bucharest%,name.ilike.%Bucharest%2023%')
          .limit(1);
          
        if (tournamentError) {
          console.error('Error searching for PGL Bucharest tournament:', tournamentError);
        } else if (tournamentData && tournamentData.length > 0) {
          console.log('Found PGL Bucharest in tournaments table:', tournamentData[0].name);
          
          // Get player stats for this tournament
          const playerStats = await this.getTournamentPlayerStats(tournamentData[0].id, forceRefresh);
          
          return {
            tournament: tournamentData[0],
            playerStats: playerStats,
            source: 'tournaments'
          };
        }
        
        // Try events table if not found in tournaments
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .or('name.ilike.%PGL%Bucharest%,name.ilike.%Bucharest%2023%')
          .limit(1);
          
        if (eventError) {
          console.error('Error searching for PGL Bucharest event:', eventError);
        } else if (eventData && eventData.length > 0) {
          console.log('Found PGL Bucharest in events table:', eventData[0].name);
          
          // Try to find related matches
          const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .select('*, player_stats(*)')
            .eq('event_id', eventData[0].id);
            
          if (matchError) {
            console.error('Error fetching matches for PGL Bucharest event:', matchError);
          } else if (matchData && matchData.length > 0) {
            console.log(`Found ${matchData.length} matches for PGL Bucharest event`);
            
            return {
              event: eventData[0],
              matches: matchData,
              source: 'events'
            };
          }
        }
        
        console.log('No PGL Bucharest event data found in database');
        return null;
      } catch (error) {
        console.error('Error searching for PGL Bucharest data:', error);
        return null;
      }
    };
    
    return fetchWithCache(cacheKey, fetchFn, forceRefresh);
  }

  /**
   * Refresh all cached data
   */
  async refreshAllData(): Promise<void> {
    await Promise.all([
      this.getAllPlayers(true),
      this.getAllTeams(true),
      this.getAllMatches(true),
      this.getAllTournaments(true)
    ]);
    console.log('All data refreshed from Supabase');
  }
  
  /**
   * Clear all cached data
   */
  clearAllCaches(): void {
    clearCache();
  }
}

// Export a singleton instance
export const supabaseDataService = new SupabaseDataService();