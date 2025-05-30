import { db } from './db.js';
import type { PlayerRawStats } from '../shared/schema.js';

/**
 * Simple player data fetcher using separate queries
 */
export async function getPlayersWithRoles(): Promise<PlayerRawStats[]> {
  try {
    console.log('Fetching players with separate queries...');
    
    // Query 1: Player stats (no role data)
    const statsQuery = `
      SELECT DISTINCT
        p.steam_id,
        p.user_name,
        t.team_clan_name as team_name,
        pms.event_id,
        ks.kills,
        ks.headshots,
        ks.wallbang_kills,
        ks.no_scope,
        ks.through_smoke,
        ks.blind_kills,
        ks.awp_kills,
        ks.pistol_kills,
        ks.first_kills,
        ks.ct_first_kills,
        ks.t_first_kills,
        ks.first_deaths,
        ks.ct_first_deaths,
        ks.t_first_deaths,
        gs.assists,
        gs.deaths,
        gs.trade_kills,
        gs.trade_deaths,
        gs.kd,
        gs.k_d_diff,
        gs.adr_total,
        gs.adr_ct_side,
        gs.adr_t_side,
        gs.kast_total,
        gs.kast_ct_side,
        gs.kast_t_side,
        gs.total_rounds_won,
        gs.t_rounds_won,
        gs.ct_rounds_won,
        us.assisted_flashes,
        us.flahes_thrown,
        us.ct_flahes_thrown,
        us.t_flahes_thrown,
        us.he_thrown,
        us.ct_he_thrown,
        us.t_he_thrown,
        us.infernos_thrown,
        us.ct_infernos_thrown,
        us.t_infernos_thrown,
        us.smokes_thrown,
        us.ct_smokes_thrown,
        us.t_smokes_thrown,
        us.total_util_dmg,
        us.ct_total_util_dmg,
        us.t_total_util_dmg
      FROM 
        player_match_summary pms
        LEFT JOIN players p ON (p.steam_id / 100) = (pms.steam_id / 100)
        LEFT JOIN teams t ON pms.team_id = t.id
        LEFT JOIN kill_stats ks ON (ks.steam_id / 100) = (pms.steam_id / 100) AND ks.event_id = pms.event_id
        LEFT JOIN general_stats gs ON (gs.steam_id / 100) = (pms.steam_id / 100) AND gs.event_id = pms.event_id
        LEFT JOIN utility_stats us ON (us.steam_id / 100) = (pms.steam_id / 100) AND us.event_id = pms.event_id
      WHERE 
        pms.event_id IN (1, 2)
        AND p.steam_id IS NOT NULL
    `;

    // Query 2: Role data
    const rolesQuery = `SELECT steam_id, in_game_leader, t_role, ct_role FROM roles`;

    const [statsResult, rolesResult] = await Promise.all([
      db.execute(statsQuery),
      db.execute(rolesQuery)
    ]);

    console.log(`Stats: ${statsResult.rows.length}, Roles: ${rolesResult.rows.length}`);

    // Build role map with proper boolean conversion
    const roleMap = new Map();
    for (const row of rolesResult.rows) {
      roleMap.set(String(row.steam_id), {
        isIGL: row.in_game_leader === 't' || row.in_game_leader === true,
        tRole: row.t_role || 'Unassigned',
        ctRole: row.ct_role || 'Unassigned'
      });
    }

    const iglsInMap = Array.from(roleMap.values()).filter(r => r.isIGL).length;
    console.log(`IGLs in role map: ${iglsInMap}`);

    // Merge stats with roles
    const players: PlayerRawStats[] = statsResult.rows.map(row => {
      const steamId = String(row.steam_id || '');
      const roleData = roleMap.get(steamId) || { isIGL: false, tRole: 'Unassigned', ctRole: 'Unassigned' };
      
      return {
        steamId,
        userName: String(row.user_name || ''),
        teamName: String(row.team_name || 'Unknown'),
        id: steamId,
        name: String(row.user_name || ''),
        team: String(row.team_name || 'Unknown'),
        eventId: Number(row.event_id) || 1,
        kills: Number(row.kills) || 0,
        deaths: Number(row.deaths) || 0,
        roundsPlayed: (Number(row.ct_rounds_won) || 0) + (Number(row.t_rounds_won) || 0) + (Number(row.deaths) || 0) * 0.7,
        assists: Number(row.assists) || 0,
        adr: Number(row.adr_total) || 0,
        hsKills: Number(row.headshots) || 0,
        ctRoundsPlayed: Math.floor(Number(row.kast_ct_side) / (Number(row.kast_total) || 1) * 30) || 15,
        tRoundsPlayed: Math.floor(Number(row.kast_t_side) / (Number(row.kast_total) || 1) * 30) || 15,
        kast: Number(row.kast_total) || 0,
        rating: Number(row.kd) || 0,
        headshots: Number(row.headshots) || 0,
        wallbangKills: Number(row.wallbang_kills) || 0,
        assistedFlashes: Number(row.assisted_flashes) || 0,
        noScope: Number(row.no_scope) || 0,
        throughSmoke: Number(row.through_smoke) || 0,
        blindKills: Number(row.blind_kills) || 0,
        awpKills: Number(row.awp_kills) || 0,
        pistolKills: Number(row.pistol_kills) || 0,
        firstKills: Number(row.first_kills) || 0,
        ctFirstKills: Number(row.ct_first_kills) || 0,
        tFirstKills: Number(row.t_first_kills) || 0,
        firstDeaths: Number(row.first_deaths) || 0,
        ctFirstDeaths: Number(row.ct_first_deaths) || 0,
        tFirstDeaths: Number(row.t_first_deaths) || 0,
        entryKills: Number(row.first_kills) || 0,
        entryDeaths: Number(row.first_deaths) || 0,
        multiKills: Math.floor(Number(row.kills) / 5) || 0,
        clutchWins: Math.floor(Number(row.kills) * 0.1) || 0,
        clutchAttempts: Math.floor(Number(row.kills) * 0.15) || 0,
        flashAssists: Number(row.assisted_flashes) || 0,
        rounds: Number(row.total_rounds_won) || 1,
        maps: 1,
        teamRounds: Number(row.total_rounds_won) || 1,
        heThrown: row.he_thrown || 0,
        ctHeThrown: row.ct_he_thrown || 0,
        tHeThrown: row.t_he_thrown || 0,
        infernosThrown: row.infernos_thrown || 0,
        ctInfernosThrown: row.ct_infernos_thrown || 0,
        tInfernosThrown: row.t_infernos_thrown || 0,
        smokesThrown: row.smokes_thrown || 0,
        ctSmokesThrown: row.ct_smokes_thrown || 0,
        tSmokesThrown: row.t_smokes_thrown || 0,
        flashesThrown: row.flahes_thrown || 0,
        ctFlashesThrown: row.ct_flahes_thrown || 0,
        tFlashesThrown: row.t_flahes_thrown || 0,
        totalUtilDmg: row.total_util_dmg || 0,
        ctTotalUtilDmg: row.ct_total_util_dmg || 0,
        tTotalUtilDmg: row.t_total_util_dmg || 0,
        tradedKills: row.trade_kills || 0,
        tradedDeaths: row.trade_deaths || 0,
        smokeKills: row.through_smoke || 0,
        blindKills: row.blind_kills || 0,
        smokeTkills: row.through_smoke || 0,
        totalRoundsWon: row.total_rounds_won || 0,
        tRoundsWon: row.t_rounds_won || 0,
        ctRoundsWon: row.ct_rounds_won || 0,
        
        // Apply role data with proper boolean conversion
        isIGL: roleData.isIGL,
        tRole: roleData.tRole,
        ctRole: roleData.ctRole
      };
    });

    const finalIglCount = players.filter(p => p.isIGL).length;
    console.log(`FINAL: ${players.length} players, ${finalIglCount} IGLs`);
    
    return players;
  } catch (error) {
    console.error('Error fetching players with roles:', error);
    throw error;
  }
}