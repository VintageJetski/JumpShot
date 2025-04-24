import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { PlayerRole } from '@shared/schema';

/**
 * Interface for player role data from CSV
 */
export interface PlayerRoleInfo {
  team: string;
  previousTeam?: string;
  player: string;
  isIGL: boolean;
  tRole: PlayerRole;
  ctRole: PlayerRole;
}

/**
 * Parse the roles CSV file and return player role information
 */
export async function parsePlayerRolesFromCSV(filePath: string): Promise<PlayerRoleInfo[]> {
  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const playerRoles: PlayerRoleInfo[] = [];

    for (const record of records) {
      if (!record.Player || !record.Team) continue;

      const roleInfo: PlayerRoleInfo = {
        team: record.Team.trim(),
        previousTeam: record['Previous team'] ? record['Previous team'].trim() : undefined,
        player: record.Player.trim(),
        isIGL: record['In-Game Leader?'] === 'Yes',
        tRole: mapToPlayerRole(record['T Role']),
        ctRole: mapToPlayerRole(record['CT Role']),
      };

      playerRoles.push(roleInfo);
    }

    return playerRoles;
  } catch (error) {
    console.error('Error parsing player roles CSV:', error);
    return [];
  }
}

/**
 * Convert role string from CSV to PlayerRole enum
 */
function mapToPlayerRole(roleString: string): PlayerRole {
  const normalizedRole = roleString.trim();
  
  // Map CSV role names to our PlayerRole enum
  switch (normalizedRole) {
    case 'AWP':
      return PlayerRole.AWP;
    case 'Lurker':
      return PlayerRole.Lurker;
    case 'Spacetaker':
      return PlayerRole.Spacetaker;
    case 'Support':
      return PlayerRole.Support;
    case 'Anchor':
      return PlayerRole.Anchor;
    case 'Rotator':
      return PlayerRole.Rotator;
    default:
      console.warn(`Unknown role: ${normalizedRole}, defaulting to Support`);
      return PlayerRole.Support;
  }
}

/**
 * Load player roles from the CSV file in attached_assets
 */
export async function loadPlayerRoles(): Promise<Map<string, PlayerRoleInfo>> {
  const filePath = path.join(process.cwd(), 'attached_assets', 'CS2dkbasics - Teams and roles.csv');
  const playerRoles = await parsePlayerRolesFromCSV(filePath);
  
  // Create a map with player name as key for easy lookup
  const playerRoleMap = new Map<string, PlayerRoleInfo>();
  playerRoles.forEach(role => {
    // Remove any parenthetical additions to player names for better matching
    const cleanName = role.player.replace(/\s*\([^)]*\)\s*/g, '').trim();
    playerRoleMap.set(cleanName, role);
  });
  
  return playerRoleMap;
}

/**
 * Find role info for a player by fuzzy matching names
 */
export function findPlayerRoleInfo(playerName: string, roleMap: Map<string, PlayerRoleInfo>): PlayerRoleInfo | undefined {
  // First, try exact match
  const cleanName = playerName.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (roleMap.has(cleanName)) {
    return roleMap.get(cleanName);
  }
  
  // Try lowercase comparison
  const lowerName = cleanName.toLowerCase();
  for (const [key, value] of roleMap.entries()) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // No match found
  return undefined;
}