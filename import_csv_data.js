// Import CSV data to Supabase
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse/sync');

// Supabase configuration
const supabaseUrl = 'https://rrtfmkpqembrnieogqmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydGZta3BxZW1icm5pZW9ncW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzU3NTgsImV4cCI6MjA2MDg1MTc1OH0.vGYFngVJawK0xPzKHX-HbIxwaswluZ65N89KXrZHilQ';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to CSV files
const playerStatsFile = path.join(__dirname, 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv');
const roundsFile = path.join(__dirname, 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - rounds (IEM_Katowice_2025).csv');
const rolesFile = path.join(__dirname, 'attached_assets', 'CS2dkbasics - Teams and roles.csv');

// Utility functions
function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Load CSV files
function loadCSV(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (error) {
    console.error(`Error loading CSV file ${filePath}:`, error);
    return [];
  }
}

// Import player roles
async function importPlayerRoles() {
  console.log('Importing player roles...');
  
  const rolesData = loadCSV(rolesFile);
  if (!rolesData.length) {
    console.error('No roles data found');
    return;
  }
  
  console.log(`Loaded ${rolesData.length} player roles from CSV`);
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < rolesData.length; i += batchSize) {
    const batch = rolesData.slice(i, i + batchSize);
    
    for (const entry of batch) {
      const player = {
        steam_id: entry.steam_id || entry.Steam_ID || entry.steamID || entry.player_id || '',
        t_role: entry.T_Role || entry.TRole || entry.tRole || 'Support',
        ct_role: entry.CT_Role || entry.CTRole || entry.ctRole || 'Anchor',
        is_igl: (entry.IGL || entry.isIGL || '').toLowerCase() === 'true' || 
                (entry.IGL || entry.isIGL || '').toLowerCase() === 'yes' || 
                (entry.IGL || entry.isIGL || '') === '1'
      };
      
      if (!player.steam_id) {
        console.log('Skipping role entry without steam_id:', entry);
        continue;
      }
      
      // Check if player exists
      const { data: existingPlayer } = await supabase
        .from('player_roles')
        .select('*')
        .eq('steam_id', player.steam_id)
        .maybeSingle();
      
      if (existingPlayer) {
        // Update existing player
        const { error } = await supabase
          .from('player_roles')
          .update(player)
          .eq('steam_id', player.steam_id);
          
        if (error) {
          console.error('Error updating player role:', error);
        } else {
          console.log(`Updated role for player ${player.steam_id}`);
        }
      } else {
        // Insert new player
        const { error } = await supabase
          .from('player_roles')
          .insert(player);
          
        if (error) {
          console.error('Error inserting player role:', error);
        } else {
          console.log(`Inserted role for player ${player.steam_id}`);
        }
      }
    }
    
    // Pause between batches to avoid rate limits
    await sleep(1000);
  }
  
  console.log('Player roles import completed');
}

// Import player stats
async function importPlayerStats() {
  console.log('Importing player stats...');
  
  const playerStatsData = loadCSV(playerStatsFile);
  if (!playerStatsData.length) {
    console.error('No player stats data found');
    return;
  }
  
  console.log(`Loaded ${playerStatsData.length} player stats from CSV`);
  
  // Get existing teams to match team names
  const { data: teamsData } = await supabase
    .from('teams')
    .select('*');
    
  const teams = teamsData || [];
  console.log(`Found ${teams.length} teams in database`);
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < playerStatsData.length; i += batchSize) {
    const batch = playerStatsData.slice(i, i + batchSize);
    
    for (const entry of batch) {
      // Find matching team
      const teamName = entry.team || entry.Team || '';
      const matchingTeam = teams.find(t => 
        t.team_clan_name?.toLowerCase() === teamName.toLowerCase()
      );
      
      const playerStat = {
        steam_id: entry.steam_id || entry.steamid || entry.SteamID || entry.player_id || '',
        user_name: entry.name || entry.Name || entry.player_name || '',
        team_clan_name: matchingTeam?.team_clan_name || teamName,
        kills: normalizeNumber(entry.kills || entry.Kills || 0),
        headshots: normalizeNumber(entry.headshots || entry.hs || entry.Headshots || 0),
        wallbang_kills: normalizeNumber(entry.wallbang_kills || 0),
        assisted_flashes: normalizeNumber(entry.flash_assists || entry.flashassists || 0),
        no_scope: normalizeNumber(entry.no_scope || 0),
        through_smoke: normalizeNumber(entry.smoke_kills || entry.throughsmoke || 0),
        blind_kills: normalizeNumber(entry.blind_kills || 0),
        victim_blind_kills: normalizeNumber(entry.victim_blind_kills || 0),
        assists: normalizeNumber(entry.assists || entry.Assists || 0),
        deaths: normalizeNumber(entry.deaths || entry.Deaths || 0),
        kd: normalizeNumber(entry.kd || entry.KD || entry.kdr || (entry.kills && entry.deaths ? entry.kills / entry.deaths : 0)),
        total_rounds_won: normalizeNumber(entry.rounds_won || 0),
        t_rounds_won: normalizeNumber(entry.t_rounds_won || 0),
        ct_rounds_won: normalizeNumber(entry.ct_rounds_won || 0),
        first_kills: normalizeNumber(entry.first_kills || entry.firstkills || 0),
        ct_first_kills: normalizeNumber(entry.ct_first_kills || 0),
        t_first_kills: normalizeNumber(entry.t_first_kills || 0),
        first_deaths: normalizeNumber(entry.first_deaths || entry.firstdeaths || 0),
        ct_first_deaths: normalizeNumber(entry.ct_first_deaths || 0),
        t_first_deaths: normalizeNumber(entry.t_first_deaths || 0),
        flashes_thrown: normalizeNumber(entry.flashes_thrown || 0),
        ct_flashes_thrown: normalizeNumber(entry.ct_flashes_thrown || 0),
        t_flashes_thrown: normalizeNumber(entry.t_flashes_thrown || 0),
        flashes_thrown_in_pistol_round: normalizeNumber(entry.flashes_thrown_in_pistol_round || 0),
        he_thrown: normalizeNumber(entry.he_thrown || 0),
        ct_he_thrown: normalizeNumber(entry.ct_he_thrown || 0),
        t_he_thrown: normalizeNumber(entry.t_he_thrown || 0),
        he_thrown_in_pistol_round: normalizeNumber(entry.he_thrown_in_pistol_round || 0),
        infernos_thrown: normalizeNumber(entry.infernos_thrown || 0),
        ct_infernos_thrown: normalizeNumber(entry.ct_infernos_thrown || 0),
        t_infernos_thrown: normalizeNumber(entry.t_infernos_thrown || 0),
        infernos_thrown_in_pistol_round: normalizeNumber(entry.infernos_thrown_in_pistol_round || 0),
        smokes_thrown: normalizeNumber(entry.smokes_thrown || 0),
        ct_smokes_thrown: normalizeNumber(entry.ct_smokes_thrown || 0),
        t_smokes_thrown: normalizeNumber(entry.t_smokes_thrown || 0),
        smokes_thrown_in_pistol_round: normalizeNumber(entry.smokes_thrown_in_pistol_round || 0),
        total_utility_thrown: normalizeNumber(entry.total_utility_thrown || 0),
        
        // Calculated metrics based on available data
        piv: normalizeNumber(entry.piv || entry.PIV || 0),
        role: entry.role || entry.Role || '',
        secondary_role: entry.secondary_role || '',
        is_main_awper: (entry.is_main_awper || entry.primary_weapon === 'AWP' || '').toLowerCase() === 'true',
        is_igl: (entry.is_igl || entry.igl || '').toLowerCase() === 'true'
      };
      
      if (!playerStat.steam_id || !playerStat.user_name) {
        console.log('Skipping player stats without id or username:', entry);
        continue;
      }
      
      // Check if player exists
      const { data: existingStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('steam_id', playerStat.steam_id)
        .maybeSingle();
      
      if (existingStats) {
        // Update existing player stats
        const { error } = await supabase
          .from('player_stats')
          .update(playerStat)
          .eq('id', existingStats.id);
          
        if (error) {
          console.error('Error updating player stats:', error);
        } else {
          console.log(`Updated stats for player ${playerStat.user_name}`);
        }
      } else {
        // Insert new player stats
        const { error } = await supabase
          .from('player_stats')
          .insert(playerStat);
          
        if (error) {
          console.error('Error inserting player stats:', error);
        } else {
          console.log(`Inserted stats for player ${playerStat.user_name}`);
        }
      }
    }
    
    // Pause between batches to avoid rate limits
    await sleep(1000);
  }
  
  console.log('Player stats import completed');
}

// Import rounds data
async function importRounds() {
  console.log('Importing rounds data...');
  
  const roundsData = loadCSV(roundsFile);
  if (!roundsData.length) {
    console.error('No rounds data found');
    return;
  }
  
  console.log(`Loaded ${roundsData.length} rounds from CSV`);
  
  // Group rounds by match ID (or map + teams if match_id not available)
  const matchGroups = {};
  
  for (const round of roundsData) {
    const matchKey = round.match_id || `${round.map || 'unknown'}_${round.ct_team}_vs_${round.t_team}`;
    
    if (!matchGroups[matchKey]) {
      matchGroups[matchKey] = [];
    }
    
    matchGroups[matchKey].push(round);
  }
  
  console.log(`Grouped rounds into ${Object.keys(matchGroups).length} matches`);
  
  // Process each match
  for (const [matchKey, rounds] of Object.entries(matchGroups)) {
    if (!rounds.length) continue;
    
    const firstRound = rounds[0];
    
    // Create match entry
    const match = {
      team1: firstRound.ct_team || '',
      team2: firstRound.t_team || '',
      winner: '', // Will be calculated
      score: '', // Will be calculated
      map: firstRound.map || '',
      event: 'IEM Katowice 2025',
      match_date: new Date().toISOString()
    };
    
    // Calculate winner and score
    let ctWins = 0, tWins = 0;
    for (const round of rounds) {
      if (round.winner === 'ct') {
        ctWins++;
      } else if (round.winner === 't') {
        tWins++;
      }
    }
    
    match.winner = ctWins > tWins ? match.team1 : ctWins < tWins ? match.team2 : 'Draw';
    match.score = `${ctWins}-${tWins}`;
    
    // Insert match
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert(match)
      .select();
      
    if (matchError) {
      console.error('Error creating match:', matchError);
      continue;
    }
    
    const matchId = matchData[0].id;
    console.log(`Created match ${matchId}: ${match.team1} vs ${match.team2} on ${match.map}`);
    
    // Insert rounds for this match
    const roundsBatch = rounds.map(round => ({
      match_id: matchId,
      round_num: normalizeNumber(round.round_num || round.round || 0),
      winner: round.winner || '',
      reason: round.win_reason || round.reason || '',
      bomb_plant: (round.bomb_planted || '').toLowerCase() === 'true',
      bomb_site: round.bomb_site || '',
      ct_team: round.ct_team || '',
      t_team: round.t_team || '',
      winner_team: round.winner === 'ct' ? round.ct_team : round.t_team,
      ct_equip_value: normalizeNumber(round.ct_equip_value || 0),
      t_equip_value: normalizeNumber(round.t_equip_value || 0),
      ct_losing_streak: normalizeNumber(round.ct_losing_streak || 0),
      t_losing_streak: normalizeNumber(round.t_losing_streak || 0),
      ct_buy_type: round.ct_buy_type || '',
      t_buy_type: round.t_buy_type || '',
      first_advantage: round.first_advantage || '',
      demo_file_name: round.demo_file || '',
      map: round.map || '',
      start_time: round.start_time || null,
      freeze_end_time: round.freeze_end_time || null,
      end_time: round.end_time || null,
      bomb_plant_time: round.bomb_plant_time || null
    }));
    
    // Insert rounds in batches
    const batchSize = 50;
    for (let i = 0; i < roundsBatch.length; i += batchSize) {
      const batch = roundsBatch.slice(i, i + batchSize);
      
      const { error: roundsError } = await supabase
        .from('rounds')
        .insert(batch);
        
      if (roundsError) {
        console.error('Error inserting rounds:', roundsError);
      } else {
        console.log(`Inserted ${batch.length} rounds for match ${matchId}`);
      }
      
      // Pause between batches
      await sleep(500);
    }
  }
  
  console.log('Rounds import completed');
}

// Update team statistics
async function updateTeamStats() {
  console.log('Updating team statistics...');
  
  // Get all teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*');
    
  if (teamsError) {
    console.error('Error fetching teams:', teamsError);
    return;
  }
  
  for (const team of teams) {
    // Get all players for this team
    const { data: playerStats, error: playerError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('team_clan_name', team.team_clan_name);
      
    if (playerError) {
      console.error(`Error fetching players for team ${team.team_clan_name}:`, playerError);
      continue;
    }
    
    if (!playerStats || !playerStats.length) {
      console.log(`No players found for team ${team.team_clan_name}`);
      continue;
    }
    
    console.log(`Processing ${playerStats.length} players for team ${team.team_clan_name}`);
    
    // Calculate team metrics
    const sumPIV = playerStats.reduce((sum, player) => sum + normalizeNumber(player.piv), 0);
    const avgPIV = playerStats.length > 0 ? sumPIV / playerStats.length : 0;
    
    // Find top player
    playerStats.sort((a, b) => normalizeNumber(b.piv) - normalizeNumber(a.piv));
    const topPlayer = playerStats[0] || { user_name: '', piv: 0 };
    
    // Simple synergy calculation
    const roleCount = {};
    for (const player of playerStats) {
      const role = player.role || 'Unknown';
      roleCount[role] = (roleCount[role] || 0) + 1;
    }
    
    // Higher synergy if team has balanced roles
    const idealCount = playerStats.length / Object.keys(roleCount).length;
    const roleDifferences = Object.values(roleCount).map(count => Math.abs(count - idealCount));
    const roleBalance = 1 - (roleDifferences.reduce((sum, diff) => sum + diff, 0) / playerStats.length);
    
    // Calculate TIR based on sumPIV and synergy
    const synergy = roleBalance * 0.8; // Scale to reasonable value
    const tir = sumPIV * (1 + synergy * 0.2); // TIR formula: sum PIV with synergy bonus
    
    // Update team
    const teamUpdate = {
      tir: tir,
      sum_piv: sumPIV,
      synergy: synergy,
      avg_piv: avgPIV,
      top_player_name: topPlayer.user_name,
      top_player_piv: normalizeNumber(topPlayer.piv)
    };
    
    const { error: updateError } = await supabase
      .from('teams')
      .update(teamUpdate)
      .eq('id', team.id);
      
    if (updateError) {
      console.error(`Error updating stats for team ${team.team_clan_name}:`, updateError);
    } else {
      console.log(`Updated stats for team ${team.team_clan_name}: TIR=${tir.toFixed(2)}, PIV Sum=${sumPIV.toFixed(2)}`);
    }
    
    // Pause between teams
    await sleep(500);
  }
  
  console.log('Team statistics update completed');
}

// Main function to run all imports
async function main() {
  try {
    console.log('Starting data import to Supabase...');
    
    // Import all data in sequence
    await importPlayerRoles();
    await importPlayerStats();
    await importRounds();
    await updateTeamStats();
    
    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error during data import:', error);
  }
}

// Run the main function
main();