// Import dependencies from 'pyarrow'
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { PlayerRawStats } from '@shared/schema';

/**
 * Runs the Python data cleaner script to process raw CSV files
 * @returns Promise<void>
 */
export async function runDataCleaner(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Running Python data cleaner...');
    exec('python clean.py', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running data cleaner: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`Data cleaner stderr: ${stderr}`);
      }
      console.log(stdout);
      resolve();
    });
  });
}

/**
 * Reads player data from the Parquet file using a Python helper script
 * @returns Promise<PlayerRawStats[]>
 */
export async function loadPlayerDataFromParquet(): Promise<PlayerRawStats[]> {
  // Create a temporary Python script to read the Parquet file and output JSON
  const scriptContent = `
import pandas as pd
import json
import sys

try:
    # Read the Parquet file
    df = pd.read_parquet('clean/events.parquet')
    
    # Convert to JSON and print to stdout
    json_data = df.to_json(orient='records')
    print(json_data)
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;

  const tempScriptPath = './temp_parquet_reader.py';
  
  try {
    // Write the temporary script
    await fs.writeFile(tempScriptPath, scriptContent);
    
    // Execute the script and capture output
    return new Promise<PlayerRawStats[]>((resolve, reject) => {
      exec('python temp_parquet_reader.py', { maxBuffer: 10 * 1024 * 1024 }, async (error, stdout, stderr) => {
        try {
          // Clean up the temporary script
          await fs.unlink(tempScriptPath).catch(e => console.warn(`Could not delete temp script: ${e}`));
          
          if (error) {
            console.error(`Error running Parquet reader: ${error.message}`);
            return reject(error);
          }
          if (stderr) {
            console.error(`Parquet reader stderr: ${stderr}`);
          }
          
          // Parse the JSON output
          const data = JSON.parse(stdout) as any[];
          
          // Convert to PlayerRawStats format
          const players: PlayerRawStats[] = data.map(item => ({
            steamId: item.steam_id,
            userName: item.user_name,
            teamName: item.team_clan_name,
            kills: item.kills,
            headshots: item.headshots,
            wallbangKills: item.wallbang_kills || 0,
            assistedFlashes: item.assisted_flashes || 0,
            noScope: item.no_scope || 0,
            throughSmoke: item.through_smoke || 0,
            blindKills: item.blind_kills || 0,
            victimBlindKills: item.victim_blind_kills || 0,
            assists: item.assists,
            deaths: item.deaths,
            kd: item.kd,
            totalRoundsWon: item.total_rounds_won,
            tRoundsWon: item.t_rounds_won,
            ctRoundsWon: item.ct_rounds_won,
            firstKills: item.first_kills,
            ctFirstKills: item.ct_first_kills,
            tFirstKills: item.t_first_kills,
            firstDeaths: item.first_deaths,
            ctFirstDeaths: item.ct_first_deaths,
            tFirstDeaths: item.t_first_deaths,
            flashesThrown: item.flashes_thrown,
            ctFlashesThrown: item.ct_flashes_thrown,
            tFlashesThrown: item.t_flashes_thrown,
            flashesThrownInPistolRound: item.flashes_thrown_in_pistol_round,
            heThrown: item.he_thrown,
            ctHeThrown: item.ct_he_thrown,
            tHeThrown: item.t_he_thrown,
            heThrownInPistolRound: item.he_thrown_in_pistol_round,
            infernosThrown: item.incendiaries_thrown || item.infernos_thrown || 0,
            ctInfernosThrown: item.ct_incendiaries_thrown || item.ct_infernos_thrown || 0,
            tInfernosThrown: item.t_incendiaries_thrown || item.t_infernos_thrown || 0,
            infernosThrownInPistolRound: item.incendiaries_thrown_in_pistol_round || item.infernos_thrown_in_pistol_round || 0,
            smokesThrown: item.smokes_thrown,
            ctSmokesThrown: item.ct_smokes_thrown,
            tSmokesThrown: item.t_smokes_thrown,
            smokesThrownInPistolRound: item.smokes_thrown_in_pistol_round,
            totalUtilityThrown: item.total_utility_thrown,
          }));
          
          console.log(`Loaded ${players.length} players from Parquet file`);
          resolve(players);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  } catch (err) {
    console.error(`Error in loadPlayerDataFromParquet: ${err}`);
    throw err;
  }
}
