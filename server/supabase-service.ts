import { createClient } from '@supabase/supabase-js';
import type { 
  Player, 
  Team, 
  Event, 
  KillStats, 
  GeneralStats, 
  UtilityStats, 
  PlayerMatchSummary,
  PlayerPerformanceData 
} from '../shared/supabase-types';

class SupabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // Get all events
  async getEvents(): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .order('event_id');
    
    if (error) throw new Error(`Failed to fetch events: ${error.message}`);
    return data || [];
  }

  // Get all teams
  async getTeams(): Promise<Team[]> {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .order('team_clan_name');
    
    if (error) throw new Error(`Failed to fetch teams: ${error.message}`);
    return data || [];
  }

  // Get complete player performance data for PIV calculations
  async getPlayerPerformanceData(eventId?: number): Promise<PlayerPerformanceData[]> {
    try {
      // Build the query with all necessary joins
      let query = this.supabase
        .from('players')
        .select(`
          steam_id,
          user_name,
          general_stats!inner (
            steam_id,
            event_id,
            assists,
            deaths,
            trade_kills,
            trade_deaths,
            kd,
            k_d_diff,
            adr_total,
            adr_ct_side,
            adr_t_side,
            kast_total,
            kast_ct_side,
            kast_t_side,
            total_rounds_won,
            t_rounds_won,
            ct_rounds_won
          ),
          kill_stats!inner (
            steam_id,
            event_id,
            kills,
            headshots,
            wallbang_kills,
            no_scope,
            through_smoke,
            airbone_kills,
            blind_kills,
            victim_blind_kills,
            awp_kills,
            pistol_kills,
            first_kills,
            ct_first_kills,
            t_first_kills,
            first_deaths,
            ct_first_deaths,
            t_first_deaths
          ),
          utility_stats!inner (
            steam_id,
            event_id,
            assisted_flashes,
            flahes_thrown,
            ct_flahes_thrown,
            t_flahes_thrown,
            flahes_thrown_in_pistol_round,
            he_thrown,
            ct_he_thrown,
            t_he_thrown,
            he_thrown_in_pistol_round,
            infernos_thrown,
            ct_infernos_thrown,
            t_infernos_thrown,
            infernos_thrown_in_pistol_round,
            smokes_thrown,
            ct_smokes_thrown,
            t_smokes_thrown,
            smokes_thrown_in_pistol_round,
            util_in_pistol_round,
            total_util_thrown,
            total_util_dmg,
            ct_total_util_dmg,
            t_total_util_dmg
          ),
          player_match_summary!inner (
            steam_id,
            team_id,
            event_id,
            teams (
              id,
              team_clan_name
            ),
            events (
              event_id,
              event_name
            )
          )
        `);

      // Filter by event if specified
      if (eventId) {
        query = query
          .eq('general_stats.event_id', eventId)
          .eq('kill_stats.event_id', eventId)
          .eq('utility_stats.event_id', eventId)
          .eq('player_match_summary.event_id', eventId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch player performance data: ${error.message}`);
      }

      if (!data) return [];

      // Transform the nested data structure into our expected format
      const performanceData: PlayerPerformanceData[] = [];

      for (const player of data) {
        // Handle the case where a player might have multiple entries per event
        const generalStats = Array.isArray(player.general_stats) ? player.general_stats[0] : player.general_stats;
        const killStats = Array.isArray(player.kill_stats) ? player.kill_stats[0] : player.kill_stats;
        const utilityStats = Array.isArray(player.utility_stats) ? player.utility_stats[0] : player.utility_stats;
        const matchSummary = Array.isArray(player.player_match_summary) ? player.player_match_summary[0] : player.player_match_summary;

        if (generalStats && killStats && utilityStats && matchSummary) {
          performanceData.push({
            player: {
              steam_id: player.steam_id,
              user_name: player.user_name
            },
            team: matchSummary.teams ? {
              id: Array.isArray(matchSummary.teams) ? matchSummary.teams[0]?.id : matchSummary.teams.id,
              team_clan_name: Array.isArray(matchSummary.teams) ? matchSummary.teams[0]?.team_clan_name : matchSummary.teams.team_clan_name
            } : null,
            event: matchSummary.events ? {
              event_id: Array.isArray(matchSummary.events) ? matchSummary.events[0]?.event_id : matchSummary.events.event_id,
              event_name: Array.isArray(matchSummary.events) ? matchSummary.events[0]?.event_name : matchSummary.events.event_name
            } : { event_id: 0, event_name: 'Unknown' },
            killStats: {
              steam_id: killStats.steam_id,
              event_id: killStats.event_id,
              kills: killStats.kills,
              headshots: killStats.headshots,
              wallbang_kills: killStats.wallbang_kills,
              no_scope: killStats.no_scope,
              through_smoke: killStats.through_smoke,
              airbone_kills: killStats.airbone_kills,
              blind_kills: killStats.blind_kills,
              victim_blind_kills: killStats.victim_blind_kills,
              awp_kills: killStats.awp_kills,
              pistol_kills: killStats.pistol_kills,
              first_kills: killStats.first_kills,
              ct_first_kills: killStats.ct_first_kills,
              t_first_kills: killStats.t_first_kills,
              first_deaths: killStats.first_deaths,
              ct_first_deaths: killStats.ct_first_deaths,
              t_first_deaths: killStats.t_first_deaths
            },
            generalStats: {
              steam_id: generalStats.steam_id,
              event_id: generalStats.event_id,
              assists: generalStats.assists,
              deaths: generalStats.deaths,
              trade_kills: generalStats.trade_kills,
              trade_deaths: generalStats.trade_deaths,
              kd: generalStats.kd,
              k_d_diff: generalStats.k_d_diff,
              adr_total: generalStats.adr_total,
              adr_ct_side: generalStats.adr_ct_side,
              adr_t_side: generalStats.adr_t_side,
              kast_total: generalStats.kast_total,
              kast_ct_side: generalStats.kast_ct_side,
              kast_t_side: generalStats.kast_t_side,
              total_rounds_won: generalStats.total_rounds_won,
              t_rounds_won: generalStats.t_rounds_won,
              ct_rounds_won: generalStats.ct_rounds_won
            },
            utilityStats: {
              steam_id: utilityStats.steam_id,
              event_id: utilityStats.event_id,
              assisted_flashes: utilityStats.assisted_flashes,
              flahes_thrown: utilityStats.flahes_thrown,
              ct_flahes_thrown: utilityStats.ct_flahes_thrown,
              t_flahes_thrown: utilityStats.t_flahes_thrown,
              flahes_thrown_in_pistol_round: utilityStats.flahes_thrown_in_pistol_round,
              he_thrown: utilityStats.he_thrown,
              ct_he_thrown: utilityStats.ct_he_thrown,
              t_he_thrown: utilityStats.t_he_thrown,
              he_thrown_in_pistol_round: utilityStats.he_thrown_in_pistol_round,
              infernos_thrown: utilityStats.infernos_thrown,
              ct_infernos_thrown: utilityStats.ct_infernos_thrown,
              t_infernos_thrown: utilityStats.t_infernos_thrown,
              infernos_thrown_in_pistol_round: utilityStats.infernos_thrown_in_pistol_round,
              smokes_thrown: utilityStats.smokes_thrown,
              ct_smokes_thrown: utilityStats.ct_smokes_thrown,
              t_smokes_thrown: utilityStats.t_smokes_thrown,
              smokes_thrown_in_pistol_round: utilityStats.smokes_thrown_in_pistol_round,
              util_in_pistol_round: utilityStats.util_in_pistol_round,
              total_util_thrown: utilityStats.total_util_thrown,
              total_util_dmg: utilityStats.total_util_dmg,
              ct_total_util_dmg: utilityStats.ct_total_util_dmg,
              t_total_util_dmg: utilityStats.t_total_util_dmg
            }
          });
        }
      }

      return performanceData;
    } catch (error) {
      console.error('Error fetching player performance data:', error);
      throw error;
    }
  }

  // Get aggregated data across all events
  async getAggregatedPlayerData(): Promise<PlayerPerformanceData[]> {
    return this.getPlayerPerformanceData();
  }

  // Get data for specific event
  async getEventPlayerData(eventId: number): Promise<PlayerPerformanceData[]> {
    return this.getPlayerPerformanceData(eventId);
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .select('count')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();