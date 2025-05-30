import { PlayerWithPIV } from '@shared/schema';

/**
 * Client-side metrics calculator for tournament data
 * Calculates RCS, ICF, SC, and OSM from authentic tournament statistics
 */

export interface CalculatedMetrics {
  rcs: {
    value: number;
    metrics: {
      [key: string]: number;
    };
  };
  icf: {
    value: number;
    sigma: number;
  };
  sc: {
    value: number;
    metric: string;
  };
  osm: number;
}

export function calculatePlayerMetrics(player: PlayerWithPIV): CalculatedMetrics {
  const metrics = player.metrics;
  
  // Role Core Score (RCS) - based on role-specific performance
  const calculateRCS = (): { value: number; metrics: { [key: string]: number; } } => {
    const roleMetrics: { [key: string]: number } = {};
    
    // Base metrics available from tournament data
    const kdRatio = metrics?.kd || 0;
    const adr = metrics?.adr || 0;
    const kast = metrics?.kast || 0;
    const firstKills = metrics?.firstKills || 0;
    const headshots = metrics?.headshots || 0;
    const utilityDamage = metrics?.utilityDamage || 0;
    
    // Role-specific calculations based on player role
    switch (player.role?.toLowerCase()) {
      case 'igl':
        roleMetrics['Tactical Leadership'] = Math.min(kast / 100, 1.0);
        roleMetrics['Team Coordination'] = Math.min((adr / 80) * 0.8, 1.0);
        roleMetrics['Strategic Impact'] = Math.min(kdRatio / 1.2, 1.0);
        break;
        
      case 'awper':
        roleMetrics['Opening Pick Success'] = Math.min(firstKills / 20, 1.0);
        roleMetrics['Impact Rating'] = Math.min(adr / 90, 1.0);
        roleMetrics['Precision'] = Math.min(headshots / 50, 1.0);
        break;
        
      case 'entry':
        roleMetrics['Opening Duel Success'] = Math.min(firstKills / 25, 1.0);
        roleMetrics['Aggression Efficiency'] = Math.min(kdRatio / 1.1, 1.0);
        roleMetrics['First Blood Impact'] = Math.min((firstKills / 15) * 0.9, 1.0);
        break;
        
      case 'lurker':
        roleMetrics['Independent Performance'] = Math.min(kdRatio / 1.15, 1.0);
        roleMetrics['Clutch Potential'] = Math.min(kast / 90, 1.0);
        roleMetrics['Tactical Awareness'] = Math.min((adr / 75) * 0.8, 1.0);
        break;
        
      case 'anchor':
        roleMetrics['Site Hold Success'] = Math.min(kast / 85, 1.0);
        roleMetrics['Defensive Rating'] = Math.min((adr / 70) * 0.9, 1.0);
        roleMetrics['Multi-Kill Defense'] = Math.min(kdRatio / 1.05, 1.0);
        break;
        
      case 'support':
        roleMetrics['Utility Effectiveness'] = Math.min(utilityDamage / 100, 1.0);
        roleMetrics['Team Support'] = Math.min(kast / 95, 1.0);
        roleMetrics['Assist Impact'] = Math.min((adr / 65) * 0.8, 1.0);
        break;
        
      default:
        roleMetrics['Overall Performance'] = Math.min(kdRatio / 1.1, 1.0);
        roleMetrics['Consistency'] = Math.min(kast / 85, 1.0);
        roleMetrics['Impact'] = Math.min(adr / 80, 1.0);
    }
    
    // Calculate weighted average
    const values = Object.values(roleMetrics);
    const rcsValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return {
      value: Math.round(rcsValue * 1000) / 1000,
      metrics: roleMetrics
    };
  };
  
  // Individual Consistency Factor (ICF) - measures performance stability
  const calculateICF = (): { value: number; sigma: number } => {
    const kdRatio = metrics?.kd || 0;
    const adr = metrics?.adr || 0;
    const kast = metrics?.kast || 0;
    
    // Normalize metrics to 0-1 scale
    const normalizedKD = Math.min(kdRatio / 2.0, 1.0);
    const normalizedADR = Math.min(adr / 100, 1.0);
    const normalizedKAST = Math.min(kast / 100, 1.0);
    
    // Calculate consistency based on how close metrics are to expected values
    const expectedKD = 1.0;
    const expectedADR = 75;
    const expectedKAST = 70;
    
    const kdVariance = Math.abs(kdRatio - expectedKD) / expectedKD;
    const adrVariance = Math.abs(adr - expectedADR) / expectedADR;
    const kastVariance = Math.abs(kast - expectedKAST) / expectedKAST;
    
    const averageVariance = (kdVariance + adrVariance + kastVariance) / 3;
    const icfValue = Math.max(0, 1 - averageVariance);
    
    return {
      value: Math.round(icfValue * 1000) / 1000,
      sigma: Math.round(averageVariance * 1000) / 1000
    };
  };
  
  // Synergy Contribution (SC) - team chemistry impact
  const calculateSC = (): { value: number; metric: string } => {
    const kast = metrics?.kast || 0;
    const utilityDamage = metrics?.utilityDamage || 0;
    const firstKills = metrics?.firstKills || 0;
    
    // Calculate synergy based on team-oriented metrics
    const teamPlay = (kast / 100) * 0.4;
    const utility = Math.min(utilityDamage / 150, 1.0) * 0.3;
    const opening = Math.min(firstKills / 20, 1.0) * 0.3;
    
    const scValue = teamPlay + utility + opening;
    
    // Determine primary synergy metric
    let primaryMetric = 'Team Play';
    if (utility > teamPlay && utility > opening) {
      primaryMetric = 'Utility Usage';
    } else if (opening > teamPlay && opening > utility) {
      primaryMetric = 'Opening Impact';
    }
    
    return {
      value: Math.round(scValue * 1000) / 1000,
      metric: primaryMetric
    };
  };
  
  // Opponent Strength Multiplier (OSM) - performance against competition
  const calculateOSM = (): number => {
    // Base OSM on tournament level (all players are from major tournaments)
    const baseOSM = 1.0; // Major tournament baseline
    
    // Adjust based on performance metrics
    const kdRatio = metrics?.kd || 0;
    const adr = metrics?.adr || 0;
    
    const performanceMultiplier = Math.min((kdRatio + (adr / 100)) / 2, 1.2);
    
    return Math.round(baseOSM * performanceMultiplier * 1000) / 1000;
  };
  
  return {
    rcs: calculateRCS(),
    icf: calculateICF(),
    sc: calculateSC(),
    osm: calculateOSM()
  };
}