/**
 * Data Integrity Module
 * 
 * This module provides enhanced data integrity verification and error handling
 * to ensure all data meets expected formats and contains all required fields.
 */

import { PlayerRawStats } from './types';
import { DataSource } from './data-controller';

// Import these types from where they are actually defined
interface PlayerWithPIV {
  id: string;
  name: string;
  team: string;
  role: any;
  piv: number;
  rawStats: PlayerRawStats;
  [key: string]: any;
}

interface TeamWithTIR {
  id: string;
  name: string;
  tir: number;
  players: PlayerWithPIV[];
  [key: string]: any;
}

// Validation levels for data integrity checks
export enum ValidationLevel {
  STRICT = 'strict',     // Throw errors on validation failures
  MODERATE = 'moderate', // Log warnings but try to fix data
  LENIENT = 'lenient'    // Fix data silently without logging
}

// Global validation level, can be configured
let currentValidationLevel = ValidationLevel.MODERATE;

/**
 * Set the validation level for data integrity checks
 */
export function setValidationLevel(level: ValidationLevel): void {
  currentValidationLevel = level;
  console.log(`Data integrity validation level set to: ${level}`);
}

/**
 * Get the current validation level
 */
export function getValidationLevel(): ValidationLevel {
  return currentValidationLevel;
}

/**
 * Log a data integrity issue with appropriate severity
 */
export function logIntegrityIssue(
  source: string | DataSource,
  entity: string,
  field: string,
  issue: string,
  severity: 'error' | 'warning' | 'info' = 'warning'
): void {
  const timestamp = new Date().toISOString();
  const message = `[DATA INTEGRITY] [${severity.toUpperCase()}] [${timestamp}] Source: ${source}, Entity: ${entity}, Field: ${field} - ${issue}`;
  
  switch (severity) {
    case 'error':
      console.error(message);
      break;
    case 'warning':
      console.warn(message);
      break;
    case 'info':
      console.info(message);
      break;
  }
}

/**
 * Validate a player object for data integrity
 * @returns The validated player object with fixes applied
 */
export function validatePlayer(
  player: Partial<PlayerRawStats>, 
  source: string | DataSource
): PlayerRawStats {
  const validated: PlayerRawStats = {} as PlayerRawStats;
  
  // Validate required fields
  const requiredFields = ['id', 'name', 'team'];
  for (const field of requiredFields) {
    if (!player[field]) {
      const message = `Missing required field: ${field}`;
      
      if (currentValidationLevel === ValidationLevel.STRICT) {
        throw new Error(message);
      }
      
      // For moderate and lenient, try to fix the issue
      logIntegrityIssue(source, 'Player', field, message, 'warning');
      validated[field] = field === 'id' ? `unknown-${Date.now()}` : field === 'name' ? 'Unknown Player' : '';
    } else {
      validated[field] = player[field];
    }
  }
  
  // Validate numeric fields (use defaults if invalid)
  const numericFields = [
    'hs', 'adr', 'kpr', 'dpr', 'kd', 'impact', 'kast', 'flashAssists', 
    'utilityDamage', 'openingKills', 'openingDeaths', 'clutchesWon', 
    'tradingSuccess', 'consistencyScore', 'pivValue', 'damage', 'kills', 
    'deaths', 'assists', 'killAssists', 'incendiaryDamage', 'molotovDamage', 
    'heDamage', 'entrySuccess', 'entryAttempts', 'multiKills', 'oneVXs', 
    'oneVXAttempts', 'HSPercent', 'flashesThrown', 'smkThrown', 'heThrown', 
    'molliesThrown', 'roundsPlayed', 'mapsPlayed', 'firstKills', 'firstDeaths', 
    'tradedDeaths', 'tradedKills', 'survivedRounds', 'rounds_ct', 'rounds_t', 
    'kills_t', 'deaths_t', 'adr_t', 'kast_t', 'kills_ct', 'deaths_ct', 'adr_ct', 
    'kast_ct', 'wallbangKills', 'assistedFlashes', 'noScope', 'throughSmoke'
  ];
  
  for (const field of numericFields) {
    const value = player[field];
    if (value === undefined || value === null || isNaN(Number(value))) {
      if (currentValidationLevel !== ValidationLevel.LENIENT) {
        logIntegrityIssue(source, 'Player', field, `Invalid numeric value: ${value}`, 'info');
      }
      validated[field] = 0;
    } else {
      validated[field] = Number(value);
    }
  }
  
  // Ensure we have the required string fields
  const stringFields = ['steamId', 'userName', 'teamName'];
  for (const field of stringFields) {
    if (!player[field]) {
      if (currentValidationLevel !== ValidationLevel.LENIENT) {
        logIntegrityIssue(source, 'Player', field, `Missing string field`, 'info');
      }
      
      // Default values based on existing fields
      if (field === 'steamId') validated[field] = validated.id || '';
      else if (field === 'userName') validated[field] = validated.name || '';
      else if (field === 'teamName') validated[field] = validated.team || '';
    } else {
      validated[field] = String(player[field]);
    }
  }
  
  // Validate boolean fields
  if (typeof player.isIGL !== 'boolean') {
    if (currentValidationLevel !== ValidationLevel.LENIENT) {
      logIntegrityIssue(source, 'Player', 'isIGL', `Invalid boolean value: ${player.isIGL}`, 'info');
    }
    validated.isIGL = Boolean(player.isIGL);
  } else {
    validated.isIGL = player.isIGL;
  }
  
  // Handle tRole and ctRole which are optional
  validated.tRole = player.tRole || undefined;
  validated.ctRole = player.ctRole || undefined;
  
  return validated;
}

/**
 * Validate a team object for data integrity
 * @returns The validated team object with fixes applied
 */
export function validateTeam(
  team: Partial<TeamWithTIR>,
  source: string | DataSource
): TeamWithTIR {
  const validated: Partial<TeamWithTIR> = {};
  
  // Validate required fields
  const requiredFields = ['id', 'name'];
  for (const field of requiredFields) {
    if (!team[field]) {
      const message = `Missing required field: ${field}`;
      
      if (currentValidationLevel === ValidationLevel.STRICT) {
        throw new Error(message);
      }
      
      logIntegrityIssue(source, 'Team', field, message, 'warning');
      validated[field] = field === 'id' ? `unknown-${Date.now()}` : 'Unknown Team';
    } else {
      validated[field] = team[field];
    }
  }
  
  // Validate numeric fields
  const numericFields = ['tir', 'sumPIV', 'synergy', 'avgPIV'];
  for (const field of numericFields) {
    const value = team[field];
    if (value === undefined || value === null || isNaN(Number(value))) {
      if (currentValidationLevel !== ValidationLevel.LENIENT) {
        logIntegrityIssue(source, 'Team', field, `Invalid numeric value: ${value}`, 'info');
      }
      validated[field] = 0;
    } else {
      validated[field] = Number(value);
    }
  }
  
  // Ensure players array
  if (!Array.isArray(team.players)) {
    if (currentValidationLevel !== ValidationLevel.LENIENT) {
      logIntegrityIssue(source, 'Team', 'players', 'Players is not an array', 'warning');
    }
    validated.players = [];
  } else {
    validated.players = team.players;
  }
  
  // Validate topPlayer
  if (!team.topPlayer || typeof team.topPlayer !== 'object') {
    if (currentValidationLevel !== ValidationLevel.LENIENT) {
      logIntegrityIssue(source, 'Team', 'topPlayer', 'Missing or invalid topPlayer', 'info');
    }
    validated.topPlayer = { name: 'Unknown', piv: 0 };
  } else {
    validated.topPlayer = {
      name: team.topPlayer.name || 'Unknown',
      piv: Number(team.topPlayer.piv) || 0
    };
  }
  
  return validated as TeamWithTIR;
}

/**
 * Perform data integrity verification on a dataset
 */
export function verifyDataIntegrity<T>(
  data: T[],
  entityName: string,
  source: string | DataSource,
  validator: (item: any, source: string | DataSource) => T
): T[] {
  console.log(`Verifying data integrity for ${entityName} from ${source}...`);
  
  if (!Array.isArray(data)) {
    logIntegrityIssue(source, entityName, 'dataset', 'Data is not an array', 'error');
    return [];
  }
  
  const validatedData: T[] = [];
  
  for (let i = 0; i < data.length; i++) {
    try {
      const item = data[i];
      const validatedItem = validator(item, source);
      validatedData.push(validatedItem);
    } catch (error) {
      logIntegrityIssue(
        source, 
        entityName, 
        `item[${i}]`, 
        `Validation failed: ${error.message}`, 
        'error'
      );
      
      if (currentValidationLevel === ValidationLevel.STRICT) {
        throw error;
      }
    }
  }
  
  console.log(`Data integrity verification complete for ${entityName}: ${validatedData.length}/${data.length} items valid`);
  return validatedData;
}

/**
 * Data integrity verification for player data
 */
export function verifyPlayerDataIntegrity(
  players: Partial<PlayerRawStats>[],
  source: string | DataSource
): PlayerRawStats[] {
  return verifyDataIntegrity(players, 'Players', source, validatePlayer);
}

/**
 * Data integrity verification for team data
 */
export function verifyTeamDataIntegrity(
  teams: Partial<TeamWithTIR>[],
  source: string | DataSource
): TeamWithTIR[] {
  return verifyDataIntegrity(teams, 'Teams', source, validateTeam);
}

/**
 * Generic data integrity check that logs but doesn't throw errors
 */
export function checkDataIntegrity<T>(data: any, schema: Record<string, any>, entityName: string): T {
  const result: any = {};
  
  for (const [key, expectedType] of Object.entries(schema)) {
    const value = data[key];
    
    if (value === undefined || value === null) {
      logIntegrityIssue('validation', entityName, key, 'Missing required field', 'warning');
      result[key] = typeof expectedType === 'function' ? new expectedType() : expectedType;
      continue;
    }
    
    // Check type
    const valueType = typeof value;
    const expectedTypeStr = typeof expectedType === 'function' ? expectedType.name.toLowerCase() : typeof expectedType;
    
    if (valueType !== expectedTypeStr && expectedTypeStr !== 'any') {
      if (expectedTypeStr === 'number' && !isNaN(Number(value))) {
        // Convert to number if possible
        result[key] = Number(value);
      } else if (expectedTypeStr === 'string') {
        // Convert to string
        result[key] = String(value);
      } else if (expectedTypeStr === 'boolean') {
        // Convert to boolean
        result[key] = Boolean(value);
      } else if (expectedTypeStr === 'object' && valueType !== 'object') {
        // Missing object field
        logIntegrityIssue('validation', entityName, key, `Expected object, got ${valueType}`, 'warning');
        result[key] = {};
      } else if (expectedTypeStr === 'array' && !Array.isArray(value)) {
        // Missing array field
        logIntegrityIssue('validation', entityName, key, `Expected array, got ${valueType}`, 'warning');
        result[key] = [];
      } else {
        // Other type mismatch
        logIntegrityIssue('validation', entityName, key, `Type mismatch: expected ${expectedTypeStr}, got ${valueType}`, 'warning');
        result[key] = typeof expectedType === 'function' ? new expectedType() : expectedType;
      }
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Type guard to check if a value is a valid player stats object
 */
export function isValidPlayerStats(data: any): data is PlayerRawStats {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.team === 'string'
  );
}

/**
 * Type guard to check if a value is a valid team object
 */
export function isValidTeam(data: any): data is TeamWithTIR {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    Array.isArray(data.players)
  );
}