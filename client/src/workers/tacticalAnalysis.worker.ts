// Web Worker for heavy tactical analysis calculations
// This prevents UI blocking when processing large datasets

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

interface AnalysisResult {
  totalPositions: number;
  tPlayers: number;
  ctPlayers: number;
  avgHealth: number;
  activePlayers: number;
  highVelocityPlayers: number;
  lowHealthPlayers: number;
  teamCoordination: number;
  roundPrediction: string;
  predictionConfidence: number;
  tFormation: string;
  ctFormation: string;
  mapControlScore: number;
  tacticalAdvantage: string;
  executeTiming: string;
  informationControl: string;
  competitiveScore: number;
  patternStrength: number;
  matchPrediction: string;
  strategicPriority: string;
}

self.onmessage = function(e) {
  const { data: filteredData, type } = e.data;
  
  if (type === 'ANALYZE_TACTICAL_DATA') {
    try {
      const result = performTacticalAnalysis(filteredData);
      self.postMessage({ type: 'ANALYSIS_COMPLETE', result });
    } catch (error) {
      self.postMessage({ type: 'ANALYSIS_ERROR', error: error.message });
    }
  }
};

function performTacticalAnalysis(filteredData: XYZPlayerData[]): AnalysisResult {
  if (filteredData.length === 0) {
    return {
      totalPositions: 0,
      tPlayers: 0,
      ctPlayers: 0,
      avgHealth: 0,
      activePlayers: 0,
      highVelocityPlayers: 0,
      lowHealthPlayers: 0,
      teamCoordination: 0,
      roundPrediction: 'NO DATA',
      predictionConfidence: 0,
      tFormation: 'Unknown',
      ctFormation: 'Unknown',
      mapControlScore: 50,
      tacticalAdvantage: 'BALANCED',
      executeTiming: 'UNKNOWN',
      informationControl: 'BALANCED',
      competitiveScore: 50,
      patternStrength: 0,
      matchPrediction: 'NO DATA',
      strategicPriority: 'UNKNOWN'
    };
  }

  const tPlayers = filteredData.filter(d => d.side === 't');
  const ctPlayers = filteredData.filter(d => d.side === 'ct');
  const avgHealth = filteredData.reduce((sum, d) => sum + d.health, 0) / filteredData.length;
  const activePlayers = filteredData.filter(d => d.health > 0);
  
  const highVelocityPlayers = filteredData.filter(d => 
    Math.sqrt(d.velocity_X ** 2 + d.velocity_Y ** 2) > 200
  );
  
  const lowHealthPlayers = filteredData.filter(d => d.health > 0 && d.health < 50);
  
  // Optimized coordination calculation - sample for performance
  const sampleSize = Math.min(filteredData.length, 50);
  const sampledData = filteredData.slice(0, sampleSize);
  const coordinations = sampledData.reduce((acc, player) => {
    const teammates = sampledData.filter(other => 
      other.side === player.side && 
      other.name !== player.name &&
      Math.sqrt((player.X - other.X) ** 2 + (player.Y - other.Y) ** 2) < 800
    );
    return acc + teammates.length;
  }, 0) / 2;
  
  // Simplified tactical analysis
  const tAlive = tPlayers.filter(p => p.health > 0).length;
  const ctAlive = ctPlayers.filter(p => p.health > 0).length;
  
  let roundPrediction = 'BALANCED';
  let confidence = 50;
  
  if (tAlive > ctAlive) {
    roundPrediction = 'T-SIDE ADVANTAGE';
    confidence = 65 + (tAlive - ctAlive) * 10;
  } else if (ctAlive > tAlive) {
    roundPrediction = 'CT-SIDE ADVANTAGE';
    confidence = 65 + (ctAlive - tAlive) * 10;
  }
  
  return {
    totalPositions: filteredData.length,
    tPlayers: tPlayers.length,
    ctPlayers: ctPlayers.length,
    avgHealth: Math.round(avgHealth),
    activePlayers: activePlayers.length,
    highVelocityPlayers: highVelocityPlayers.length,
    lowHealthPlayers: lowHealthPlayers.length,
    teamCoordination: Math.round(coordinations),
    roundPrediction,
    predictionConfidence: Math.min(confidence, 95),
    tFormation: analyzeTacticalFormation(tPlayers),
    ctFormation: analyzeTacticalFormation(ctPlayers),
    mapControlScore: calculateMapControl(filteredData),
    tacticalAdvantage: tAlive > ctAlive ? 'T-SIDE' : ctAlive > tAlive ? 'CT-SIDE' : 'BALANCED',
    executeTiming: 'MID-ROUND',
    informationControl: 'BALANCED',
    competitiveScore: 50,
    patternStrength: 75,
    matchPrediction: roundPrediction,
    strategicPriority: 'ADAPT'
  };
}

function analyzeTacticalFormation(players: XYZPlayerData[]): string {
  if (players.length === 0) return 'Unknown';
  
  const alivePlayers = players.filter(p => p.health > 0);
  if (alivePlayers.length < 2) return 'Individual';
  
  const avgX = alivePlayers.reduce((sum, p) => sum + p.X, 0) / alivePlayers.length;
  const avgY = alivePlayers.reduce((sum, p) => sum + p.Y, 0) / alivePlayers.length;
  
  const distances = alivePlayers.map(p => Math.sqrt((p.X - avgX) ** 2 + (p.Y - avgY) ** 2));
  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  
  if (avgDistance < 400) return 'Tight Stack';
  if (avgDistance < 800) return 'Loose Formation';
  return 'Split Formation';
}

function calculateMapControl(players: XYZPlayerData[]): number {
  const tPlayers = players.filter(p => p.side === 't' && p.health > 0);
  const ctPlayers = players.filter(p => p.side === 'ct' && p.health > 0);
  
  const tCoverage = tPlayers.length * 500;
  const ctCoverage = ctPlayers.length * 500;
  
  const totalCoverage = tCoverage + ctCoverage;
  const tControl = totalCoverage > 0 ? (tCoverage / totalCoverage) * 100 : 50;
  
  return Math.round(tControl);
}