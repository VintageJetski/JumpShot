import { createClient } from '@supabase/supabase-js';
import type { Express } from 'express';

// Direct Supabase endpoint - bypasses authentication for testing
export function setupSupabaseDirectRoutes(app: Express) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase configuration missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Direct player data endpoint with PIV calculations
  app.get('/api/players-direct', async (req, res) => {
    try {
      console.log('🔍 Fetching real tournament data from Supabase...');
      
      // Get complete player data with all stats joined
      const { data: playerData, error } = await supabase
        .from('players')
        .select(`
          steam_id,
          user_name,
          general_stats!inner (
            kd,
            adr_total,
            kast_total,
            assists,
            deaths,
            event_id
          ),
          kill_stats!inner (
            kills,
            headshots,
            first_kills,
            awp_kills,
            event_id
          ),
          utility_stats!inner (
            total_util_dmg,
            total_util_thrown,
            assisted_flashes,
            event_id
          ),
          player_match_summary!inner (
            team_id,
            event_id,
            teams (
              team_clan_name
            ),
            events (
              event_name
            )
          )
        `)
        .in('general_stats.event_id', [1, 2])
        .in('kill_stats.event_id', [1, 2])
        .in('utility_stats.event_id', [1, 2])
        .in('player_match_summary.event_id', [1, 2]);

      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }

      if (!playerData || playerData.length === 0) {
        return res.json({
          players: [],
          count: 0,
          note: 'No tournament data found',
          timestamp: new Date().toISOString()
        });
      }

      console.log(`📊 Retrieved ${playerData.length} player records from tournament data`);

      // Process and calculate PIV for each player
      const processedPlayers = playerData.map(player => {
        const generalStats = Array.isArray(player.general_stats) ? player.general_stats[0] : player.general_stats;
        const killStats = Array.isArray(player.kill_stats) ? player.kill_stats[0] : player.kill_stats;
        const utilityStats = Array.isArray(player.utility_stats) ? player.utility_stats[0] : player.utility_stats;
        const matchSummary = Array.isArray(player.player_match_summary) ? player.player_match_summary[0] : player.player_match_summary;

        // Extract metrics with null safety
        const kills = killStats?.kills || 0;
        const kd = generalStats?.kd || 0;
        const adr = generalStats?.adr_total || 0;
        const kast = generalStats?.kast_total || 0;
        const firstKills = killStats?.first_kills || 0;
        const headshots = killStats?.headshots || 0;
        const awpKills = killStats?.awp_kills || 0;
        const utilityDamage = utilityStats?.total_util_dmg || 0;

        // Simple PIV calculation based on real tournament metrics
        const killScore = kills * 1.0;
        const firstKillBonus = firstKills * 2.0;
        const headshotBonus = headshots * 0.5;
        const awpBonus = awpKills * 1.2;
        const utilityScore = (utilityDamage / 10);
        const efficiencyScore = (kd * 10) + (adr / 10) + (kast / 10);
        
        const rawPIV = killScore + firstKillBonus + headshotBonus + awpBonus + utilityScore + efficiencyScore;
        const normalizedPIV = Math.min(100, Math.max(0, rawPIV / 10));

        // Determine role based on stats
        let role = 'Support';
        if (awpKills > 5) role = 'AWPer';
        else if (firstKills > 15 && kd > 1.2) role = 'Entry';
        else if (utilityDamage > 200) role = 'Support';
        else if (kd > 1.0 && utilityDamage < 100) role = 'Lurker';

        const teamInfo = matchSummary?.teams;
        const eventInfo = matchSummary?.events;

        return {
          steamId: player.steam_id,
          name: player.user_name || `Player_${player.steam_id}`,
          team: Array.isArray(teamInfo) ? teamInfo[0]?.team_clan_name : teamInfo?.team_clan_name || 'Unknown Team',
          piv: Math.round(normalizedPIV * 100) / 100,
          role,
          metrics: {
            kd: Math.round(kd * 100) / 100,
            adr: Math.round(adr * 100) / 100,
            kast: Math.round(kast * 100) / 100,
            firstKills,
            utilityDamage,
            headshots
          },
          event: Array.isArray(eventInfo) ? eventInfo[0]?.event_name : eventInfo?.event_name || 'IEM Katowice 2025'
        };
      });

      // Sort by PIV descending
      const sortedPlayers = processedPlayers.sort((a, b) => b.piv - a.piv);

      console.log(`✅ Calculated PIV for ${sortedPlayers.length} players from real tournament data`);
      console.log(`🏆 Top performer: ${sortedPlayers[0]?.name} (${sortedPlayers[0]?.team}) - PIV: ${sortedPlayers[0]?.piv}`);

      res.json({
        players: sortedPlayers,
        count: sortedPlayers.length,
        note: 'Real tournament data with PIV calculations from Supabase',
        timestamp: new Date().toISOString(),
        source: 'IEM Katowice 2025 Tournament Data'
      });

    } catch (error) {
      console.error('❌ Error processing tournament data:', error);
      res.status(500).json({ 
        error: 'Failed to process tournament data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Events endpoint
  app.get('/api/events-direct', async (req, res) => {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('event_id');
      
      if (error) throw error;
      
      res.json({
        events: events || [],
        count: events?.length || 0,
        note: 'Available tournament events'
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch events',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('✅ Direct Supabase routes configured');
}