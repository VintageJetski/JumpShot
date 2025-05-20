import { db } from './db';
import { PlayerWithPIV, TeamWithTIR, PlayerRole } from '@shared/types';

/**
 * Simplified adapter for Supabase database with direct SQL queries
 * that properly map to the actual database structure
 */
export class SimpleSupabaseAdapter {
  /**
   * Check database connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      const result = await db.execute('SELECT NOW()');
      return result.rows.length === 1;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }
  
  /**
   * Get all available events
   */
  async getEvents(): Promise<{ id: number, name: string }[]> {
    try {
      const query = `SELECT id, name FROM events`;
      const result = await db.execute(query);
      return result.rows as { id: number, name: string }[];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Get players with PIV values directly from player_stats table
   * This returns all players regardless of event
   */
  async getPlayersWithPIV(): Promise<PlayerWithPIV[]> {
    try {
      const query = `SELECT * FROM player_stats`;
      const result = await db.execute(query);
      const players = result.rows as any[];
      
      console.log(`Found ${players.length} players in player_stats table`);
      
      return players.map(player => {
        // Map role to enum
        let role = PlayerRole.Support;
        if (player.role) {
          const normalizedRole = String(player.role).trim().toLowerCase();
          if (normalizedRole.includes('awp')) role = PlayerRole.AWP;
          else if (normalizedRole === 'support') role = PlayerRole.Support;
          else if (normalizedRole === 'lurker') role = PlayerRole.Lurker;
          else if (normalizedRole === 'igl') role = PlayerRole.IGL;
          else if (normalizedRole.includes('space')) role = PlayerRole.Spacetaker;
          else if (normalizedRole === 'anchor') role = PlayerRole.Anchor;
          else if (normalizedRole === 'rotator') role = PlayerRole.Rotator;
        }
        
        // Basic metrics calculation from raw stats
        const kd = parseFloat(player.kd) || player.kills / Math.max(player.deaths, 1) || 1.0;
        const pivValue = parseFloat(player.piv) || 1.0;
        
        // Create derived metrics needed by UI
        return {
          id: player.steam_id || String(player.id) || '',
          name: player.user_name || 'Unknown Player',
          team: player.team_clan_name || '',
          role: role,
          tRole: role,
          ctRole: role,
          isIGL: player.is_igl === 't' || player.is_igl === true,
          isMainAWPer: player.is_main_awper === 't' || player.is_main_awper === true,
          piv: pivValue,
          tPIV: pivValue * 0.95,
          ctPIV: pivValue * 1.05,
          kd: kd,
          rating: pivValue * kd,
          metrics: {
            kills: player.kills || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            flashAssists: player.assisted_flashes || 0,
            headshotPercentage: player.headshots && player.kills ? 
              ((player.headshots / Math.max(player.kills, 1)) * 100).toFixed(1) : '0.0',
            kd: kd,
            adr: 0,
            clutches: 0
          },
          utilityStats: {
            flashesThrown: player.flashes_thrown || 0,
            smokeGrenades: player.smokes_thrown || 0,
            heGrenades: player.he_thrown || 0,
            molotovs: player.infernos_thrown || 0, 
            totalUtility: player.total_utility_thrown || 0
          },
          primaryMetric: {
            value: pivValue,
            label: 'PIV',
            description: 'Player Impact Value'
          },
          // Additional metrics for the detailed view
          rcs: {
            value: 0.75,
            metrics: {
              "Entry Kills": (player.first_kills / Math.max(player.first_kills + player.first_deaths, 1)) || 0.6,
              "Trading": 0.65,
              "Positioning": 0.72,
              "Utility Usage": (player.total_utility_thrown / 200) || 0.6,
              "Support Play": (player.assisted_flashes / 15) || 0.5,
              "Clutch Factor": 0.7,
              "Map Control": 0.68,
              "Consistency": 0.7
            }
          },
          icf: { value: 0.7, sigma: 0.3 },
          sc: { value: 0.7, metric: "Team Contribution" },
          osm: 1.1,
          tMetrics: {
            roleMetrics: {
              "Entry Efficiency": 0.7,
              "Site Control": 0.68,
              "Trade Efficiency": 0.72
            }
          },
          ctMetrics: {
            roleMetrics: {
              "Site Defense": 0.76,
              "Retake Success": 0.67,
              "Position Rotation": 0.63
            }
          },
          rawStats: player
        };
      });
    } catch (error) {
      console.error('Error getting players:', error);
      return [];
    }
  }

  /**
   * Get teams with TIR values
   */
  async getTeamsWithTIR(): Promise<TeamWithTIR[]> {
    try {
      const query = `SELECT * FROM teams`;
      const result = await db.execute(query);
      const teams = result.rows as any[];
      
      console.log(`Found ${teams.length} teams in teams table`);
      
      // Get all players to associate with teams
      const allPlayers = await this.getPlayersWithPIV();
      
      // Group players by team
      const playersByTeam = new Map<string, PlayerWithPIV[]>();
      for (const player of allPlayers) {
        if (!player.team) continue;
        
        if (!playersByTeam.has(player.team)) {
          playersByTeam.set(player.team, []);
        }
        playersByTeam.get(player.team)!.push(player);
      }
      
      // Process teams from database
      return teams.map(team => {
        const teamName = team.name || '';
        const teamPlayers = playersByTeam.get(teamName) || [];
        
        // Sort players by PIV
        const sortedPlayers = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
        
        // Count roles for distribution
        const roleCount = {
          [PlayerRole.Support]: 0,
          [PlayerRole.AWP]: 0,
          [PlayerRole.Lurker]: 0, 
          [PlayerRole.IGL]: 0,
          [PlayerRole.Spacetaker]: 0,
          [PlayerRole.Anchor]: 0,
          [PlayerRole.Rotator]: 0
        };
        
        // Count roles from player data
        for (const player of teamPlayers) {
          if (player.role) {
            roleCount[player.role]++;
          }
        }
        
        // Create top player object
        const topPlayer = {
          id: 'top_player',
          name: team.top_player_name || (sortedPlayers.length > 0 ? sortedPlayers[0].name : 'Top Player'),
          piv: parseFloat(team.top_player_piv) || (sortedPlayers.length > 0 ? sortedPlayers[0].piv : 1.0)
        };
        
        // Calculate team metrics
        const totalPIV = sortedPlayers.reduce((sum, p) => sum + (p.piv || 0), 0);
        const avgPIV = teamPlayers.length > 0 ? totalPIV / teamPlayers.length : parseFloat(team.avg_piv) || 1.0;
        
        return {
          id: String(team.id) || `team_${teamName}`,
          name: teamName,
          logo: '',
          tir: parseFloat(team.tir) || avgPIV * 1.05,
          sumPIV: parseFloat(team.sum_piv) || totalPIV,
          synergy: parseFloat(team.synergy) || 0.85,
          avgPIV: avgPIV,
          topPlayer: topPlayer,
          players: teamPlayers,
          topPlayers: sortedPlayers.slice(0, 5),
          wins: 0,
          losses: 0,
          roleDistribution: roleCount,
          strengths: ["Balanced roster", "Strong teamwork"],
          weaknesses: ["Needs more experience", "Inconsistent performance"]
        };
      });
    } catch (error) {
      console.error('Error getting teams:', error);
      return [];
    }
  }
}

export const simpleSupabaseAdapter = new SimpleSupabaseAdapter();