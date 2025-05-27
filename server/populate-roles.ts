import { loadPlayerRoles } from './loadRoleData';
import { db } from './db';

/**
 * Populate the roles table with data from CSV
 */
async function populateRolesTable() {
  try {
    console.log('Loading role data from CSV...');
    const roleMap = await loadPlayerRoles();
    console.log(`Loaded ${roleMap.size} role assignments from CSV`);
    
    // Convert Map to array of role objects
    const roles = Array.from(roleMap.values()).map(roleInfo => ({
      steam_id: 0, // We'll need to match this with actual steam_ids from players table
      team_name: roleInfo.team,
      player_name: roleInfo.player,
      is_igl: roleInfo.isIGL,
      t_role: roleInfo.tRole,
      ct_role: roleInfo.ctRole
    }));
    
    // First, let's get all players with their steam_ids to match with role data
    const playersQuery = `
      SELECT DISTINCT steam_id, user_name 
      FROM player_stats 
      WHERE user_name IS NOT NULL
    `;
    
    const playersResult = await db.execute(playersQuery);
    const players = playersResult.rows as { steam_id: number, user_name: string }[];
    
    console.log(`Found ${players.length} players in database`);
    
    // Create a map of player name to steam_id for matching
    const playerSteamIdMap = new Map<string, number>();
    players.forEach(player => {
      playerSteamIdMap.set(player.user_name.toLowerCase(), player.steam_id);
      // Also store variations for better matching
      const cleanName = player.user_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      playerSteamIdMap.set(cleanName, player.steam_id);
    });
    
    // Match role data with steam_ids and insert
    let insertedCount = 0;
    for (const role of roles) {
      // Try to find matching steam_id
      const playerNameLower = role.player_name.toLowerCase();
      const cleanPlayerName = role.player_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      let steamId = playerSteamIdMap.get(playerNameLower) || playerSteamIdMap.get(cleanPlayerName);
      
      if (steamId) {
        try {
          await db.execute(
            `INSERT INTO roles (steam_id, team_name, player_name, is_igl, t_role, ct_role) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [steamId, role.team_name, role.player_name, role.is_igl, role.t_role, role.ct_role]
          );
          insertedCount++;
        } catch (error) {
          console.warn(`Failed to insert role for ${role.player_name}:`, error);
        }
      } else {
        console.warn(`No steam_id found for player: ${role.player_name}`);
      }
    }
    
    console.log(`Successfully inserted ${insertedCount} role assignments into database`);
    
    // Verify the data
    const verifyResult = await db.execute('SELECT COUNT(*) as count FROM roles');
    const count = (verifyResult.rows[0] as any).count;
    console.log(`Total roles in database: ${count}`);
    
  } catch (error) {
    console.error('Error populating roles table:', error);
  }
}

// Run the population if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateRolesTable().then(() => {
    console.log('Role population complete');
    process.exit(0);
  }).catch(error => {
    console.error('Role population failed:', error);
    process.exit(1);
  });
}

export { populateRolesTable };