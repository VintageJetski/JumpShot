import { db } from './db.js';

/**
 * Simple role data fetcher - gets roles directly from database
 */
export async function getSimpleRoles(): Promise<Map<string, { isIGL: boolean; tRole: string; ctRole: string }>> {
  const query = `
    SELECT steam_id, in_game_leader, t_role, ct_role 
    FROM roles
  `;
  
  const result = await db.execute(query);
  const roleMap = new Map();
  
  for (const row of result.rows) {
    roleMap.set(String(row.steam_id), {
      isIGL: row.in_game_leader === 't' || row.in_game_leader === true,
      tRole: row.t_role || 'Unassigned',
      ctRole: row.ct_role || 'Unassigned'
    });
  }
  
  console.log(`📋 Loaded ${roleMap.size} role assignments`);
  return roleMap;
}