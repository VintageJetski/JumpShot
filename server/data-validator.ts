/**
 * Data Validator Module
 * 
 * This module provides runtime type checking and validation for data from 
 * both CSV and Supabase sources to ensure consistency and prevent errors.
 */

import { PlayerRawStats } from './types';
import { PlayerRole } from '../shared/schema';

/**
 * Validate player raw stats and provide default values for missing fields
 * @param data The raw player data to validate
 * @returns Validated PlayerRawStats with defaults applied
 */
export function validatePlayerStats(data: any): PlayerRawStats {
  // Check if the minimum required fields exist
  if (!data) {
    throw new Error('Player data is null or undefined');
  }
  
  // Essential fields that must be present (throw error if missing)
  if (!data.id) {
    throw new Error('Player ID is required');
  }
  
  if (!data.name) {
    throw new Error('Player name is required');
  }
  
  // Create a validated object with defaults for optional fields
  const validated: PlayerRawStats = {
    id: String(data.id),
    name: String(data.name),
    team: data.team ? String(data.team) : '',
    isIGL: Boolean(data.isIGL),
    
    // Roles - default to Support if missing
    tRole: data.tRole ? mapToPlayerRole(data.tRole) : PlayerRole.Support,
    ctRole: data.ctRole ? mapToPlayerRole(data.ctRole) : PlayerRole.Support,
    
    // Normalize numerical values
    kills: normalizeNumber(data.kills, 0),
    deaths: normalizeNumber(data.deaths, 0),
    kd: normalizeNumber(data.kd || data.kdr, 1.0),
    adr: normalizeNumber(data.adr, 0),
    hs: normalizeNumber(data.hs || data.headshots, 0),
    
    // Advanced stats with defaults
    impact: normalizeNumber(data.impact, 0),
    kpr: normalizeNumber(data.kpr, 0),
    dpr: normalizeNumber(data.dpr, 0),
    
    // Utility stats
    kast: normalizeNumber(data.kast, 0),
    flashAssists: normalizeNumber(data.flashAssists, 0),
    utilityDamage: normalizeNumber(data.utilityDamage || data.utilityDamagePerRound, 0),
    
    // Entry stats
    openingKills: normalizeNumber(data.openingKills || data.openingKillRate, 0),
    openingDeaths: normalizeNumber(data.openingDeaths || data.firstDeathRate, 0),
    
    // Special plays
    clutchesWon: normalizeNumber(data.clutchesWon || data.clutchWinRate, 0),
    tradingSuccess: normalizeNumber(data.tradingSuccess || data.tradingSuccessRate, 0),
    consistencyScore: normalizeNumber(data.consistencyScore, 0),
    
    // Add required fields with default values that might be missing
    pivValue: normalizeNumber(data.pivValue || data.piv, 0),
    wallbangKills: normalizeNumber(data.wallbangKills, 0),
    assistedFlashes: normalizeNumber(data.assistedFlashes || data.flashAssists, 0),
    noScope: normalizeNumber(data.noScope, 0),
    throughSmoke: normalizeNumber(data.throughSmoke, 0),
    
    // Added to match all the properties in server/types.ts
    steamId: String(data.steamId || data.id),
    userName: String(data.userName || data.name),
    teamName: String(data.teamName || data.team || ''),
    
    // Additional required fields
    damage: normalizeNumber(data.damage, 0),
    assists: normalizeNumber(data.assists, 0),
    killAssists: normalizeNumber(data.killAssists, 0),
    incendiaryDamage: normalizeNumber(data.incendiaryDamage, 0),
    molotovDamage: normalizeNumber(data.molotovDamage, 0),
    heDamage: normalizeNumber(data.heDamage, 0),
    entrySuccess: normalizeNumber(data.entrySuccess, 0),
    entryAttempts: normalizeNumber(data.entryAttempts, 0),
    multiKills: normalizeNumber(data.multiKills, 0),
    oneVXs: normalizeNumber(data.oneVXs, 0),
    oneVXAttempts: normalizeNumber(data.oneVXAttempts, 0),
    HSPercent: normalizeNumber(data.HSPercent, 0),
    flashesThrown: normalizeNumber(data.flashesThrown, 0),
    smkThrown: normalizeNumber(data.smkThrown, 0),
    heThrown: normalizeNumber(data.heThrown, 0),
    molliesThrown: normalizeNumber(data.molliesThrown, 0),
    roundsPlayed: normalizeNumber(data.roundsPlayed, 0),
    mapsPlayed: normalizeNumber(data.mapsPlayed, 0),
    firstKills: normalizeNumber(data.firstKills || data.openingKills, 0),
    firstDeaths: normalizeNumber(data.firstDeaths || data.openingDeaths, 0),
    tradedDeaths: normalizeNumber(data.tradedDeaths, 0),
    tradedKills: normalizeNumber(data.tradedKills, 0),
    survivedRounds: normalizeNumber(data.survivedRounds, 0),
    rounds_ct: normalizeNumber(data.rounds_ct, 0),
    rounds_t: normalizeNumber(data.rounds_t, 0),
    
    // Stats by side (if missing in either format, default to 0)
    kills_t: normalizeNumber(data.kills_t, 0), 
    deaths_t: normalizeNumber(data.deaths_t, 0),
    adr_t: normalizeNumber(data.adr_t, 0),
    kast_t: normalizeNumber(data.kast_t, 0),
    kills_ct: normalizeNumber(data.kills_ct, 0), 
    deaths_ct: normalizeNumber(data.deaths_ct, 0),
    adr_ct: normalizeNumber(data.adr_ct, 0),
    kast_ct: normalizeNumber(data.kast_ct, 0),
  };
  
  return validated;
}

/**
 * Map a string role to PlayerRole enum
 */
function mapToPlayerRole(role: string | PlayerRole): PlayerRole {
  if (typeof role === 'number') {
    return role as PlayerRole;
  }
  
  switch ((role || '').toLowerCase()) {
    case 'awp':
    case 'awper':
      return PlayerRole.AWP;
    case 'entry':
    case 'spacetaker':
      return PlayerRole.Spacetaker;
    case 'igl':
      return PlayerRole.IGL;
    case 'lurker':
      return PlayerRole.Lurker;
    case 'anchor':
      return PlayerRole.Anchor;
    case 'rotator':
      return PlayerRole.Rotator;
    case 'support':
    default:
      return PlayerRole.Support;
  }
}

/**
 * Normalize a numerical value, ensuring it's a valid number
 * @param value The value to normalize
 * @param defaultValue Default value if invalid
 * @returns A valid number
 */
export function normalizeNumber(value: any, defaultValue: number): number {
  // Handle undefined/null
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  // Convert to number if it's a string
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  // Check if it's a valid number
  return isNaN(num) ? defaultValue : num;
}

/**
 * Validate a boolean value
 */
export function validateBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  
  return Boolean(value);
}

/**
 * Log data integrity issues for monitoring
 */
export function logDataIntegrityIssue(source: string, entity: string, field: string, issue: string): void {
  console.warn(`[DATA INTEGRITY] ${source} - ${entity} - ${field}: ${issue}`);
}

/**
 * Validate team data
 */
export function validateTeam(data: any): any {
  if (!data) {
    throw new Error('Team data is null or undefined');
  }
  
  if (!data.id) {
    throw new Error('Team ID is required');
  }
  
  return {
    id: String(data.id),
    name: String(data.name || data.id),
    tir: normalizeNumber(data.tir, 0),
    synergy: normalizeNumber(data.synergy, 0),
    avgPIV: normalizeNumber(data.avgPIV, 0),
    sumPIV: normalizeNumber(data.sumPIV, 0),
    players: Array.isArray(data.players) ? data.players : [],
    topPlayer: data.topPlayer || { name: 'Unknown', piv: 0 }
  };
}