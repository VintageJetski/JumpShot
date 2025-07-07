/**
 * Phase 5: Competitive Intelligence Engine
 * AI-powered competitive analysis, pattern recognition, and strategic outcome prediction
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

interface CompetitiveIntelligence {
  overallScore: number;
  efficiency: {
    t: number;
    ct: number;
  };
  advantage: 'T-DOMINANT' | 'CT-DOMINANT' | 'COMPETITIVE' | 'BALANCED';
  competitiveMetrics: {
    resourceEfficiency: number;
    positionalAdvantage: number;
    coordinationIndex: number;
    adaptabilityScore: number;
  };
}

interface PatternRecognition {
  confidence: number;
  type: 'AGGRESSIVE' | 'TACTICAL' | 'DEFENSIVE' | 'ADAPTIVE';
  strength: 'HIGH' | 'MEDIUM' | 'LOW';
  patterns: {
    movementPattern: string;
    coordinationPattern: string;
    tacticalPattern: string;
  };
  anomalies: string[];
}

interface MatchOutcomePrediction {
  prediction: 'T-SIDE VICTORY' | 'CT-SIDE VICTORY' | 'CLOSE ROUND' | 'OVERTIME LIKELY';
  confidence: number;
  factors: string[];
  probabilityDistribution: {
    tWin: number;
    ctWin: number;
    overtime: number;
  };
  keyInfluencers: string[];
}

interface StrategicRecommendations {
  priority: 'EXECUTE' | 'DEFEND' | 'ADAPT' | 'REPOSITION';
  focus: string;
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'MID_ROUND';
  recommendations: string[];
  counterStrategies: string[];
}

/**
 * Advanced competitive intelligence analysis with machine learning-inspired algorithms
 */
export function analyzeCompetitiveIntelligence(players: XYZPlayerData[]): CompetitiveIntelligence {
  const tPlayers = players.filter(p => p.side === 't');
  const ctPlayers = players.filter(p => p.side === 'ct');
  
  // Advanced efficiency calculations
  const tEfficiency = tPlayers.reduce((sum, p) => {
    const healthWeight = p.health * 0.6;
    const armorWeight = p.armor * 0.3;
    const mobilityWeight = Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2) * 0.1;
    return sum + healthWeight + armorWeight + mobilityWeight;
  }, 0);
  
  const ctEfficiency = ctPlayers.reduce((sum, p) => {
    const healthWeight = p.health * 0.6;
    const armorWeight = p.armor * 0.3;
    const mobilityWeight = Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2) * 0.1;
    return sum + healthWeight + armorWeight + mobilityWeight;
  }, 0);
  
  const totalEfficiency = tEfficiency + ctEfficiency;
  const tScore = totalEfficiency > 0 ? (tEfficiency / totalEfficiency) * 100 : 50;
  
  // Resource efficiency analysis
  const tAlive = tPlayers.filter(p => p.health > 0).length;
  const ctAlive = ctPlayers.filter(p => p.health > 0).length;
  const resourceEfficiency = tAlive > 0 && ctAlive > 0 ? 
    ((tEfficiency / tAlive) / (ctEfficiency / ctAlive)) * 50 : 50;
  
  // Positional advantage calculation
  const tPositions = tPlayers.filter(p => p.health > 0);
  const ctPositions = ctPlayers.filter(p => p.health > 0);
  
  const tSpread = tPositions.length > 1 ? 
    Math.max(...tPositions.map(p => p.X)) - Math.min(...tPositions.map(p => p.X)) : 0;
  const ctSpread = ctPositions.length > 1 ? 
    Math.max(...ctPositions.map(p => p.X)) - Math.min(...ctPositions.map(p => p.X)) : 0;
  
  const positionalAdvantage = Math.min(100, Math.max(0, 
    50 + ((tSpread - ctSpread) / 50)
  ));
  
  // Coordination index
  const tCoordination = calculateTeamCoordination(tPositions);
  const ctCoordination = calculateTeamCoordination(ctPositions);
  const coordinationIndex = (tCoordination + (100 - ctCoordination)) / 2;
  
  // Adaptability score based on velocity variance
  const tVelocities = tPlayers.map(p => Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2));
  const ctVelocities = ctPlayers.map(p => Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2));
  
  const tVariance = calculateVariance(tVelocities);
  const ctVariance = calculateVariance(ctVelocities);
  const adaptabilityScore = Math.min(100, (tVariance + ctVariance) / 10);
  
  // Determine competitive advantage
  let advantage: CompetitiveIntelligence['advantage'];
  if (tScore > 70) advantage = 'T-DOMINANT';
  else if (tScore < 30) advantage = 'CT-DOMINANT';
  else if (Math.abs(tScore - 50) < 10) advantage = 'BALANCED';
  else advantage = 'COMPETITIVE';
  
  return {
    overallScore: Math.round(tScore),
    efficiency: {
      t: Math.round(tEfficiency),
      ct: Math.round(ctEfficiency)
    },
    advantage,
    competitiveMetrics: {
      resourceEfficiency: Math.round(resourceEfficiency),
      positionalAdvantage: Math.round(positionalAdvantage),
      coordinationIndex: Math.round(coordinationIndex),
      adaptabilityScore: Math.round(adaptabilityScore)
    }
  };
}

/**
 * Advanced pattern recognition with behavioral analysis
 */
export function performPatternRecognition(players: XYZPlayerData[]): PatternRecognition {
  const activePlayers = players.filter(p => p.health > 0);
  
  // Movement pattern analysis
  const movementPatterns = activePlayers.map(p => ({
    velocity: Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2),
    position: { x: p.X, y: p.Y },
    side: p.side,
    behavior: categorizeMovementBehavior(p)
  }));
  
  const highMovement = movementPatterns.filter(p => p.velocity > 200).length;
  const mediumMovement = movementPatterns.filter(p => p.velocity > 100 && p.velocity <= 200).length;
  const lowMovement = movementPatterns.filter(p => p.velocity <= 100).length;
  
  // Coordination pattern analysis
  const tPlayers = activePlayers.filter(p => p.side === 't');
  const ctPlayers = activePlayers.filter(p => p.side === 'ct');
  
  const tCoordination = calculateTeamCoordination(tPlayers);
  const ctCoordination = calculateTeamCoordination(ctPlayers);
  const overallCoordination = (tCoordination + ctCoordination) / 2;
  
  // Pattern classification
  const movementActivity = activePlayers.length > 0 ? 
    (highMovement / activePlayers.length) * 100 : 0;
  
  let type: PatternRecognition['type'];
  let confidence: number;
  
  if (movementActivity > 60 && overallCoordination > 70) {
    type = 'AGGRESSIVE';
    confidence = Math.min(95, 70 + movementActivity * 0.3);
  } else if (overallCoordination > 60) {
    type = 'TACTICAL';
    confidence = Math.min(90, 60 + overallCoordination * 0.4);
  } else if (movementActivity < 30) {
    type = 'DEFENSIVE';
    confidence = Math.min(85, 50 + (100 - movementActivity) * 0.3);
  } else {
    type = 'ADAPTIVE';
    confidence = Math.min(80, 50 + Math.abs(movementActivity - 50) * 0.5);
  }
  
  // Pattern strength assessment
  const strength: PatternRecognition['strength'] = 
    confidence > 80 ? 'HIGH' : confidence > 60 ? 'MEDIUM' : 'LOW';
  
  // Detect anomalies
  const anomalies: string[] = [];
  if (highMovement > activePlayers.length * 0.8) {
    anomalies.push('Unusually high team mobility detected');
  }
  if (overallCoordination < 20) {
    anomalies.push('Extremely low coordination patterns');
  }
  if (movementActivity > 80 && overallCoordination < 30) {
    anomalies.push('High individual activity with low team coordination');
  }
  
  return {
    confidence: Math.round(confidence),
    type,
    strength,
    patterns: {
      movementPattern: getMovementPatternDescription(movementActivity),
      coordinationPattern: getCoordinationPatternDescription(overallCoordination),
      tacticalPattern: getTacticalPatternDescription(type, confidence)
    },
    anomalies
  };
}

/**
 * Advanced match outcome prediction with multiple factors
 */
export function predictMatchOutcome(players: XYZPlayerData[]): MatchOutcomePrediction {
  const tPlayers = players.filter(p => p.side === 't');
  const ctPlayers = players.filter(p => p.side === 'ct');
  
  const tAlive = tPlayers.filter(p => p.health > 0).length;
  const ctAlive = ctPlayers.filter(p => p.health > 0).length;
  
  // Multi-factor analysis
  const playerAdvantage = (tAlive - ctAlive) * 15;
  
  const tAvgHealth = tPlayers.reduce((sum, p) => sum + p.health, 0) / tPlayers.length || 0;
  const ctAvgHealth = ctPlayers.reduce((sum, p) => sum + p.health, 0) / ctPlayers.length || 0;
  const healthAdvantage = (tAvgHealth - ctAvgHealth) * 0.4;
  
  const tMobility = tPlayers.reduce((sum, p) => 
    sum + Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2), 0
  ) / tPlayers.length || 0;
  const ctMobility = ctPlayers.reduce((sum, p) => 
    sum + Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2), 0
  ) / ctPlayers.length || 0;
  const mobilityAdvantage = (tMobility - ctMobility) * 0.1;
  
  const competitiveIntel = analyzeCompetitiveIntelligence(players);
  const coordinationAdvantage = (competitiveIntel.competitiveMetrics.coordinationIndex - 50) * 0.3;
  
  // Calculate composite score
  const compositeScore = playerAdvantage + healthAdvantage + mobilityAdvantage + coordinationAdvantage;
  
  // Determine prediction and confidence
  let prediction: MatchOutcomePrediction['prediction'];
  let confidence: number;
  const factors: string[] = [];
  const keyInfluencers: string[] = [];
  
  if (compositeScore > 40) {
    prediction = 'T-SIDE VICTORY';
    confidence = Math.min(95, 60 + Math.abs(compositeScore) * 0.8);
    factors.push('T-side player advantage', 'Superior positioning');
    keyInfluencers.push('Player count differential', 'Health advantage');
  } else if (compositeScore < -40) {
    prediction = 'CT-SIDE VICTORY';
    confidence = Math.min(95, 60 + Math.abs(compositeScore) * 0.8);
    factors.push('CT-side defensive strength', 'Health advantage');
    keyInfluencers.push('Defensive positioning', 'Health differential');
  } else if (Math.abs(compositeScore) < 15) {
    prediction = 'OVERTIME LIKELY';
    confidence = 70;
    factors.push('Extremely balanced teams', 'Close competitive state');
    keyInfluencers.push('Balanced player counts', 'Similar health levels');
  } else {
    prediction = 'CLOSE ROUND';
    confidence = 65;
    factors.push('Competitive balance', 'Outcome depends on execution');
    keyInfluencers.push('Tactical execution', 'Individual skill');
  }
  
  // Calculate probability distribution
  const tWinProb = Math.max(5, Math.min(95, 50 + compositeScore));
  const ctWinProb = 100 - tWinProb;
  const overtimeProb = Math.abs(compositeScore) < 20 ? 15 : 5;
  
  return {
    prediction,
    confidence: Math.round(confidence),
    factors,
    probabilityDistribution: {
      tWin: Math.round(tWinProb),
      ctWin: Math.round(ctWinProb),
      overtime: overtimeProb
    },
    keyInfluencers
  };
}

/**
 * Generate strategic recommendations based on comprehensive analysis
 */
export function generateStrategicRecommendations(players: XYZPlayerData[]): StrategicRecommendations {
  const competitiveIntel = analyzeCompetitiveIntelligence(players);
  const patternRecognition = performPatternRecognition(players);
  const matchOutcome = predictMatchOutcome(players);
  
  const tAlive = players.filter(p => p.side === 't' && p.health > 0).length;
  const ctAlive = players.filter(p => p.side === 'ct' && p.health > 0).length;
  
  let priority: StrategicRecommendations['priority'];
  let focus: string;
  let timeframe: StrategicRecommendations['timeframe'];
  const recommendations: string[] = [];
  const counterStrategies: string[] = [];
  
  // Determine strategic priority based on multiple factors
  if (competitiveIntel.advantage === 'T-DOMINANT' || 
      (tAlive > ctAlive && matchOutcome.confidence > 70)) {
    priority = 'EXECUTE';
    focus = 'Capitalize on overwhelming advantage with coordinated aggressive plays';
    timeframe = 'IMMEDIATE';
    recommendations.push(
      'Coordinate team execute with utility support',
      'Maintain aggressive tempo and map control',
      'Focus on trading kills and maintaining player advantage'
    );
    counterStrategies.push(
      'Avoid individual peaks and risky plays',
      'Use utility to clear common angles',
      'Execute quickly before CT rotations'
    );
  } else if (competitiveIntel.advantage === 'CT-DOMINANT' || 
             (ctAlive > tAlive && matchOutcome.confidence > 70)) {
    priority = 'DEFEND';
    focus = 'Maintain defensive superiority through disciplined positioning';
    timeframe = 'SHORT_TERM';
    recommendations.push(
      'Hold disciplined angles and avoid over-rotations',
      'Force T-side into unfavorable engagements',
      'Use utility to delay and disrupt T-side executes'
    );
    counterStrategies.push(
      'Avoid aggressive peaks and overextensions',
      'Coordinate rotations based on information',
      'Save utility for retake scenarios'
    );
  } else if (patternRecognition.type === 'ADAPTIVE' || 
             competitiveIntel.advantage === 'BALANCED') {
    priority = 'ADAPT';
    focus = 'Read opponent patterns and counter-adapt strategically';
    timeframe = 'MID_ROUND';
    recommendations.push(
      'Gather information before committing to strategies',
      'Maintain tactical flexibility and multiple options',
      'Focus on individual skill and aim duels'
    );
    counterStrategies.push(
      'Avoid predictable patterns and timings',
      'Keep multiple strategic options available',
      'Emphasize communication and information sharing'
    );
  } else {
    priority = 'REPOSITION';
    focus = 'Adjust positioning to optimize tactical advantages';
    timeframe = 'SHORT_TERM';
    recommendations.push(
      'Reposition for better map control and angles',
      'Coordinate team positioning for optimal coverage',
      'Use utility to control key map areas'
    );
    counterStrategies.push(
      'Avoid static positioning and predictable setups',
      'Maintain mobility for quick repositioning',
      'Use smokes and flashes for repositioning cover'
    );
  }
  
  return {
    priority,
    focus,
    timeframe,
    recommendations,
    counterStrategies
  };
}

/**
 * Comprehensive competitive intelligence analysis
 */
export function generateCompetitiveIntelligenceReport(players: XYZPlayerData[]) {
  const competitiveIntel = analyzeCompetitiveIntelligence(players);
  const patternRecognition = performPatternRecognition(players);
  const matchOutcome = predictMatchOutcome(players);
  const strategicRecommendations = generateStrategicRecommendations(players);
  
  return {
    competitiveIntelligence: competitiveIntel,
    patternRecognition,
    matchOutcome,
    strategicRecommendations,
    timestamp: new Date().toISOString(),
    dataPoints: players.length,
    analysisConfidence: Math.round((
      patternRecognition.confidence +
      matchOutcome.confidence +
      (competitiveIntel.competitiveMetrics.coordinationIndex + 
       competitiveIntel.competitiveMetrics.adaptabilityScore) / 2
    ) / 3)
  };
}

// Helper functions
function calculateTeamCoordination(players: XYZPlayerData[]): number {
  if (players.length < 2) return 100;
  
  let coordinationSum = 0;
  let pairCount = 0;
  
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const distance = Math.sqrt(
        (players[i].X - players[j].X) ** 2 + 
        (players[i].Y - players[j].Y) ** 2
      );
      
      // Closer players indicate higher coordination
      const coordination = Math.max(0, 100 - (distance / 10));
      coordinationSum += coordination;
      pairCount++;
    }
  }
  
  return pairCount > 0 ? coordinationSum / pairCount : 0;
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  return Math.sqrt(variance);
}

function categorizeMovementBehavior(player: XYZPlayerData): string {
  const velocity = Math.sqrt(player.velocity_X ** 2 + player.velocity_Y ** 2);
  
  if (velocity > 250) return 'RUSHING';
  if (velocity > 150) return 'MOBILE';
  if (velocity > 50) return 'WALKING';
  return 'STATIONARY';
}

function getMovementPatternDescription(activity: number): string {
  if (activity > 70) return 'High mobility team movement with aggressive positioning';
  if (activity > 40) return 'Moderate team movement with tactical positioning';
  if (activity > 20) return 'Conservative movement with defensive positioning';
  return 'Minimal movement with static positioning';
}

function getCoordinationPatternDescription(coordination: number): string {
  if (coordination > 80) return 'Exceptional team coordination and synchronization';
  if (coordination > 60) return 'Strong coordination with good team synergy';
  if (coordination > 40) return 'Moderate coordination with some team cohesion';
  return 'Low coordination with individual player focus';
}

function getTacticalPatternDescription(type: string, confidence: number): string {
  const confidenceLevel = confidence > 80 ? 'highly confident' : 
                          confidence > 60 ? 'confident' : 'moderate confidence';
  
  return `${type.toLowerCase()} tactical approach detected with ${confidenceLevel} pattern recognition`;
}