/**
 * Phase 4: Advanced Tactical Intelligence Engine
 * Elite-level formation analysis, strategic pattern recognition, and command decision support
 */

interface XYZPlayerData {
  health: number;
  flash_duration: number;
  place?: string;
  armor: number;
  side: 't' | 'ct';
  pitch: number;
  X: number;
  yaw: number;
  Y: number;
  velocity_X: number;
  Z: number;
  velocity_Y: number;
  velocity_Z: number;
  tick: number;
  user_steamid: string;
  name: string;
  round_num: number;
}

interface TacticalFormation {
  type: 'Tight Stack' | 'Loose Formation' | 'Split Formation' | 'Individual' | 'Unknown';
  confidence: number;
  players: number;
  cohesion: number;
  strategicIntent: string;
}

interface MapControl {
  tControl: number;
  ctControl: number;
  contestedAreas: number;
  advantage: 'T-DOMINANCE' | 'CT-DOMINANCE' | 'CONTESTED' | 'BALANCED';
  keyAreas: string[];
}

interface TacticalAdvantage {
  side: 'T-STRONG' | 'CT-STRONG' | 'BALANCED' | 'T-SLIGHT' | 'CT-SLIGHT';
  confidence: number;
  factors: string[];
  recommendation: string;
}

interface ExecuteTiming {
  phase: 'IMMEDIATE EXECUTE' | 'PREPARING EXECUTE' | 'POSITIONAL SETUP' | 'DEFENSIVE HOLD';
  timing: string;
  confidence: number;
  indicators: string[];
}

interface InformationWarfare {
  advantage: 'T-SIDE' | 'CT-SIDE' | 'NEUTRAL';
  score: number;
  controlSources: string[];
  vulnerabilities: string[];
}

/**
 * Analyze tactical formations for both teams with enhanced pattern recognition
 */
export function analyzeTacticalFormations(players: XYZPlayerData[]): {
  tFormation: TacticalFormation;
  ctFormation: TacticalFormation;
} {
  const tPlayers = players.filter(p => p.side === 't' && p.health > 0);
  const ctPlayers = players.filter(p => p.side === 'ct' && p.health > 0);

  const analyzeTeamFormation = (teamPlayers: XYZPlayerData[]): TacticalFormation => {
    if (teamPlayers.length === 0) {
      return {
        type: 'Unknown',
        confidence: 0,
        players: 0,
        cohesion: 0,
        strategicIntent: 'No active players detected'
      };
    }

    if (teamPlayers.length === 1) {
      return {
        type: 'Individual',
        confidence: 95,
        players: 1,
        cohesion: 100,
        strategicIntent: 'Solo survival and positioning'
      };
    }

    // Calculate center of mass and spread
    const avgX = teamPlayers.reduce((sum, p) => sum + p.X, 0) / teamPlayers.length;
    const avgY = teamPlayers.reduce((sum, p) => sum + p.Y, 0) / teamPlayers.length;
    
    const distances = teamPlayers.map(p => 
      Math.sqrt((p.X - avgX) ** 2 + (p.Y - avgY) ** 2)
    );
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    
    // Calculate cohesion score
    const cohesion = Math.max(0, Math.min(100, 100 - (avgDistance / 10)));
    
    // Determine formation type and strategic intent
    if (avgDistance < 300) {
      return {
        type: 'Tight Stack',
        confidence: 90,
        players: teamPlayers.length,
        cohesion,
        strategicIntent: 'Coordinated execute or defensive stack'
      };
    } else if (avgDistance < 600) {
      return {
        type: 'Loose Formation',
        confidence: 85,
        players: teamPlayers.length,
        cohesion,
        strategicIntent: 'Flexible positioning with coordination potential'
      };
    } else {
      return {
        type: 'Split Formation',
        confidence: 80,
        players: teamPlayers.length,
        cohesion,
        strategicIntent: 'Multi-angle approach or map control spread'
      };
    }
  };

  return {
    tFormation: analyzeTeamFormation(tPlayers),
    ctFormation: analyzeTeamFormation(ctPlayers)
  };
}

/**
 * Advanced map control analysis with territorial scoring
 */
export function analyzeMapControl(players: XYZPlayerData[]): MapControl {
  const tPlayers = players.filter(p => p.side === 't' && p.health > 0);
  const ctPlayers = players.filter(p => p.side === 'ct' && p.health > 0);
  
  // Calculate coverage areas (simplified territorial control)
  const tCoverage = tPlayers.length * 400; // Each player controls ~400 unit radius
  const ctCoverage = ctPlayers.length * 400;
  
  const totalCoverage = tCoverage + ctCoverage;
  const tControl = totalCoverage > 0 ? (tCoverage / totalCoverage) * 100 : 50;
  const ctControl = 100 - tControl;
  
  // Determine contested areas based on player proximity
  let contestedAreas = 0;
  tPlayers.forEach(tPlayer => {
    ctPlayers.forEach(ctPlayer => {
      const distance = Math.sqrt(
        (tPlayer.X - ctPlayer.X) ** 2 + (tPlayer.Y - ctPlayer.Y) ** 2
      );
      if (distance < 800) contestedAreas++;
    });
  });
  
  // Determine overall advantage
  let advantage: MapControl['advantage'];
  if (tControl > 70) advantage = 'T-DOMINANCE';
  else if (ctControl > 70) advantage = 'CT-DOMINANCE';
  else if (contestedAreas > 3) advantage = 'CONTESTED';
  else advantage = 'BALANCED';
  
  // Identify key areas (simplified)
  const keyAreas: string[] = [];
  if (tControl > 60) keyAreas.push('T-side map control');
  if (ctControl > 60) keyAreas.push('CT defensive positions');
  if (contestedAreas > 2) keyAreas.push('Multiple contested zones');
  
  return {
    tControl: Math.round(tControl),
    ctControl: Math.round(ctControl),
    contestedAreas,
    advantage,
    keyAreas
  };
}

/**
 * Comprehensive tactical advantage assessment
 */
export function assessTacticalAdvantage(players: XYZPlayerData[]): TacticalAdvantage {
  const tPlayers = players.filter(p => p.side === 't');
  const ctPlayers = players.filter(p => p.side === 'ct');
  
  const tAlive = tPlayers.filter(p => p.health > 0).length;
  const ctAlive = ctPlayers.filter(p => p.health > 0).length;
  
  const tAvgHealth = tPlayers.reduce((sum, p) => sum + p.health, 0) / tPlayers.length || 0;
  const ctAvgHealth = ctPlayers.reduce((sum, p) => sum + p.health, 0) / ctPlayers.length || 0;
  
  // Calculate tactical scores
  const tScore = (tAlive * 25) + (tAvgHealth * 0.6);
  const ctScore = (ctAlive * 25) + (ctAvgHealth * 0.6);
  
  const factors: string[] = [];
  let side: TacticalAdvantage['side'];
  let confidence: number;
  let recommendation: string;
  
  // Determine advantage level
  const scoreDiff = Math.abs(tScore - ctScore);
  
  if (tScore > ctScore + 40) {
    side = 'T-STRONG';
    confidence = Math.min(95, 60 + scoreDiff);
    recommendation = 'Execute aggressive plays and maintain tempo';
    factors.push('Significant player advantage', 'Health superiority');
  } else if (ctScore > tScore + 40) {
    side = 'CT-STRONG';
    confidence = Math.min(95, 60 + scoreDiff);
    recommendation = 'Hold defensive positions and force unfavorable engagements';
    factors.push('Strong defensive setup', 'Health advantage');
  } else if (tScore > ctScore + 15) {
    side = 'T-SLIGHT';
    confidence = 70;
    recommendation = 'Calculated aggression with utility support';
    factors.push('Minor tactical advantage');
  } else if (ctScore > tScore + 15) {
    side = 'CT-SLIGHT';
    confidence = 70;
    recommendation = 'Defensive patience with counter-play readiness';
    factors.push('Slight defensive advantage');
  } else {
    side = 'BALANCED';
    confidence = 60;
    recommendation = 'Adaptability crucial - read opponent and adjust';
    factors.push('Even tactical state');
  }
  
  return { side, confidence, factors, recommendation };
}

/**
 * Predict execute timing with advanced pattern recognition
 */
export function predictExecuteTiming(players: XYZPlayerData[]): ExecuteTiming {
  const highVelocity = players.filter(p => 
    Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2) > 150 && p.health > 0
  ).length;
  
  const lowVelocity = players.filter(p => 
    Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2) < 50 && p.health > 0
  ).length;
  
  // Calculate coordination clusters
  const coordination = players.reduce((acc, player) => {
    const teammates = players.filter(other => 
      other.side === player.side && 
      other.name !== player.name &&
      Math.sqrt((player.X - other.X) ** 2 + (player.Y - other.Y) ** 2) < 500
    );
    return acc + teammates.length;
  }, 0) / 2;
  
  const indicators: string[] = [];
  let phase: ExecuteTiming['phase'];
  let timing: string;
  let confidence: number;
  
  // Immediate execute indicators
  if (highVelocity > 4 && coordination > 12) {
    phase = 'IMMEDIATE EXECUTE';
    timing = '0-5 seconds';
    confidence = 90;
    indicators.push('High coordinated movement', 'Synchronized positioning');
  }
  // Preparing execute
  else if (highVelocity > 2 && coordination > 8) {
    phase = 'PREPARING EXECUTE';
    timing = '5-15 seconds';
    confidence = 80;
    indicators.push('Building coordination', 'Tactical setup');
  }
  // Defensive hold
  else if (lowVelocity > 6) {
    phase = 'DEFENSIVE HOLD';
    timing = '20+ seconds';
    confidence = 75;
    indicators.push('Static positioning', 'Defensive setup');
  }
  // Default positional setup
  else {
    phase = 'POSITIONAL SETUP';
    timing = '10-25 seconds';
    confidence = 65;
    indicators.push('Standard positioning', 'Information gathering');
  }
  
  return { phase, timing, confidence, indicators };
}

/**
 * Advanced information warfare analysis
 */
export function analyzeInformationWarfare(players: XYZPlayerData[]): InformationWarfare {
  const tPlayers = players.filter(p => p.side === 't' && p.health > 0);
  const ctPlayers = players.filter(p => p.side === 'ct' && p.health > 0);
  
  // Calculate map spread for information gathering potential
  const tSpread = tPlayers.length > 1 ? 
    Math.max(...tPlayers.map(p => p.X)) - Math.min(...tPlayers.map(p => p.X)) : 0;
  const ctSpread = ctPlayers.length > 1 ? 
    Math.max(...ctPlayers.map(p => p.X)) - Math.min(...ctPlayers.map(p => p.X)) : 0;
  
  // Calculate positioning advantage
  const tPositionScore = tSpread + (tPlayers.length * 100);
  const ctPositionScore = ctSpread + (ctPlayers.length * 100);
  
  const controlSources: string[] = [];
  const vulnerabilities: string[] = [];
  let advantage: InformationWarfare['advantage'];
  let score: number;
  
  if (tPositionScore > ctPositionScore + 300) {
    advantage = 'T-SIDE';
    score = 75;
    controlSources.push('Wide map spread', 'Multiple information angles');
    vulnerabilities.push('CT rotation reads');
  } else if (ctPositionScore > tPositionScore + 300) {
    advantage = 'CT-SIDE';
    score = 75;
    controlSources.push('Defensive positioning', 'Site coverage');
    vulnerabilities.push('T-side approach detection');
  } else {
    advantage = 'NEUTRAL';
    score = 50;
    controlSources.push('Balanced positioning');
    vulnerabilities.push('Limited information flow');
  }
  
  return { advantage, score, controlSources, vulnerabilities };
}

/**
 * Generate comprehensive tactical intelligence report
 */
export function generateTacticalIntelligence(players: XYZPlayerData[]) {
  const formations = analyzeTacticalFormations(players);
  const mapControl = analyzeMapControl(players);
  const tacticalAdvantage = assessTacticalAdvantage(players);
  const executeTiming = predictExecuteTiming(players);
  const informationWarfare = analyzeInformationWarfare(players);
  
  return {
    formations,
    mapControl,
    tacticalAdvantage,
    executeTiming,
    informationWarfare,
    timestamp: new Date().toISOString(),
    confidence: Math.round((
      formations.tFormation.confidence +
      formations.ctFormation.confidence +
      tacticalAdvantage.confidence +
      executeTiming.confidence
    ) / 4)
  };
}