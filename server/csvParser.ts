import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { PlayerRawStats } from '@shared/schema';

/**
 * Parses the CS2 match data CSV file and returns an array of player statistics
 */
export async function parseCSVData(filePath: string): Promise<PlayerRawStats[]> {
  return new Promise((resolve, reject) => {
    const results: PlayerRawStats[] = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({
        delimiter: ',',
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (data) => {
        // Convert string fields to numbers
        const playerData: PlayerRawStats = {
          steamId: data.steam_id,
          userName: data.user_name,
          teamName: data.team_clan_name,
          kills: parseInt(data.kills, 10),
          headshots: parseInt(data.headshots, 10),
          wallbangKills: parseInt(data.wallbang_kills, 10),
          assistedFlashes: parseInt(data.assisted_flashes, 10),
          noScope: parseInt(data.no_scope, 10),
          throughSmoke: parseInt(data.through_smoke, 10),
          blindKills: parseInt(data.blind_kills, 10),
          victimBlindKills: parseInt(data.victim_blind_kills, 10),
          assists: parseInt(data.assists, 10),
          deaths: parseInt(data.deaths, 10),
          kd: parseFloat(data.kd.replace(',', '.')), // Handle European number format if needed
          totalRoundsWon: parseInt(data.total_rounds_won, 10),
          tRoundsWon: parseInt(data.t_rounds_won, 10),
          ctRoundsWon: parseInt(data.ct_rounds_won, 10),
          firstKills: parseInt(data.first_kills, 10),
          ctFirstKills: parseInt(data.CT_first_kills, 10),
          tFirstKills: parseInt(data.T_first_kills, 10),
          firstDeaths: parseInt(data.first_deaths, 10),
          ctFirstDeaths: parseInt(data.CT_first_deaths, 10),
          tFirstDeaths: parseInt(data.T_first_deaths, 10),
          flashesThrown: parseInt(data.flahes_thrown, 10), // Note: There's a typo in the CSV column name
          ctFlashesThrown: parseInt(data.CT_flahes_thrown, 10), // Same typo
          tFlashesThrown: parseInt(data.T_flahes_thrown, 10), // Same typo
          flashesThrownInPistolRound: parseInt(data.flahes_thrown_in_pistol_round, 10), // Same typo
          heThrown: parseInt(data.he_thrown, 10),
          ctHeThrown: parseInt(data.CT_he_thrown, 10),
          tHeThrown: parseInt(data.T_he_thrown, 10),
          heThrownInPistolRound: parseInt(data.he_thrown_in_pistol_round, 10),
          infernosThrown: parseInt(data.infernos_thrown, 10),
          ctInfernosThrown: parseInt(data.CT_infernos_thrown, 10),
          tInfernosThrown: parseInt(data.T_infernos_thrown, 10),
          infernosThrownInPistolRound: parseInt(data.infernos_thrown_in_pistol_round, 10),
          smokesThrown: parseInt(data.smokes_thrown, 10),
          ctSmokesThrown: parseInt(data.CT_smokes_thrown, 10),
          tSmokesThrown: parseInt(data.T_smokes_thrown, 10),
          smokesThrownInPistolRound: parseInt(data.smokes_thrown_in_pistol_round, 10),
          totalUtilityThrown: parseInt(data.total_util_thrown, 10),
        };
        
        results.push(playerData);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Load and parse the CSV file from the attached_assets directory
 */
export async function loadPlayerData(): Promise<PlayerRawStats[]> {
  try {
    const filePath = path.resolve(process.cwd(), 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - Data Points (3 Matches Test).csv');
    console.log(`Loading CSV data from: ${filePath}`);
    return await parseCSVData(filePath);
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw new Error('Failed to load player data from CSV');
  }
}
