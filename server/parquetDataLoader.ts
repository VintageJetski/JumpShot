import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { PlayerRawStats, PlayerRole } from '@shared/schema';

/**
 * Load player data from our processed parquet files
 * This uses a small Python helper to read the parquet files
 */
export async function loadParquetData(): Promise<PlayerRawStats[]> {
  try {
    // Check if the parquet file exists
    const parquetPath = path.join(process.cwd(), 'clean', 'piv.parquet');
    if (!fs.existsSync(parquetPath)) {
      console.error(`Parquet file not found at ${parquetPath}`);
      // Fall back to CSV file if parquet doesn't exist
      const csvPath = path.join(process.cwd(), 'clean', 'piv.csv');
      if (fs.existsSync(csvPath)) {
        return await loadDataFromCSV(csvPath);
      } else {
        throw new Error('No processed data files found');
      }
    }

    // Create a temporary Python script to read the parquet file
    const scriptContent = `
import pandas as pd
import json
import sys

# Load the parquet file
df = pd.read_parquet('${parquetPath}')

# Convert to JSON and print to stdout
print(df.to_json(orient='records'))
`;

    const scriptPath = path.join(process.cwd(), 'temp_parquet_reader.py');
    fs.writeFileSync(scriptPath, scriptContent);

    // Execute the Python script to read the parquet file
    return new Promise((resolve, reject) => {
      exec(`python ${scriptPath}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        // Clean up the temporary script
        try { fs.unlinkSync(scriptPath); } catch (e) { console.error(e); }

        if (error) {
          console.error(`Error executing Python script: ${error.message}`);
          console.error(stderr);
          reject(error);
          return;
        }

        try {
          const jsonData = JSON.parse(stdout);
          // Convert to PlayerRawStats format
          const players = jsonData.map((player: any) => ({
            steamId: player.steam_id || player.steamId,
            userName: player.name || player.userName,
            teamName: player.team || player.teamName,
            kills: Number(player.kills || 0),
            headshots: Number(player.headshots || 0),
            wallbangKills: Number(player.wallbang_kills || 0),
            assistedFlashes: Number(player.assisted_flashes || 0),
            noScope: Number(player.no_scope || 0),
            throughSmoke: Number(player.through_smoke || 0),
            blindKills: Number(player.blind_kills || 0),
            victimBlindKills: Number(player.victim_blind_kills || 0),
            assists: Number(player.assists || 0),
            deaths: Number(player.deaths || 0),
            kd: Number(player.kd || 0),
            totalRoundsWon: Number(player.total_rounds_won || 0),
            tRoundsWon: Number(player.t_rounds_won || 0),
            ctRoundsWon: Number(player.ct_rounds_won || 0),
            firstKills: Number(player.first_kills || 0),
            ctFirstKills: Number(player.ct_first_kills || 0),
            tFirstKills: Number(player.t_first_kills || 0),
            firstDeaths: Number(player.first_deaths || 0),
            ctFirstDeaths: Number(player.ct_first_deaths || 0),
            tFirstDeaths: Number(player.t_first_deaths || 0),
            flashesThrown: Number(player.flashes_thrown || player.flahes_thrown || 0),
            ctFlashesThrown: Number(player.ct_flashes_thrown || player.ct_flahes_thrown || 0),
            tFlashesThrown: Number(player.t_flashes_thrown || player.t_flahes_thrown || 0),
            flashesThrownInPistolRound: Number(player.flashes_thrown_in_pistol_round || player.flahes_thrown_in_pistol_round || 0),
            heThrown: Number(player.he_thrown || 0),
            ctHeThrown: Number(player.ct_he_thrown || 0),
            tHeThrown: Number(player.t_he_thrown || 0),
            heThrownInPistolRound: Number(player.he_thrown_in_pistol_round || 0),
            infernosThrown: Number(player.infernos_thrown || 0),
            ctInfernosThrown: Number(player.ct_infernos_thrown || 0),
            tInfernosThrown: Number(player.t_infernos_thrown || 0),
            infernosThrownInPistolRound: Number(player.infernos_thrown_in_pistol_round || 0),
            smokesThrown: Number(player.smokes_thrown || 0),
            ctSmokesThrown: Number(player.ct_smokes_thrown || 0),
            tSmokesThrown: Number(player.t_smokes_thrown || 0),
            smokesThrownInPistolRound: Number(player.smokes_thrown_in_pistol_round || 0),
            totalUtilityThrown: Number(player.total_utility || 0),
            event: player.event || 'IEM_Katowice_2025' // Include event info
          }));

          console.log(`Loaded ${players.length} players from parquet file`);
          resolve(players);
        } catch (jsonError) {
          console.error('Error parsing JSON from Python output:', jsonError);
          reject(jsonError);
        }
      });
    });
  } catch (error) {
    console.error('Error loading parquet data:', error);
    throw error;
  }
}

/**
 * Fallback function to load data from CSV if parquet fails
 */
async function loadDataFromCSV(csvPath: string): Promise<PlayerRawStats[]> {
  try {
    // Create a temporary Python script to read the CSV file
    const scriptContent = `
import pandas as pd
import json
import sys

# Load the CSV file
df = pd.read_csv('${csvPath}')

# Convert to JSON and print to stdout
print(df.to_json(orient='records'))
`;

    const scriptPath = path.join(process.cwd(), 'temp_csv_reader.py');
    fs.writeFileSync(scriptPath, scriptContent);

    // Execute the Python script to read the CSV file
    return new Promise((resolve, reject) => {
      exec(`python ${scriptPath}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        // Clean up the temporary script
        try { fs.unlinkSync(scriptPath); } catch (e) { console.error(e); }

        if (error) {
          console.error(`Error executing Python script for CSV: ${error.message}`);
          console.error(stderr);
          reject(error);
          return;
        }

        try {
          const jsonData = JSON.parse(stdout);
          // Convert to PlayerRawStats format (same as parquet conversion)
          const players = jsonData.map((player: any) => ({
            steamId: player.steam_id || player.steamId,
            userName: player.name || player.userName,
            teamName: player.team || player.teamName,
            kills: Number(player.kills || 0),
            headshots: Number(player.headshots || 0),
            wallbangKills: Number(player.wallbang_kills || 0),
            assistedFlashes: Number(player.assisted_flashes || 0),
            noScope: Number(player.no_scope || 0),
            throughSmoke: Number(player.through_smoke || 0),
            blindKills: Number(player.blind_kills || 0),
            victimBlindKills: Number(player.victim_blind_kills || 0),
            assists: Number(player.assists || 0),
            deaths: Number(player.deaths || 0),
            kd: Number(player.kd || 0),
            totalRoundsWon: Number(player.total_rounds_won || 0),
            tRoundsWon: Number(player.t_rounds_won || 0),
            ctRoundsWon: Number(player.ct_rounds_won || 0),
            firstKills: Number(player.first_kills || 0),
            ctFirstKills: Number(player.ct_first_kills || 0),
            tFirstKills: Number(player.t_first_kills || 0),
            firstDeaths: Number(player.first_deaths || 0),
            ctFirstDeaths: Number(player.ct_first_deaths || 0),
            tFirstDeaths: Number(player.t_first_deaths || 0),
            flashesThrown: Number(player.flashes_thrown || player.flahes_thrown || 0),
            ctFlashesThrown: Number(player.ct_flashes_thrown || player.ct_flahes_thrown || 0),
            tFlashesThrown: Number(player.t_flashes_thrown || player.t_flahes_thrown || 0),
            flashesThrownInPistolRound: Number(player.flashes_thrown_in_pistol_round || player.flahes_thrown_in_pistol_round || 0),
            heThrown: Number(player.he_thrown || 0),
            ctHeThrown: Number(player.ct_he_thrown || 0),
            tHeThrown: Number(player.t_he_thrown || 0),
            heThrownInPistolRound: Number(player.he_thrown_in_pistol_round || 0),
            infernosThrown: Number(player.infernos_thrown || 0),
            ctInfernosThrown: Number(player.ct_infernos_thrown || 0),
            tInfernosThrown: Number(player.t_infernos_thrown || 0),
            infernosThrownInPistolRound: Number(player.infernos_thrown_in_pistol_round || 0),
            smokesThrown: Number(player.smokes_thrown || 0),
            ctSmokesThrown: Number(player.ct_smokes_thrown || 0),
            tSmokesThrown: Number(player.t_smokes_thrown || 0),
            smokesThrownInPistolRound: Number(player.smokes_thrown_in_pistol_round || 0),
            totalUtilityThrown: Number(player.total_utility || 0),
            event: player.event || 'IEM_Katowice_2025' // Include event info
          }));

          console.log(`Loaded ${players.length} players from CSV file`);
          resolve(players);
        } catch (jsonError) {
          console.error('Error parsing JSON from Python CSV output:', jsonError);
          reject(jsonError);
        }
      });
    });
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw error;
  }
}
