import { db } from './db';
import { PlayerWithPIV, TeamWithTIR, PlayerRole } from '@shared/types';

/**
 * Query the Supabase database directly for player statistics
 * @returns Promise<PlayerWithPIV[]> Array of players with calculated PIV values
 */
export async function getPlayersFromSupabase(): Promise<PlayerWithPIV[]> {
  try {
    // Get all player stats without filtering by event_id
    const query = `SELECT * FROM player_stats`;
    const result = await db.execute(query);
    const players = result.rows as any[];
    
    console.log(`Found ${players.length} player stats in Supabase`);
    
    if (players.length === 0) {
      return [];
    }
    
    // Transform player stats into PlayerWithPIV objects
    return players.map(player => {
      // Calculate role based on player role field
      let roleEnum = PlayerRole.Support;
      if (player.role) {
        const role = String(player.role).trim().toLowerCase();
        if (role.includes('awp')) roleEnum = PlayerRole.AWP;
        else if (role === 'support') roleEnum = PlayerRole.Support;
        else if (role === 'lurker') roleEnum = PlayerRole.Lurker;
        else if (role === 'igl') roleEnum = PlayerRole.IGL;
        else if (role.includes('space')) roleEnum = PlayerRole.Spacetaker;
        else if (role === 'anchor') roleEnum = PlayerRole.Anchor;
        else if (role === 'rotator') roleEnum = PlayerRole.Rotator;
      }
      
      // Calculate PIV (in a real app this would be more sophisticated)
      const kills = parseInt(player.kills || '0');
      const deaths = parseInt(player.deaths || '0');
      const assists = parseInt(player.assists || '0');
      const firstKills = parseInt(player.first_kills || '0');
      const firstDeaths = parseInt(player.first_deaths || '0');
      
      // Simplified PIV calculation
      let piv = 1.0;
      const kd = parseFloat(player.kd) || (deaths > 0 ? kills / deaths : 1.0);
      
      // Calculate PIV based on simple metrics
      const kdFactor = kd * 0.3;
      const firstKillRatio = firstDeaths > 0 ? firstKills / firstDeaths : firstKills;
      const firstKillFactor = firstKillRatio * 0.2;
      const supportFactor = parseInt(player.assisted_flashes || '0') / 15 * 0.1;
      
      piv = 0.8 + kdFactor + firstKillFactor + supportFactor;
      piv = Math.max(0.5, Math.min(2.0, piv)); // Clamp to reasonable range
      
      return {
        id: player.steam_id || `${player.id}`,
        name: player.user_name || 'Unknown Player',
        team: player.team_clan_name || '',
        role: roleEnum,
        tRole: roleEnum,
        ctRole: roleEnum,
        isIGL: player.is_igl === 't' || player.is_igl === true,
        isMainAWPer: player.is_main_awper === 't' || player.is_main_awper === true,
        piv: piv,
        tPIV: piv * 0.95,
        ctPIV: piv * 1.05,
        kd: kd,
        rating: piv * kd,
        metrics: {
          kills: kills,
          deaths: deaths,
          assists: assists,
          flashAssists: parseInt(player.assisted_flashes || '0'),
          headshotPercentage: kills > 0 ? 
            ((parseInt(player.headshots || '0') / kills) * 100).toFixed(1) : '0.0',
          kd: kd,
          adr: 0, // Not available
          clutches: 0 // Not available
        },
        utilityStats: {
          flashesThrown: parseInt(player.flashes_thrown || '0'),
          smokeGrenades: parseInt(player.smokes_thrown || '0'),
          heGrenades: parseInt(player.he_thrown || '0'),
          molotovs: parseInt(player.infernos_thrown || '0'),
          totalUtility: parseInt(player.total_utility_thrown || '0')
        },
        primaryMetric: {
          value: piv,
          label: 'PIV',
          description: 'Player Impact Value'
        },
        // Additional metrics needed by UI
        rcs: {
          value: 0.75,
          metrics: {
            "Entry Kills": firstKillRatio,
            "Trading": 0.65,
            "Positioning": 0.72,
            "Utility Usage": parseInt(player.total_utility_thrown || '0') / 200,
            "Support Play": parseInt(player.assisted_flashes || '0') / 15,
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
    console.error('Error querying player stats from Supabase:', error);
    return [];
  }
}

/**
 * Create team data from player statistics
 * @returns Promise<TeamWithTIR[]> Array of teams with calculated TIR values
 */
export async function getTeamsFromPlayers(): Promise<TeamWithTIR[]> {
  try {
    // Get all players first
    const players = await getPlayersFromSupabase();
    
    // Group players by team
    const playersByTeam: Record<string, PlayerWithPIV[]> = {};
    for (const player of players) {
      if (!player.team) continue;
      
      if (!playersByTeam[player.team]) {
        playersByTeam[player.team] = [];
      }
      playersByTeam[player.team].push(player);
    }
    
    // Create team objects
    const teams: TeamWithTIR[] = [];
    
    for (const [teamName, teamPlayers] of Object.entries(playersByTeam)) {
      // Sort players by PIV
      const sortedPlayers = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
      
      // Calculate team metrics
      const totalPIV = teamPlayers.reduce((sum, p) => sum + (p.piv || 0), 0);
      const avgPIV = teamPlayers.length > 0 ? totalPIV / teamPlayers.length : 1.0;
      
      // Calculate synergy based on team composition
      let synergy = 0.85;
      if (teamPlayers.length >= 5) {
        const pivValues = teamPlayers.map(p => p.piv || 0);
        const pivMean = pivValues.reduce((sum, val) => sum + val, 0) / pivValues.length;
        const pivVariance = pivValues.reduce((sum, val) => sum + Math.pow(val - pivMean, 2), 0) / pivValues.length;
        const pivStdDev = Math.sqrt(pivVariance);
        
        // Higher stdev = lower synergy, lower stdev = higher synergy
        synergy = 0.85 * (1 - (pivStdDev / 2)); 
        synergy = Math.max(0.7, Math.min(0.95, synergy));
      }
      
      // Calculate TIR
      const teamSizeBonus = Math.min(1.15, 0.9 + (teamPlayers.length * 0.05));
      const tir = avgPIV * synergy * teamSizeBonus;
      
      // Count roles
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
      
      // Generate strengths and weaknesses
      const strengths = [];
      const weaknesses = [];
      
      // Check role balance
      const roleBalance = Object.values(roleCount).filter(count => count > 0).length;
      if (roleBalance >= 5) {
        strengths.push("Balanced roster");
      } else if (roleBalance <= 3) {
        weaknesses.push("Limited role diversity");
      }
      
      // Check AWPers
      if (roleCount[PlayerRole.AWP] >= 1) {
        strengths.push("Strong AWP presence");
      } else {
        weaknesses.push("Lack of dedicated AWPer");
      }
      
      // Check IGL
      if (roleCount[PlayerRole.IGL] >= 1) {
        strengths.push("Strong leadership");
      } else {
        weaknesses.push("Needs dedicated IGL");
      }
      
      // Ensure we have at least one strength and weakness
      if (strengths.length === 0) {
        strengths.push("Developing team chemistry");
      }
      if (weaknesses.length === 0) {
        weaknesses.push("Needs more experience");
      }
      
      // Get top player
      const topPlayer = sortedPlayers.length > 0 ? {
        id: sortedPlayers[0].id,
        name: sortedPlayers[0].name,
        piv: sortedPlayers[0].piv
      } : {
        id: 'unknown',
        name: 'Unknown',
        piv: 1.0
      };
      
      // Create team object
      teams.push({
        id: `team_${teamName.replace(/\s+/g, '_').toLowerCase()}`,
        name: teamName,
        logo: '', // No logo available
        tir: tir,
        sumPIV: totalPIV,
        synergy: synergy,
        avgPIV: avgPIV,
        topPlayer: topPlayer,
        players: teamPlayers,
        topPlayers: sortedPlayers.slice(0, 5),
        wins: 0, // Not available
        losses: 0, // Not available
        roleDistribution: roleCount,
        strengths: strengths.slice(0, 3),
        weaknesses: weaknesses.slice(0, 3)
      });
    }
    
    console.log(`Created ${teams.length} teams from player data`);
    return teams;
  } catch (error) {
    console.error('Error creating teams from player data:', error);
    return [];
  }
}

/**
 * Get available events
 */
export async function getEvents(): Promise<{ id: number, name: string }[]> {
  try {
    const query = `SELECT id, name FROM events`;
    const result = await db.execute(query);
    return result.rows as { id: number, name: string }[];
  } catch (error) {
    console.error('Error querying events from Supabase:', error);
    return [];
  }
}