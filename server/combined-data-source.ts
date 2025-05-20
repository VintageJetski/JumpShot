import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from './db';
import { PlayerWithPIV, TeamWithTIR, PlayerRole } from '@shared/types';

/**
 * Get player statistics from the database
 */
async function getPlayersFromDatabase(): Promise<any[]> {
  try {
    const query = `SELECT * FROM player_stats`;
    const result = await db.execute(query);
    return result.rows;
  } catch (error) {
    console.error('Error querying player_stats:', error);
    return [];
  }
}

/**
 * Load teams and player roles from the CSV file
 */
async function getTeamsFromCSV(): Promise<{
  teams: Set<string>;
  playerRoles: Record<string, { isIGL: boolean; tRole: string; ctRole: string; team: string; }>;
}> {
  try {
    const filePath = path.join(process.cwd(), 'attached_assets', 'CS2dkbasics - Teams and roles (1).csv');
    
    if (!fs.existsSync(filePath)) {
      console.error(`Teams and roles CSV file not found: ${filePath}`);
      return { teams: new Set(), playerRoles: {} };
    }
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: ['empty', 'team', 'previousTeam', 'player', 'isIGL', 'tRole', 'ctRole'],
      from_line: 2, // Skip header
      skip_empty_lines: true
    });
    
    const teams = new Set<string>();
    const playerRoles: Record<string, { isIGL: boolean; tRole: string; ctRole: string; team: string; }> = {};
    
    for (const record of records) {
      const team = record.team?.trim();
      const player = record.player?.trim();
      
      if (team && team !== 'No Team') {
        teams.add(team);
        
        if (player) {
          // Clean player name (remove any text in parentheses)
          const cleanName = player.split('(')[0].trim();
          
          playerRoles[cleanName.toLowerCase()] = {
            isIGL: record.isIGL === 'Yes',
            tRole: record.tRole || 'Support',
            ctRole: record.ctRole || 'Support',
            team: team
          };
        }
      }
    }
    
    return { teams, playerRoles };
  } catch (error) {
    console.error('Error loading teams from CSV:', error);
    return { teams: new Set(), playerRoles: {} };
  }
}

/**
 * Map a role string to PlayerRole enum
 */
function mapRoleString(roleString: string): PlayerRole {
  const normalizedRole = roleString.trim().toLowerCase();
  
  if (normalizedRole.includes('awp')) return PlayerRole.AWP;
  if (normalizedRole === 'support') return PlayerRole.Support;
  if (normalizedRole === 'lurker') return PlayerRole.Lurker;
  if (normalizedRole === 'igl' || normalizedRole === 'in-game leader') return PlayerRole.IGL;
  if (normalizedRole.includes('spacetaker') || normalizedRole.includes('entry')) return PlayerRole.Spacetaker;
  if (normalizedRole === 'anchor') return PlayerRole.Anchor;
  if (normalizedRole === 'rotator') return PlayerRole.Rotator;
  if (normalizedRole === 'unassigned') return PlayerRole.Support;
  
  // Default to Support if unknown
  return PlayerRole.Support;
}

/**
 * Combine player data from the database with role information from CSV
 */
export async function getEnhancedPlayers(): Promise<PlayerWithPIV[]> {
  try {
    // Get players from database
    const databasePlayers = await getPlayersFromDatabase();
    console.log(`Found ${databasePlayers.length} players in database`);
    
    // Get role information from CSV
    const { playerRoles } = await getTeamsFromCSV();
    
    // Process each player
    return databasePlayers.map(player => {
      const playerName = player.user_name || '';
      const teamName = player.team_clan_name || '';
      
      // Try to find role data for this player
      const roleData = playerRoles[playerName.toLowerCase()] || {
        isIGL: player.is_igl === 't' || player.is_igl === true,
        tRole: player.role || 'Support', 
        ctRole: player.role || 'Support',
        team: teamName
      };
      
      // Calculate PIV based on player stats
      const kills = parseInt(player.kills || '0');
      const deaths = parseInt(player.deaths || '0');
      const assists = parseInt(player.assists || '0');
      const flashAssists = parseInt(player.assisted_flashes || '0');
      const firstKills = parseInt(player.first_kills || '0');
      const firstDeaths = parseInt(player.first_deaths || '0');
      
      // Use KD from database if available, otherwise calculate
      const kd = parseFloat(player.kd) || (deaths > 0 ? kills / deaths : 1.0);
      
      // Calculate PIV (in a real app would be more complex)
      const kdFactor = kd * 0.3;
      const firstKillRatio = firstDeaths > 0 ? firstKills / firstDeaths : firstKills;
      const firstKillFactor = firstKillRatio * 0.2;
      const flashFactor = (flashAssists / Math.max(10, parseInt(player.flashes_thrown || '10'))) * 0.15;
      
      let piv = 0.8 + kdFactor + firstKillFactor + flashFactor;
      
      // Role-specific adjustments
      const tRole = mapRoleString(roleData.tRole);
      const ctRole = mapRoleString(roleData.ctRole);
      
      // IGL bonus
      if (roleData.isIGL) {
        piv += 0.1;
      }
      
      // AWP bonus
      if (tRole === PlayerRole.AWP || ctRole === PlayerRole.AWP) {
        piv += 0.05;
      }
      
      // Clamp PIV to reasonable range
      piv = Math.max(0.5, Math.min(2.0, piv));
      
      // Create PlayerWithPIV object
      return {
        id: player.steam_id || `player_${playerName.replace(/\s+/g, '_').toLowerCase()}`,
        name: playerName,
        team: teamName,
        role: tRole, // Use T-side role as primary
        tRole: tRole,
        ctRole: ctRole,
        isIGL: roleData.isIGL,
        isMainAWPer: tRole === PlayerRole.AWP || ctRole === PlayerRole.AWP,
        piv: piv,
        tPIV: piv * 0.95,
        ctPIV: piv * 1.05,
        kd: kd,
        rating: piv * kd,
        metrics: {
          kills: kills,
          deaths: deaths,
          assists: assists,
          flashAssists: flashAssists,
          headshotPercentage: kills > 0 ? 
            ((parseInt(player.headshots || '0') / kills) * 100).toFixed(1) : '0.0',
          kd: kd,
          adr: 0,
          clutches: 0
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
        rcs: {
          value: 0.75,
          metrics: {
            "Entry Kills": firstKillRatio,
            "Trading": 0.65,
            "Positioning": 0.72,
            "Utility Usage": parseInt(player.total_utility_thrown || '0') / 200,
            "Support Play": flashAssists / 15,
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
    console.error('Error getting enhanced players:', error);
    return [];
  }
}

/**
 * Get teams with players attached, includes teams from both database and CSV
 */
export async function getEnhancedTeams(): Promise<TeamWithTIR[]> {
  try {
    // Get all players first
    const players = await getEnhancedPlayers();
    
    // Get teams from CSV to ensure we include all teams
    const { teams: csvTeams } = await getTeamsFromCSV();
    
    // Create team name set from both sources
    const allTeamNames = new Set<string>();
    
    // Add teams from CSV
    for (const team of csvTeams) {
      allTeamNames.add(team);
    }
    
    // Add teams from player data
    for (const player of players) {
      if (player.team) {
        allTeamNames.add(player.team);
      }
    }
    
    console.log(`Found ${allTeamNames.size} unique teams from all sources`);
    
    // Group players by team
    const playersByTeam: Record<string, PlayerWithPIV[]> = {};
    for (const player of players) {
      if (!player.team) continue;
      
      if (!playersByTeam[player.team]) {
        playersByTeam[player.team] = [];
      }
      playersByTeam[player.team].push(player);
    }
    
    // Process all teams
    const teams: TeamWithTIR[] = [];
    
    for (const teamName of allTeamNames) {
      // Get players for this team
      const teamPlayers = playersByTeam[teamName] || [];
      
      // Sort players by PIV
      const sortedPlayers = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
      
      // Calculate team metrics
      const totalPIV = teamPlayers.reduce((sum, p) => sum + (p.piv || 0), 0);
      const avgPIV = teamPlayers.length > 0 ? totalPIV / teamPlayers.length : 1.0;
      
      // Calculate synergy based on team composition
      let synergy = 0.85;
      if (teamPlayers.length >= 2) {
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
      
      // Count roles from team players
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
    
    return teams;
  } catch (error) {
    console.error('Error creating enhanced teams:', error);
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
    console.error('Error querying events:', error);
    return [];
  }
}