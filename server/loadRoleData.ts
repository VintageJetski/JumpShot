import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { PlayerRole } from '../shared/schema';

export interface PlayerRoleInfo {
  team: string;
  player: string;
  isIGL: boolean;
  tRole: PlayerRole;
  ctRole: PlayerRole;
}

/**
 * Load player role information from the Teams and roles CSV
 */
export async function loadPlayerRoles(): Promise<Map<string, PlayerRoleInfo>> {
  const roleMap = new Map<string, PlayerRoleInfo>();
  
  try {
    const filePath = path.resolve(process.cwd(), 'attached_assets', 'CS2dkbasics - Teams and roles (1).csv');
    console.log(`Loading player roles from: ${filePath}`);
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
      .on('data', (row: any) => {
        // Skip empty rows or header rows
        if (!row.Player || !row.Team || row.Player === 'Player') {
          return;
        }
        
        // Map role strings to PlayerRole enum
        const mapRole = (roleStr: string): PlayerRole => {
          switch (roleStr?.trim()) {
            case 'Support': return PlayerRole.Support;
            case 'Spacetaker': return PlayerRole.Spacetaker;
            case 'Lurker': return PlayerRole.Lurker;
            case 'AWP': return PlayerRole.AWP;
            case 'Anchor': return PlayerRole.Anchor;
            case 'Rotator': return PlayerRole.Rotator;
            default: return PlayerRole.Support; // Default fallback
          }
        };
        
        // Clean player name (handle parenthetical info like "sh1ro (SH1R0)")
        let playerName = row.Player.trim();
        
        // Handle special cases in the CSV
        if (playerName.includes('(') && playerName.includes(')')) {
          // For cases like "sh1ro (SH1R0)", try both versions
          const mainName = playerName.split('(')[0].trim();
          const altName = playerName.match(/\(([^)]+)\)/)?.[1]?.trim();
          
          const roleInfo: PlayerRoleInfo = {
            team: row.Team.trim(),
            player: playerName,
            isIGL: row['In-Game Leader?']?.trim().toLowerCase() === 'yes',
            tRole: mapRole(row['T Role']),
            ctRole: mapRole(row['CT Role'])
          };
          
          // Add both versions to the map
          roleMap.set(mainName, roleInfo);
          if (altName) {
            roleMap.set(altName, roleInfo);
          }
          roleMap.set(playerName, roleInfo); // Original full name
        } else {
          const roleInfo: PlayerRoleInfo = {
            team: row.Team.trim(),
            player: playerName,
            isIGL: row['In-Game Leader?']?.trim().toLowerCase() === 'yes',
            tRole: mapRole(row['T Role']),
            ctRole: mapRole(row['CT Role'])
          };
          
          roleMap.set(playerName, roleInfo);
        }
      })
      .on('end', () => {
        console.log(`Loaded role information for ${roleMap.size} player entries`);
        resolve(roleMap);
      })
      .on('error', (error) => {
        console.error('Error parsing role CSV:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error loading player roles:', error);
    return roleMap; // Return empty map if file doesn't exist
  }
}