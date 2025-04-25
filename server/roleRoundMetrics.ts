import { PlayerRawStats, PlayerRole, RoundData } from '@shared/schema';

/**
 * Group rounds by halves (first half, second half) for a team
 */
export function groupRoundsByHalf(rounds: RoundData[], teamName: string): RoundData[][] {
  // Group rounds by match
  const matchMap = new Map<string, RoundData[]>();
  
  rounds.forEach(round => {
    if (round.ctTeam === teamName || round.tTeam === teamName) {
      const matchKey = round.demoFileName;
      if (!matchMap.has(matchKey)) {
        matchMap.set(matchKey, []);
      }
      matchMap.get(matchKey)?.push(round);
    }
  });
  
  // Split each match into halves
  const halves: RoundData[][] = [];
  
  for (const matchRounds of matchMap.values()) {
    // Sort rounds by number
    const sortedRounds = [...matchRounds].sort((a, b) => a.roundNum - b.roundNum);
    
    // Split into halves (assuming first to 13 format)
    const halfLength = 12; // First half is 12 rounds
    
    if (sortedRounds.length > 0) {
      const firstHalf = sortedRounds.filter(r => r.roundNum <= halfLength);
      const secondHalf = sortedRounds.filter(r => r.roundNum > halfLength);
      
      if (firstHalf.length > 0) halves.push(firstHalf);
      if (secondHalf.length > 0) halves.push(secondHalf);
    }
  }
  
  return halves;
}

/**
 * Calculate site selection patterns for a set of rounds
 */
export function calculateSiteSelectionPatterns(rounds: RoundData[], teamName: string): {
  siteVariability: number;
  tRoundWinRate: number;
} {
  const tRounds = rounds.filter(round => round.tTeam === teamName);
  if (tRounds.length === 0) {
    return { siteVariability: 0.5, tRoundWinRate: 0.5 };
  }
  
  // Count site selections
  const siteCounts = {
    'bombsite_a': 0,
    'bombsite_b': 0,
    'not_planted': 0
  };
  
  tRounds.forEach(round => {
    siteCounts[round.bombSite]++;
  });
  
  // Calculate site variability (more balanced = higher variability)
  const totalSiteAttacks = siteCounts['bombsite_a'] + siteCounts['bombsite_b'];
  
  let siteVariability = 0.5; // Default
  if (totalSiteAttacks > 0) {
    const aSiteRatio = siteCounts['bombsite_a'] / totalSiteAttacks;
    // Perfect balance would be 0.5, so variability is how close to 0.5 it is
    siteVariability = 1 - Math.abs(0.5 - aSiteRatio) * 2;
  }
  
  // Calculate T-side round win rate
  const tRoundWins = tRounds.filter(round => round.winnerTeam === teamName).length;
  const tRoundWinRate = tRounds.length > 0 ? tRoundWins / tRounds.length : 0.5;
  
  return {
    siteVariability,
    tRoundWinRate
  };
}

/**
 * Identify rounds that were likely after timeouts
 * This is an estimation since we don't have explicit timeout data
 */
export function identifyTimeoutRounds(rounds: RoundData[], teamName: string): RoundData[] {
  // Timeouts often come after losing multiple rounds in a row
  // or at the start of a half after pistol loss
  const timeoutRounds: RoundData[] = [];
  
  // Group rounds by match
  const matchMap = new Map<string, RoundData[]>();
  
  rounds.forEach(round => {
    if (round.ctTeam === teamName || round.tTeam === teamName) {
      const matchKey = round.demoFileName;
      if (!matchMap.has(matchKey)) {
        matchMap.set(matchKey, []);
      }
      matchMap.get(matchKey)?.push(round);
    }
  });
  
  // Analyze each match
  for (const matchRounds of matchMap.values()) {
    // Sort rounds by number
    const sortedRounds = [...matchRounds].sort((a, b) => a.roundNum - b.roundNum);
    
    // Check each round
    sortedRounds.forEach((round, index) => {
      // Skip first round
      if (index === 0) return;
      
      const prevRound = sortedRounds[index - 1];
      
      // Check if this is after a lost round
      if (prevRound.winnerTeam !== teamName) {
        // Look for losing streak
        let losingStreak = 1;
        for (let i = index - 2; i >= 0 && losingStreak < 3; i--) {
          if (sortedRounds[i].winnerTeam !== teamName) {
            losingStreak++;
          } else {
            break;
          }
        }
        
        // Consider rounds after 2+ losses as potential timeout rounds
        if (losingStreak >= 2) {
          timeoutRounds.push(round);
        }
        
        // Also consider rounds after pistol loss
        if (prevRound.roundNum === 1 || prevRound.roundNum === 13) {
          timeoutRounds.push(round);
        }
      }
    });
  }
  
  return timeoutRounds;
}

/**
 * Determine if a round is a match point round
 */
export function isMatchPoint(round: RoundData, allRounds: RoundData[]): boolean {
  // Filter rounds from the same match
  const matchRounds = allRounds.filter(r => r.demoFileName === round.demoFileName);
  
  // Count round wins for each team up to this round
  const ctTeamWins = matchRounds
    .filter(r => r.roundNum < round.roundNum && r.winnerTeam === round.ctTeam)
    .length;
    
  const tTeamWins = matchRounds
    .filter(r => r.roundNum < round.roundNum && r.winnerTeam === round.tTeam)
    .length;
  
  // In CS2's "first to 13" format, 12 rounds would be match point
  return ctTeamWins === 12 || tTeamWins === 12;
}

/**
 * Group rounds by matches a player participated in
 */
export function getPlayerMatchesFromRounds(rounds: RoundData[], playerTeam: string): {
  matchId: string;
  rounds: RoundData[];
}[] {
  // Group rounds by match
  const matchMap = new Map<string, RoundData[]>();
  
  rounds.forEach(round => {
    if (round.ctTeam === playerTeam || round.tTeam === playerTeam) {
      const matchKey = round.demoFileName;
      if (!matchMap.has(matchKey)) {
        matchMap.set(matchKey, []);
      }
      matchMap.get(matchKey)?.push(round);
    }
  });
  
  // Convert to array format
  return Array.from(matchMap.entries()).map(([matchId, matchRounds]) => ({
    matchId,
    rounds: matchRounds
  }));
}

/**
 * Calculate IGL-specific round-based metrics
 */
export function calculateIGLMetricsFromRounds(rounds: RoundData[], teamName: string): {
  economicManagementScore: number;
  adaptiveStrategyScore: number;
  momentumControlScore: number;
  timeoutEffectivenessScore: number;
} {
  // Economy management - IGL's ability to manage the team's economy
  let fullBuyRounds = 0;
  let fullBuyWins = 0;
  let forceRounds = 0;
  let forceWins = 0;
  let ecoRounds = 0;
  let ecoWins = 0;
  
  rounds.forEach(round => {
    const isCT = round.ctTeam === teamName;
    const isT = round.tTeam === teamName;
    const isWinner = round.winnerTeam === teamName;
    
    if (isCT || isT) {
      const buyType = isCT ? round.ctBuyType : round.tBuyType;
      
      if (buyType === 'Full Buy') {
        fullBuyRounds++;
        if (isWinner) fullBuyWins++;
      } else if (buyType === 'Force Buy' || buyType === 'Semi-Buy') {
        forceRounds++;
        if (isWinner) forceWins++;
      } else if (buyType === 'Full Eco' || buyType === 'Pistol') {
        ecoRounds++;
        if (isWinner) ecoWins++;
      }
    }
  });
  
  const fullBuyWinRate = fullBuyRounds > 0 ? fullBuyWins / fullBuyRounds : 0;
  const forceWinRate = forceRounds > 0 ? forceWins / forceRounds : 0;
  const ecoWinRate = ecoRounds > 0 ? ecoWins / ecoRounds : 0;
  
  // Weight economy management score towards full buy and force buy success
  const economicManagementScore = (
    fullBuyWinRate * 0.5 + 
    forceWinRate * 0.35 + 
    ecoWinRate * 0.15
  );
  
  // Adaptive strategy - based on bomb site selection patterns and success
  const roundsByHalf = groupRoundsByHalf(rounds, teamName);
  const adaptiveStrategies = roundsByHalf.map(halfRounds => 
    calculateSiteSelectionPatterns(halfRounds, teamName)
  );
  
  // Score higher for varied site selection that still results in wins
  const adaptiveStrategyScore = adaptiveStrategies.length > 0 ? 
    adaptiveStrategies.reduce((score, half) => 
      score + (half.siteVariability * half.tRoundWinRate), 0) / adaptiveStrategies.length : 0.5;
  
  // Momentum control - managing pistol rounds and follow-ups
  let pistolRounds = 0;
  let pistolWins = 0;
  let followupRounds = 0;
  let followupWins = 0;
  let comebackRounds = 0;
  let comebackWins = 0;
  
  // Sort rounds by number to ensure chronological order
  const sortedRounds = [...rounds].sort((a, b) => a.roundNum - b.roundNum);
  
  sortedRounds.forEach((round, index) => {
    const isCT = round.ctTeam === teamName;
    const isT = round.tTeam === teamName;
    const isWinner = round.winnerTeam === teamName;
    
    if (isCT || isT) {
      // Pistol rounds (1, potentially 13 in new format)
      if (round.roundNum === 1 || round.roundNum === 13) {
        pistolRounds++;
        if (isWinner) pistolWins++;
      }
      
      // Follow-up rounds after pistol
      if ((round.roundNum === 2 || round.roundNum === 3 || round.roundNum === 14 || round.roundNum === 15) && 
          index > 0 && sortedRounds[index-1].winnerTeam === teamName) {
        followupRounds++;
        if (isWinner) followupWins++;
      }
      
      // Comeback from losing streaks
      const losingStreak = isCT ? round.ctLosingStreak : round.tLosingStreak;
      if (losingStreak >= 2) {
        comebackRounds++;
        if (isWinner) comebackWins++;
      }
    }
  });
  
  const pistolWinRate = pistolRounds > 0 ? pistolWins / pistolRounds : 0;
  const followupWinRate = followupRounds > 0 ? followupWins / followupRounds : 0;
  const comebackRate = comebackRounds > 0 ? comebackWins / comebackRounds : 0;
  
  const momentumControlScore = (
    pistolWinRate * 0.4 + 
    followupWinRate * 0.3 + 
    comebackRate * 0.3
  );
  
  // Timeout effectiveness - win rate after timeouts
  const timeoutRounds = identifyTimeoutRounds(rounds, teamName);
  const timeoutWins = timeoutRounds.filter(round => round.winnerTeam === teamName).length;
  const timeoutEffectivenessScore = timeoutRounds.length > 0 ? 
    timeoutWins / timeoutRounds.length : 0.5; // Default to 0.5 if no timeouts found
  
  return {
    economicManagementScore,
    adaptiveStrategyScore,
    momentumControlScore,
    timeoutEffectivenessScore
  };
}

/**
 * Calculate AWPer-specific round-based metrics
 */
export function calculateAWPerMetricsFromRounds(rounds: RoundData[], playerStats: PlayerRawStats): {
  openingDuelImpact: number;
  mapControlScore: number;
  pivotalRoundImpact: number;
} {
  const teamName = playerStats.teamName;
  
  // Calculate opening duel impact
  // This is based on the player's first kills relative to overall performance
  const firstKills = playerStats.firstKills;
  const totalRounds = rounds.length;
  
  // Estimate first kill impact on rounds
  // We use the player's first kill percentage as a proxy for their impact
  const playerFirstKillPercentage = totalRounds > 0 ? firstKills / totalRounds : 0;
  
  // We'll weight this by the team's win rate when getting the first kill
  const firstKillAdvantageRounds = rounds.filter(round => 
    (round.ctTeam === teamName && round.firstAdvantage === 'ct') ||
    (round.tTeam === teamName && round.firstAdvantage === 't')
  );
  
  const firstKillWins = firstKillAdvantageRounds.filter(round => 
    round.winnerTeam === teamName
  ).length;
  
  const firstKillWinRate = firstKillAdvantageRounds.length > 0 ? 
    firstKillWins / firstKillAdvantageRounds.length : 0.5;
  
  // Combine the player's first kill frequency with the team's ability to convert those advantages
  const openingDuelImpact = playerFirstKillPercentage * firstKillWinRate;
  
  // Map control score - impact on locking down areas
  // For AWPers, we look at CT side performance particularly 
  const ctRounds = rounds.filter(round => round.ctTeam === teamName);
  const tRounds = rounds.filter(round => round.tTeam === teamName);
  
  const ctWins = ctRounds.filter(round => round.winnerTeam === teamName).length;
  const tWins = tRounds.filter(round => round.winnerTeam === teamName).length;
  
  const ctWinRate = ctRounds.length > 0 ? ctWins / ctRounds.length : 0.5;
  const tWinRate = tRounds.length > 0 ? tWins / tRounds.length : 0.5;
  
  // AWPers typically have more impact on CT side for map control
  const mapControlScore = (ctWinRate * 0.7) + (tWinRate * 0.3);
  
  // Pivotal round impact (eco rounds, match points)
  const pivotalRounds = rounds.filter(round => 
    // Economic mismatch rounds (e.g., eco vs full buy)
    (round.ctTeam === teamName && round.ctBuyType === 'Full Eco' && round.tBuyType === 'Full Buy') ||
    (round.tTeam === teamName && round.tBuyType === 'Full Eco' && round.ctBuyType === 'Full Buy') ||
    // Match points
    isMatchPoint(round, rounds)
  );
  
  const pivotalWins = pivotalRounds.filter(round => round.winnerTeam === teamName).length;
  const pivotalRoundImpact = pivotalRounds.length > 0 ?
    pivotalWins / pivotalRounds.length : 0.5;
  
  return {
    openingDuelImpact,
    mapControlScore,
    pivotalRoundImpact
  };
}

/**
 * Calculate Spacetaker-specific round-based metrics
 */
export function calculateSpacetakerMetricsFromRounds(rounds: RoundData[], playerStats: PlayerRawStats): {
  entrySuccessScore: number;
  spaceCreationScore: number;
  siteTakeEfficiency: number;
} {
  const teamName = playerStats.teamName;
  
  // Entry success - based on first kills on T side
  const tSideFirstKills = playerStats.tFirstKills;
  const tSideRounds = rounds.filter(round => round.tTeam === teamName);
  const entryFrequency = tSideRounds.length > 0 ? tSideFirstKills / tSideRounds.length : 0;
  
  // We don't know which specific rounds the player got first kills in, 
  // so we estimate their impact by looking at the team's T-side win rate
  const tSideWins = tSideRounds.filter(round => round.winnerTeam === teamName).length;
  const tSideWinRate = tSideRounds.length > 0 ? tSideWins / tSideRounds.length : 0.5;
  
  // Combined entry success score
  const entrySuccessScore = entryFrequency * tSideWinRate;
  
  // Space creation - measured by bomb plant success rate on T side
  const bombPlants = tSideRounds.filter(round => round.bombPlant).length;
  const bombPlantRate = tSideRounds.length > 0 ? bombPlants / tSideRounds.length : 0;
  
  // We weight this by the post-plant win rate to get the impact of space creation
  const postPlantWins = tSideRounds.filter(round => 
    round.bombPlant && round.winnerTeam === teamName
  ).length;
  
  const postPlantWinRate = bombPlants > 0 ? postPlantWins / bombPlants : 0;
  
  // Space creation score combines bomb plant rate with post-plant win rate
  const spaceCreationScore = bombPlantRate * postPlantWinRate;
  
  // Site take efficiency - time from round start to plant
  // Calculate average time per plant for the team
  let totalPlantTimes = 0;
  let plantCount = 0;
  
  tSideRounds.forEach(round => {
    if (round.bombPlant && round.bomb_plant) {
      const plantTime = parseInt(round.bomb_plant) - parseInt(round.freeze_end);
      if (!isNaN(plantTime) && plantTime > 0) {
        totalPlantTimes += plantTime;
        plantCount++;
      }
    }
  });
  
  const avgPlantTime = plantCount > 0 ? totalPlantTimes / plantCount : 60000; // Default to 60 seconds
  
  // Normalize to a 0-1 scale where faster is better (lower time = higher score)
  // 20 seconds would be an excellent time, 60+ seconds would be slow
  const siteTakeEfficiency = Math.max(0, Math.min(1, 1 - (avgPlantTime / 60000)));
  
  return {
    entrySuccessScore,
    spaceCreationScore,
    siteTakeEfficiency
  };
}

/**
 * Calculate Support-specific round-based metrics
 */
export function calculateSupportMetricsFromRounds(rounds: RoundData[], playerStats: PlayerRawStats): {
  utilityImpactScore: number;
  postPlantSupportScore: number;
  retakeContributionScore: number;
} {
  const teamName = playerStats.teamName;
  
  // Utility impact - based on flashes and other utility
  const flashesThrown = playerStats.flashesThrown;
  const flashAssists = playerStats.assistedFlashes;
  const totalUtility = playerStats.totalUtilityThrown;
  
  // Calculate utility efficiency - assists per flash
  const flashEfficiency = flashesThrown > 0 ? flashAssists / flashesThrown : 0;
  
  // Calculate utility usage rate - utility per round
  const utilityPerRound = totalUtility / rounds.length;
  
  // Normalize utility per round (5 per round would be high usage)
  const normalizedUtilityRate = Math.min(1, utilityPerRound / 5);
  
  // Combine for overall utility impact
  const utilityImpactScore = flashEfficiency * 0.6 + normalizedUtilityRate * 0.4;
  
  // Post-plant support
  const tSideRounds = rounds.filter(round => round.tTeam === teamName);
  const bombPlantRounds = tSideRounds.filter(round => round.bombPlant);
  const postPlantWins = bombPlantRounds.filter(round => round.winnerTeam === teamName).length;
  
  const postPlantSupportScore = bombPlantRounds.length > 0 ?
    postPlantWins / bombPlantRounds.length : 0.5;
  
  // Retake contribution
  const ctSideRounds = rounds.filter(round => round.ctTeam === teamName);
  const bombPlantedAgainstRounds = ctSideRounds.filter(round => round.bombPlant);
  const retakeWins = bombPlantedAgainstRounds.filter(round => round.winnerTeam === teamName).length;
  
  const retakeContributionScore = bombPlantedAgainstRounds.length > 0 ?
    retakeWins / bombPlantedAgainstRounds.length : 0.5;
  
  return {
    utilityImpactScore,
    postPlantSupportScore,
    retakeContributionScore
  };
}

/**
 * Calculate Lurker-specific round-based metrics
 */
export function calculateLurkerMetricsFromRounds(rounds: RoundData[], playerStats: PlayerRawStats): {
  flankTimingScore: number;
  informationGatheringScore: number;
  clutchImpactScore: number;
} {
  const teamName = playerStats.teamName;
  
  // Estimate flank timing based on round outcomes and timing
  // Lurkers often have impact in late-round situations
  const tSideRounds = rounds.filter(round => round.tTeam === teamName);
  
  // Calculate average round duration for won T-side rounds
  let totalWinDuration = 0;
  let winCount = 0;
  
  tSideRounds.forEach(round => {
    if (round.winnerTeam === teamName) {
      const roundDuration = parseInt(round.end) - parseInt(round.start);
      if (!isNaN(roundDuration) && roundDuration > 0) {
        totalWinDuration += roundDuration;
        winCount++;
      }
    }
  });
  
  const avgWinDuration = winCount > 0 ? totalWinDuration / winCount : 0;
  
  // Lurkers tend to have more impact in longer rounds
  // We'll normalize this where longer rounds (more lurker impact) get higher scores
  // 45s+ would be considered a long round with high lurker impact potential
  const normalizedDuration = Math.min(1, avgWinDuration / 45000);
  
  // Look at come-from-behind wins (when team had disadvantage)
  const comebackRounds = tSideRounds.filter(round => 
    round.firstAdvantage === 'ct' && round.winnerTeam === teamName
  );
  
  const comebackRate = tSideRounds.length > 0 ?
    comebackRounds.length / tSideRounds.length : 0;
  
  // Flank timing score combines duration and comeback rate
  const flankTimingScore = normalizedDuration * 0.6 + comebackRate * 0.4;
  
  // Information gathering - estimate based on team's ability to adapt strategies
  // We'll use site selection variability as a proxy
  const rounds1stHalf = tSideRounds.filter(r => r.roundNum <= 12);
  const rounds2ndHalf = tSideRounds.filter(r => r.roundNum > 12);
  
  let halfVariabilities: number[] = [];
  
  if (rounds1stHalf.length > 0) {
    const patterns1 = calculateSiteSelectionPatterns(rounds1stHalf, teamName);
    halfVariabilities.push(patterns1.siteVariability);
  }
  
  if (rounds2ndHalf.length > 0) {
    const patterns2 = calculateSiteSelectionPatterns(rounds2ndHalf, teamName);
    halfVariabilities.push(patterns2.siteVariability);
  }
  
  // Average site variability (higher = better information gathering)
  const informationGatheringScore = halfVariabilities.length > 0 ?
    halfVariabilities.reduce((sum, val) => sum + val, 0) / halfVariabilities.length : 0.5;
  
  // Clutch impact - we don't have player-specific clutch data
  // Estimate based on late-round win rate
  const lateRounds = tSideRounds.filter(round => {
    const roundDuration = parseInt(round.end) - parseInt(round.start);
    return roundDuration > 50000; // Rounds longer than 50 seconds
  });
  
  const lateRoundWins = lateRounds.filter(round => round.winnerTeam === teamName).length;
  const clutchImpactScore = lateRounds.length > 0 ?
    lateRoundWins / lateRounds.length : 0.5;
  
  return {
    flankTimingScore,
    informationGatheringScore,
    clutchImpactScore
  };
}

/**
 * Calculate Anchor/Rotator-specific round-based metrics
 */
export function calculateAnchorMetricsFromRounds(rounds: RoundData[], playerStats: PlayerRawStats): {
  siteDefenseScore: number;
  multiKillPotential: number;
  retakeContributionScore: number;
} {
  const teamName = playerStats.teamName;
  
  // Site defense - based on CT win rate
  const ctRounds = rounds.filter(round => round.ctTeam === teamName);
  const ctWins = ctRounds.filter(round => round.winnerTeam === teamName).length;
  const ctWinRate = ctRounds.length > 0 ? ctWins / ctRounds.length : 0.5;
  
  // Adjust based on player's first deaths - lower is better for anchors
  const ctFirstDeaths = playerStats.ctFirstDeaths;
  const firstDeathRate = ctRounds.length > 0 ? ctFirstDeaths / ctRounds.length : 0;
  
  // Calculate site defense score - higher win rate with lower first death rate
  const siteDefenseScore = ctWinRate * (1 - firstDeathRate);
  
  // Multi-kill potential - we don't have direct data, so estimate from overall K/D
  const multiKillPotential = Math.min(1, playerStats.kd / 2); // K/D of 2.0+ would be excellent
  
  // Retake contribution
  const bombPlantedAgainstRounds = ctRounds.filter(round => round.bombPlant);
  const retakeWins = bombPlantedAgainstRounds.filter(round => round.winnerTeam === teamName).length;
  
  const retakeContributionScore = bombPlantedAgainstRounds.length > 0 ?
    retakeWins / bombPlantedAgainstRounds.length : 0.5;
  
  return {
    siteDefenseScore,
    multiKillPotential,
    retakeContributionScore
  };
}

/**
 * Calculate enhanced PIV with round-based metrics included for a player's role
 */
export function calculateEnhancedPIV(
  playerRawStats: PlayerRawStats,
  role: PlayerRole,
  rounds: RoundData[],
  basePIV: number
): number {
  // Calculate round-based adjustment based on role
  let roundMetricsAdjustment = 0;
  
  switch (role) {
    case PlayerRole.IGL:
      const iglMetrics = calculateIGLMetricsFromRounds(rounds, playerRawStats.teamName);
      roundMetricsAdjustment = (
        iglMetrics.economicManagementScore * 0.3 +
        iglMetrics.adaptiveStrategyScore * 0.3 +
        iglMetrics.momentumControlScore * 0.25 +
        iglMetrics.timeoutEffectivenessScore * 0.15
      ) * 0.2; // 20% adjustment to base PIV
      break;
      
    case PlayerRole.AWP:
      const awpMetrics = calculateAWPerMetricsFromRounds(rounds, playerRawStats);
      roundMetricsAdjustment = (
        awpMetrics.openingDuelImpact * 0.4 +
        awpMetrics.mapControlScore * 0.4 +
        awpMetrics.pivotalRoundImpact * 0.2
      ) * 0.15; // 15% adjustment to base PIV
      break;
      
    case PlayerRole.Spacetaker:
      const spaceMetrics = calculateSpacetakerMetricsFromRounds(rounds, playerRawStats);
      roundMetricsAdjustment = (
        spaceMetrics.entrySuccessScore * 0.4 +
        spaceMetrics.spaceCreationScore * 0.4 +
        spaceMetrics.siteTakeEfficiency * 0.2
      ) * 0.15; // 15% adjustment to base PIV
      break;
      
    case PlayerRole.Support:
      const supportMetrics = calculateSupportMetricsFromRounds(rounds, playerRawStats);
      roundMetricsAdjustment = (
        supportMetrics.utilityImpactScore * 0.35 +
        supportMetrics.postPlantSupportScore * 0.35 +
        supportMetrics.retakeContributionScore * 0.3
      ) * 0.15; // 15% adjustment to base PIV
      break;
      
    case PlayerRole.Lurker:
      const lurkerMetrics = calculateLurkerMetricsFromRounds(rounds, playerRawStats);
      roundMetricsAdjustment = (
        lurkerMetrics.flankTimingScore * 0.3 +
        lurkerMetrics.informationGatheringScore * 0.35 +
        lurkerMetrics.clutchImpactScore * 0.35
      ) * 0.15; // 15% adjustment to base PIV
      break;
      
    case PlayerRole.Anchor:
    case PlayerRole.Rotator:
      const anchorMetrics = calculateAnchorMetricsFromRounds(rounds, playerRawStats);
      roundMetricsAdjustment = (
        anchorMetrics.siteDefenseScore * 0.4 +
        anchorMetrics.multiKillPotential * 0.35 +
        anchorMetrics.retakeContributionScore * 0.25
      ) * 0.15; // 15% adjustment to base PIV
      break;
      
    default:
      // For other roles, smaller adjustment
      roundMetricsAdjustment = 0.05;
      break;
  }
  
  // Apply adjustment (can be positive or negative)
  // We ensure the adjustment is between -0.2 and +0.3 to avoid extreme changes
  roundMetricsAdjustment = Math.max(-0.2, Math.min(0.3, roundMetricsAdjustment));
  
  // Apply final adjustment
  const adjustedPIV = basePIV * (1 + roundMetricsAdjustment);
  
  return adjustedPIV;
}