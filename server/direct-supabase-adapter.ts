import { db } from './supabase-db';
import { PlayerRawStats, PlayerWithPIV, PlayerRole, TeamWithTIR } from '../shared/schema';
import { mapPlayerRole, isPlayerIGL } from './player-data-utils';

/**
 * Direct adapter for Supabase database
 * Uses the simplified structure found in the actual database
 */
export class DirectSupabaseAdapter {
  /**
   * Get player data with PIV values directly from Supabase
   */
  async getPlayersWithPIV(eventId: number = 1): Promise<PlayerWithPIV[]> {
    try {
      // Fetch player data from player_stats table with event_id filter
      const query = `
        SELECT * FROM player_stats
        WHERE event_id = $1 OR event_id IS NULL
      `;
      
      const result = await db.execute(query, [eventId]);
      const playerData = result.rows as any[];
      
      console.log(`Found ${playerData.length} players in Supabase for event ID ${eventId}`);
      
      if (playerData.length === 0) {
        return [];
      }
      
      // Transform the data to PlayerWithPIV format
      const playersWithPIV: PlayerWithPIV[] = playerData.map(player => {
        // Map the role string to our PlayerRole enum
        const role = mapPlayerRole(player.role);
        const isIglFlag = isPlayerIGL(player.role, player.is_igl);
        
        // Calculate default metrics for compatibility with frontend components
        const defaultMetrics = {
          rcs: {
            value: Number(player.piv) || 0.5,
            metrics: {
              "Tactical Awareness": 0.7,
              "Mechanical Skill": 0.65,
              "Map Control": 0.8,
              "Teamplay": 0.75,
              "Impact Frags": 0.65
            }
          },
          icf: {
            value: 0.8,
            sigma: 0.25
          },
          sc: {
            value: 0.75,
            metric: "Team Cohesion"
          },
          osm: 1.05,
          piv: Number(player.piv) || 0.5,
          role: role,
          roleScores: {
            [PlayerRole.IGL]: 0.6,
            [PlayerRole.AWP]: 0.7,
            [PlayerRole.Support]: 0.8,
            [PlayerRole.Lurker]: 0.75,
            [PlayerRole.Spacetaker]: 0.65,
          },
          topMetrics: {},
          roleMetrics: {}
        };
        
        // Required fields for player detail page
        const tRole = role;
        const ctRole = role;
        
        // Use the piv from database or calculate a fallback
        const piv = Number(player.piv) || 
                   (Number(player.kills) / Math.max(1, Number(player.deaths)) * 0.5);
                   
        // Calculate K/D if available, otherwise use a fallback
        const kd = Number(player.kd) || 
                  (Number(player.kills) / Math.max(1, Number(player.deaths)));
        
        // Create PlayerWithPIV object with all required properties
        return {
          id: player.steam_id || `player_${Math.random().toString(36).substring(2, 10)}`,
          name: player.user_name || 'Unknown Player',
          team: player.team_clan_name || 'No Team',
          teamId: 0,
          role: role,
          tRole: tRole,
          ctRole: ctRole,
          isIGL: isIglFlag,
          piv: piv,
          tPIV: piv * 0.95, // Simulated T-side PIV
          ctPIV: piv * 1.05, // Simulated CT-side PIV
          kd: kd,
          rating: Number(player.rating || player.piv) || 1.0,
          // Required metrics
          metrics: defaultMetrics,
          // T-side metrics
          tMetrics: {
            ...defaultMetrics,
            side: 'T'
          },
          // CT-side metrics
          ctMetrics: {
            ...defaultMetrics,
            side: 'CT'
          },
          // Primary metric required by the UI
          primaryMetric: {
            name: 'PIV',
            value: piv
          },
          // Required by the UI with extended stats for StatisticalOutliers component
          rawStats: {
            steamId: player.steam_id || '',
            kills: Number(player.kills) || 0,
            deaths: Number(player.deaths) || 0,
            assists: Number(player.assists) || 0,
            kd: kd,
            rating: piv,
            headshots: Number(player.headshots) || 0,
            firstKills: Number(player.first_kills) || 0,
            firstDeaths: Number(player.first_deaths) || 0,
            tFirstKills: Number(player.t_first_kills) || 0,
            tFirstDeaths: Number(player.t_first_deaths) || 0,
            ctFirstKills: Number(player.ct_first_kills) || 0,
            ctFirstDeaths: Number(player.ct_first_deaths) || 0,
            tRoundsWon: Number(player.t_rounds_won) || 0,
            ctRoundsWon: Number(player.ct_rounds_won) || 0,
            flashesThrown: Number(player.flashes_thrown) || 0,
            assistedFlashes: Number(player.flash_assists) || 0,
            smokesThrown: Number(player.smokes_thrown) || 0,
            throughSmoke: Number(player.through_smoke) || 0,
            teamName: player.team_clan_name || 'No Team'
          }
        };
      });
      
      return playersWithPIV;
    } catch (error) {
      console.error('Error getting players with PIV:', error);
      return [];
    }
  }
  
  /**
   * Get team data with TIR values directly from Supabase
   */
  async getTeamsWithTIR(eventId: number = 1): Promise<TeamWithTIR[]> {
    try {
      // Fetch team data from teams table
      const query = `
        SELECT * FROM teams
      `;
      
      const result = await db.execute(query);
      const teamData = result.rows as any[];
      
      console.log(`Found ${teamData.length} teams in Supabase`);
      
      if (teamData.length === 0) {
        return [];
      }
      
      // Get all players to associate with teams
      const playersWithPIV = await this.getPlayersWithPIV(eventId);
      
      // Group players by team
      const playersByTeam = new Map<string, PlayerWithPIV[]>();
      for (const player of playersWithPIV) {
        const teamName = player.team || '';
        if (!playersByTeam.has(teamName)) {
          playersByTeam.set(teamName, []);
        }
        playersByTeam.get(teamName)!.push(player);
      }
      
      // Transform to TeamWithTIR format
      const teamsWithTIR: TeamWithTIR[] = teamData.map(team => {
        const teamName = team.name;
        const teamPlayers = playersByTeam.get(teamName) || [];
        
        // Count roles for distribution - ensure all possible roles are represented
        const roleCount = {
          [PlayerRole.Support]: 0,
          [PlayerRole.AWP]: 0,
          [PlayerRole.Lurker]: 0, 
          [PlayerRole.IGL]: 0,
          [PlayerRole.Spacetaker]: 0,
          [PlayerRole.Anchor]: 0,
          [PlayerRole.Rotator]: 0
        };
        
        for (const player of teamPlayers) {
          if (player.role) {
            roleCount[player.role]++;
          }
          if (player.isIGL) {
            roleCount[PlayerRole.IGL]++;
          }
        }
        
        // Sort players by PIV for topPlayer
        const sortedByPIV = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
        const topPlayer = sortedByPIV.length > 0 ? {
          name: sortedByPIV[0].name,
          piv: sortedByPIV[0].piv
        } : {
          name: team.top_player_name || teamName + ' Top Player',
          piv: team.top_player_piv || 1.0
        };
        
        // Calculate team aggregated metrics
        const totalPIV = sortedByPIV.reduce((sum, p) => sum + (p.piv || 0), 0);
        const averagePIV = sortedByPIV.length > 0 
          ? totalPIV / sortedByPIV.length 
          : (Number(team.avg_piv) || 0.8);
        
        // Make sure each role has at least one player (for UI display)
        for (const role in roleCount) {
          if (roleCount[role as PlayerRole] === 0 && teamPlayers.length > 0) {
            roleCount[role as PlayerRole] = 1;
          }
        }
        
        // Create TeamWithTIR object that meets frontend requirements
        return {
          id: team.id?.toString() || `${teamName}_${eventId}`,
          name: teamName,
          logo: team.logo || '',
          tir: Number(team.tir) || (averagePIV * 1.05), // Derived TIR if missing
          sumPIV: Number(team.sum_piv) || totalPIV,
          synergy: Number(team.synergy) || 0.85,
          avgPIV: averagePIV,
          topPlayer: topPlayer,
          players: teamPlayers,
          topPlayers: sortedByPIV.slice(0, 5),
          wins: Number(team.wins) || 0,
          losses: Number(team.losses) || 0,
          eventId: eventId,
          // Required for UI
          roleDistribution: roleCount,
          strengths: team.strengths ? team.strengths.split(',') : ["Balanced roster", "Strong teamwork"],
          weaknesses: team.weaknesses ? team.weaknesses.split(',') : ["Needs more experience", "Inconsistent performance"]
        };
      });
      
      return teamsWithTIR;
    } catch (error) {
      console.error('Error getting teams with TIR:', error);
      return [];
    }
  }
  
  /**
   * Get all available events from the database
   */
  async getEvents(): Promise<{ id: number, name: string }[]> {
    try {
      // Try to find event_id in player_stats table
      const query = `
        SELECT DISTINCT 
          COALESCE(event_id, 1) as id,
          CASE 
            WHEN event_id = 1 THEN 'IEM Katowice 2025'
            WHEN event_id = 2 THEN 'ESL Pro League S19'
            ELSE 'Tournament ' || COALESCE(event_id, 1)::text
          END as name
        FROM player_stats
        ORDER BY id
      `;
      
      const result = await db.execute(query);
      
      if (result.rows && result.rows.length > 0) {
        console.log(`Found ${result.rows.length} events in database`);
        return result.rows.map(row => ({
          id: Number(row.id),
          name: row.name
        }));
      }
      
      // Fallback to at least two events
      return [
        { id: 1, name: 'IEM Katowice 2025' },
        { id: 2, name: 'ESL Pro League S19' }
      ];
    } catch (error) {
      console.error('Error getting events:', error);
      // Fallback to at least two events
      return [
        { id: 1, name: 'IEM Katowice 2025' },
        { id: 2, name: 'ESL Pro League S19' }
      ];
    }
  }
  
  /**
   * Check database connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      const result = await db.execute('SELECT 1 as test');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }
}