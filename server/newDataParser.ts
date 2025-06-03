import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PlayerRawStats, PlayerRole } from '@shared/schema';

/**
 * Parse the new CS2 match data CSV file format
 */
export async function parsePlayerStatsCSV(filePath: string): Promise<PlayerRawStats[]> {
  try {
    const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const players: PlayerRawStats[] = records.map((record: any) => {
      // Convert string values to appropriate types
      const kills = parseInt(record.kills, 10);
      const deaths = parseInt(record.deaths, 10);
      
      return {
        steamId: record.steam_id,
        userName: record.user_name,
        teamName: record.team_clan_name,
        kills: kills,
        headshots: parseInt(record.headshots, 10),
        wallbangKills: parseInt(record.wallbang_kills, 10),
        assistedFlashes: parseInt(record.assisted_flashes, 10),
        noScope: parseInt(record.no_scope, 10),
        throughSmoke: parseInt(record.through_smoke, 10),
        blindKills: parseInt(record.blind_kills, 10),
        victimBlindKills: parseInt(record.victim_blind_kills, 10),
        assists: parseInt(record.assists, 10),
        deaths: deaths,
        kd: deaths > 0 ? kills / deaths : kills, // Handle division by zero
        totalRoundsWon: parseInt(record.total_rounds_won, 10),
        tRoundsWon: parseInt(record.t_rounds_won, 10),
        ctRoundsWon: parseInt(record.ct_rounds_won, 10),
        firstKills: parseInt(record.first_kills, 10),
        ctFirstKills: parseInt(record.ct_first_kills, 10),
        tFirstKills: parseInt(record.t_first_kills, 10),
        firstDeaths: parseInt(record.first_deaths, 10),
        ctFirstDeaths: parseInt(record.ct_first_deaths, 10),
        tFirstDeaths: parseInt(record.t_first_deaths, 10),
        flashesThrown: parseInt(record.flahes_thrown || '0', 10), // Note: Typo in CSV column name
        ctFlashesThrown: parseInt(record.ct_flahes_thrown || '0', 10), // Note: Typo in CSV column name
        tFlashesThrown: parseInt(record.t_flahes_thrown || '0', 10), // Note: Typo in CSV column name
        flashesThrownInPistolRound: parseInt(record.flahes_thrown_in_pistol_round || '0', 10), // Note: Typo in CSV column name
        heThrown: parseInt(record.he_thrown || '0', 10),
        ctHeThrown: parseInt(record.ct_he_thrown || '0', 10),
        tHeThrown: parseInt(record.t_he_thrown || '0', 10),
        heThrownInPistolRound: parseInt(record.he_thrown_in_pistol_round || '0', 10),
        infernosThrown: parseInt(record.infernos_thrown || '0', 10),
        ctInfernosThrown: parseInt(record.ct_infernos_thrown || '0', 10),
        tInfernosThrown: parseInt(record.t_infernos_thrown || '0', 10),
        infernosThrownInPistolRound: parseInt(record.infernos_thrown_in_pistol_round || '0', 10),
        smokesThrown: parseInt(record.smokes_thrown || '0', 10),
        ctSmokesThrown: parseInt(record.ct_smokes_thrown || '0', 10),
        tSmokesThrown: parseInt(record.t_smokes_thrown || '0', 10),
        smokesThrownInPistolRound: parseInt(record.smokes_thrown_in_pistol_round || '0', 10),
        totalUtilityThrown: parseInt(record.total_util_thrown || '0', 10),
        awpKills: parseInt(record.awp_kills || '0', 10),
        pistolKills: parseInt(record.pistol_kills || '0', 10),
        tradeKills: parseInt(record.trade_kills || '0', 10),
        tradeDeaths: parseInt(record.trade_deaths || '0', 10),
        kDiff: parseInt(record.k_d_diff || '0', 10),
        adrTotal: parseFloat(record.adr_total || '0'),
        adrCtSide: parseFloat(record.adr_ct_side || '0'),
        adrTSide: parseFloat(record.adr_t_side || '0'),
        kastTotal: parseFloat(record.kast_total || '0'),
        kastCtSide: parseFloat(record.kast_ct_side || '0'),
        kastTSide: parseFloat(record.kast_t_side || '0'),
        totalUtilDmg: parseInt(record.total_util_dmg || '0', 10),
        ctTotalUtilDmg: parseInt(record.ct_total_util_dmg || '0', 10),
        tTotalUtilDmg: parseInt(record.t_total_util_dmg || '0', 10),
        airboneKills: parseInt(record.airbone_kills || '0', 10)
      };
    });

    return players;
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Load player stats from the new IEM Katowice 2025 dataset
 */
export async function loadNewPlayerStats(): Promise<PlayerRawStats[]> {
  try {
    const filePath = path.join(process.cwd(), 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv');
    console.log(`Loading new player stats from: ${filePath}`);
    return await parsePlayerStatsCSV(filePath);
  } catch (error) {
    console.error('Error loading player stats:', error);
    throw error;
  }
}

/**
 * Optional: Parse round data if needed for future metrics
 * Not currently used in PIV calculations
 */
export async function parseRoundsCSV(filePath: string): Promise<any[]> {
  try {
    const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    return records;
  } catch (error) {
    console.error(`Error parsing rounds CSV file ${filePath}:`, error);
    throw error;
  }
}