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
        totalUtilityThrown: parseInt(record.flahes_thrown || '0', 10) + parseInt(record.he_thrown || '0', 10) + 
                           parseInt(record.infernos_thrown || '0', 10) + parseInt(record.smokes_thrown || '0', 10)
      };
    });

    return players;
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Load player stats from both IEM Katowice 2025 and PGL Bucharest 2025 datasets
 */
export async function loadNewPlayerStats(): Promise<PlayerRawStats[]> {
  try {
    // Load IEM Katowice 2025 data
    const iemFilePath = path.join(process.cwd(), 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv');
    console.log(`Loading IEM Katowice player stats from: ${iemFilePath}`);
    const iemPlayers = await parsePlayerStatsCSV(iemFilePath);
    
    // Load PGL Bucharest 2025 data
    const pglFilePath = path.join(process.cwd(), 'attached_assets', 'CS Data Points - player_stats (PGL_Bucharest_2025).csv');
    console.log(`Loading PGL Bucharest player stats from: ${pglFilePath}`);
    let pglPlayers: PlayerRawStats[] = [];
    
    try {
      pglPlayers = await parsePlayerStatsCSV(pglFilePath);
      console.log(`Successfully loaded ${pglPlayers.length} players from PGL Bucharest event`);
    } catch (pglError) {
      console.error('Error loading PGL Bucharest player stats:', pglError);
      console.log('Continuing with only IEM Katowice data');
    }
    
    // Combine both datasets
    const allPlayers = [...iemPlayers, ...pglPlayers];
    console.log(`Total players loaded: ${allPlayers.length}`);
    
    return allPlayers;
  } catch (error) {
    console.error('Error loading player stats:', error);
    throw error;
  }
}

/**
 * Parse round data CSV file
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

/**
 * Load rounds data from both IEM Katowice 2025 and PGL Bucharest 2025 datasets
 */
export async function loadAllRoundsData(): Promise<any[]> {
  try {
    // Load IEM Katowice 2025 rounds data
    const iemFilePath = path.join(process.cwd(), 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - rounds (IEM_Katowice_2025).csv');
    console.log(`Loading IEM Katowice rounds data from: ${iemFilePath}`);
    const iemRounds = await parseRoundsCSV(iemFilePath);
    
    // Load PGL Bucharest 2025 rounds data
    const pglFilePath = path.join(process.cwd(), 'attached_assets', 'CS Data Points - rounds (PGL_Bucharest_2025).csv');
    console.log(`Loading PGL Bucharest rounds data from: ${pglFilePath}`);
    let pglRounds: any[] = [];
    
    try {
      pglRounds = await parseRoundsCSV(pglFilePath);
      console.log(`Successfully loaded ${pglRounds.length} rounds from PGL Bucharest event`);
    } catch (pglError) {
      console.error('Error loading PGL Bucharest rounds data:', pglError);
      console.log('Continuing with only IEM Katowice rounds data');
    }
    
    // Combine both datasets
    const allRounds = [...iemRounds, ...pglRounds];
    console.log(`Total rounds loaded: ${allRounds.length}`);
    
    return allRounds;
  } catch (error) {
    console.error('Error loading rounds data:', error);
    throw error;
  }
}