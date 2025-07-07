/**
 * Phase 3: Predictive Analytics Engine
 * Advanced algorithms for real-time match outcome prediction and tactical forecasting
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

interface PredictiveInsight {
  type: 'outcome' | 'momentum' | 'economy' | 'tactical' | 'timing';
  prediction: string;
  confidence: number;
  timeframe: 'immediate' | 'short' | 'medium';
  factors: string[];
  recommendation: string;
}

interface MatchState {
  tSideAdvantage: number;
  ctSideAdvantage: number;
  economicPhase: 'eco' | 'force' | 'full' | 'mixed';
  coordinationLevel: 'low' | 'medium' | 'high';
  momentumDirection: 'neutral' | 't_favor' | 'ct_favor';
  predictedOutcome: string;
  confidence: number;
}

/**
 * Calculate real-time match state and predictions
 */
export function analyzeMatchState(xyzData: XYZPlayerData[]): MatchState {
  const tPlayers = xyzData.filter(d => d.side === 't');
  const ctPlayers = xyzData.filter(d => d.side === 'ct');
  
  // Health and survival analysis
  const tAlive = tPlayers.filter(p => p.health > 0);
  const ctAlive = ctPlayers.filter(p => p.health > 0);
  const tAvgHealth = tAlive.reduce((sum, p) => sum + p.health, 0) / tAlive.length;
  const ctAvgHealth = ctAlive.reduce((sum, p) => sum + p.health, 0) / ctAlive.length;
  
  // Calculate advantages
  const playerCountAdvantage = (tAlive.length - ctAlive.length) * 0.2;
  const healthAdvantage = (tAvgHealth - ctAvgHealth) * 0.01;
  const tSideAdvantage = Math.max(-1, Math.min(1, playerCountAdvantage + healthAdvantage));
  const ctSideAdvantage = -tSideAdvantage;
  
  // Economic inference
  const avgArmor = xyzData.reduce((sum, p) => sum + p.armor, 0) / xyzData.length;
  const avgHealth = xyzData.reduce((sum, p) => sum + p.health, 0) / xyzData.length;
  
  let economicPhase: 'eco' | 'force' | 'full' | 'mixed' = 'mixed';
  if (avgHealth > 80 && avgArmor > 50) economicPhase = 'full';
  else if (avgHealth < 50 && avgArmor < 30) economicPhase = 'eco';
  else if (avgHealth > 60) economicPhase = 'force';
  
  // Coordination analysis
  const coordinations = xyzData.reduce((acc, player) => {
    const teammates = xyzData.filter(other => 
      other.side === player.side && 
      other.name !== player.name &&
      Math.sqrt((player.X - other.X) ** 2 + (player.Y - other.Y) ** 2) < 600
    );
    return acc + teammates.length;
  }, 0) / 2;
  
  let coordinationLevel: 'low' | 'medium' | 'high' = 'low';
  if (coordinations > 20) coordinationLevel = 'high';
  else if (coordinations > 10) coordinationLevel = 'medium';
  
  // Momentum calculation
  const velocitySum = xyzData.reduce((sum, p) => 
    sum + Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2), 0
  );
  const avgVelocity = velocitySum / xyzData.length;
  
  let momentumDirection: 'neutral' | 't_favor' | 'ct_favor' = 'neutral';
  if (tSideAdvantage > 0.3) momentumDirection = 't_favor';
  else if (ctSideAdvantage > 0.3) momentumDirection = 'ct_favor';
  
  // Outcome prediction
  let predictedOutcome = 'BALANCED ROUND';
  let confidence = 50;
  
  if (Math.abs(tSideAdvantage) > 0.4) {
    predictedOutcome = tSideAdvantage > 0 ? 'T-SIDE VICTORY' : 'CT-SIDE VICTORY';
    confidence = Math.min(85, 50 + Math.abs(tSideAdvantage) * 70);
  }
  
  return {
    tSideAdvantage,
    ctSideAdvantage,
    economicPhase,
    coordinationLevel,
    momentumDirection,
    predictedOutcome,
    confidence: Math.round(confidence)
  };
}

/**
 * Generate predictive insights for current match state
 */
export function generatePredictiveInsights(xyzData: XYZPlayerData[]): PredictiveInsight[] {
  const insights: PredictiveInsight[] = [];
  const matchState = analyzeMatchState(xyzData);
  
  // Outcome prediction insight
  insights.push({
    type: 'outcome',
    prediction: matchState.predictedOutcome,
    confidence: matchState.confidence,
    timeframe: 'immediate',
    factors: [
      `${matchState.coordinationLevel} team coordination`,
      `${matchState.economicPhase} buy round`,
      `${matchState.momentumDirection.replace('_', '-')} momentum`
    ],
    recommendation: matchState.confidence > 70 ? 
      'High confidence prediction - expect outcome as forecasted' :
      'Moderate confidence - round could swing either direction'
  });
  
  // Momentum analysis
  if (matchState.momentumDirection !== 'neutral') {
    insights.push({
      type: 'momentum',
      prediction: `${matchState.momentumDirection.toUpperCase().replace('_', '-')} momentum building`,
      confidence: 75,
      timeframe: 'short',
      factors: ['Player positioning', 'Health distribution', 'Movement patterns'],
      recommendation: matchState.momentumDirection === 't_favor' ?
        'CT-side should focus on defensive holds and trade kills' :
        'T-side should look for picks and utility advantages'
    });
  }
  
  // Economic predictions
  insights.push({
    type: 'economy',
    prediction: `${matchState.economicPhase.toUpperCase()} round economics detected`,
    confidence: 82,
    timeframe: 'immediate',
    factors: ['Player health levels', 'Armor distribution', 'Previous round impact'],
    recommendation: matchState.economicPhase === 'full' ?
      'Expect heavy utility usage and aggressive plays' :
      'Limited utility available - focus on positioning and aim duels'
  });
  
  // Tactical timing prediction
  const highActivity = xyzData.filter(d => 
    Math.sqrt(d.velocity_X ** 2 + d.velocity_Y ** 2) > 180
  ).length;
  
  if (highActivity > 3) {
    insights.push({
      type: 'timing',
      prediction: 'Immediate action window - execute imminent',
      confidence: 78,
      timeframe: 'immediate',
      factors: ['High player mobility', 'Coordinated movement', 'Tactical positioning'],
      recommendation: 'Prepare for immediate engagements and utility exchanges'
    });
  }
  
  // Coordination prediction
  if (matchState.coordinationLevel === 'high') {
    insights.push({
      type: 'tactical',
      prediction: 'Synchronized team execute likely',
      confidence: 85,
      timeframe: 'short',
      factors: ['High coordination index', 'Clustered positioning', 'Movement synchronization'],
      recommendation: 'Expect coordinated utility usage and multi-site pressure'
    });
  }
  
  return insights;
}

/**
 * Calculate advanced momentum indicators
 */
export function calculateMomentumMetrics(xyzData: XYZPlayerData[]) {
  const tPlayers = xyzData.filter(d => d.side === 't');
  const ctPlayers = xyzData.filter(d => d.side === 'ct');
  
  // Velocity-based momentum
  const tMomentum = tPlayers.reduce((sum, p) => 
    sum + Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2), 0
  ) / tPlayers.length;
  
  const ctMomentum = ctPlayers.reduce((sum, p) => 
    sum + Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2), 0
  ) / ctPlayers.length;
  
  // Positional momentum (territory control shifts)
  const tPositions = tPlayers.map(p => ({ x: p.X, y: p.Y }));
  const ctPositions = ctPlayers.map(p => ({ x: p.X, y: p.Y }));
  
  // Calculate center of mass for each team
  const tCenterX = tPositions.reduce((sum, pos) => sum + pos.x, 0) / tPositions.length;
  const tCenterY = tPositions.reduce((sum, pos) => sum + pos.y, 0) / tPositions.length;
  const ctCenterX = ctPositions.reduce((sum, pos) => sum + pos.x, 0) / ctPositions.length;
  const ctCenterY = ctPositions.reduce((sum, pos) => sum + pos.y, 0) / ctPositions.length;
  
  // Distance between team centers (lower = more contested)
  const teamDistance = Math.sqrt((tCenterX - ctCenterX) ** 2 + (tCenterY - ctCenterY) ** 2);
  const contestedLevel = Math.max(0, Math.min(100, 100 - (teamDistance / 50)));
  
  return {
    tMomentum: Math.round(tMomentum),
    ctMomentum: Math.round(ctMomentum),
    contestedLevel: Math.round(contestedLevel),
    teamDistance: Math.round(teamDistance),
    momentumRatio: ctMomentum > 0 ? Math.round((tMomentum / ctMomentum) * 100) / 100 : 0
  };
}

/**
 * Predict next tactical phase based on current patterns
 */
export function predictNextPhase(xyzData: XYZPlayerData[]): {
  phase: string;
  confidence: number;
  duration: string;
  keyFactors: string[];
} {
  const matchState = analyzeMatchState(xyzData);
  const momentum = calculateMomentumMetrics(xyzData);
  
  let phase = 'POSITIONAL HOLD';
  let confidence = 60;
  let duration = '10-15 seconds';
  const keyFactors: string[] = [];
  
  // High momentum = action phase
  if (momentum.tMomentum > 200 || momentum.ctMomentum > 200) {
    phase = 'ACTIVE ENGAGEMENT';
    confidence = 80;
    duration = '5-10 seconds';
    keyFactors.push('High player velocity', 'Active positioning');
  }
  
  // High coordination = execute phase
  if (matchState.coordinationLevel === 'high') {
    phase = 'COORDINATED EXECUTE';
    confidence = 85;
    duration = '8-12 seconds';
    keyFactors.push('Team coordination', 'Synchronized movement');
  }
  
  // Low health/eco = cautious phase
  if (matchState.economicPhase === 'eco') {
    phase = 'DEFENSIVE POSITIONING';
    confidence = 75;
    duration = '15-25 seconds';
    keyFactors.push('Economic constraints', 'Survival priority');
  }
  
  // High contest level = immediate action
  if (momentum.contestedLevel > 70) {
    phase = 'IMMEDIATE CONTACT';
    confidence = 90;
    duration = '3-8 seconds';
    keyFactors.push('Close proximity', 'Contested space');
  }
  
  return { phase, confidence, duration, keyFactors };
}