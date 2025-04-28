import { PlayerRawStats, PlayerRole, PlayerWithPIV, RoundData, TeamRoundMetrics, TeamWithTIR } from '@shared/schema';
import { parseRoundsCSV } from './newDataParser';
import path from 'path';

/**
 * Load round data from CSV file
 */
export async function loadRoundData(): Promise<RoundData[]> {
  try {
    const filePath = path.join(process.cwd(), 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - rounds (IEM_Katowice_2025).csv');
    console.log(`Loading round data from: ${filePath}`);
    const roundsData = await parseRoundsCSV(filePath);
    
    // Transform raw CSV data to our RoundData interface
    return roundsData.map(round => {
      // Extract map name from demo filename
      const demoName = round.demo_file_name;
      const mapName = demoName.split('-').pop()?.split('.')[0] || '';
      
      return {
        roundNum: parseInt(round.round_num),
        winner: round.winner as 'ct' | 't',
        reason: round.reason as 'ct_killed' | 't_killed' | 'bomb_exploded' | 'bomb_defused',
        bombPlant: round.bomb_plant !== '',
        bombSite: round.bomb_site as 'bombsite_a' | 'bombsite_b' | 'not_planted',
        ctTeam: round.CT_team_clan_name,
        tTeam: round.T_team_clan_name,
        winnerTeam: round.winner_clan_name,
        ctEquipValue: parseFloat(round.CT_team_current_equip_value.replace(/,/g, '')),
        tEquipValue: parseFloat(round.T_team_current_equip_value.replace(/,/g, '')),
        ctLosingStreak: parseInt(round.ct_losing_streak),
        tLosingStreak: parseInt(round.t_losing_streak),
        ctBuyType: round.CT_buy_type,
        tBuyType: round.T_buy_type,
        firstAdvantage: round['5v4_advantage'] as 'ct' | 't',
        demoFileName: round.demo_file_name,
        map: mapName,
        start: round.start,
        freeze_end: round.freeze_end,
        end: round.end,
        bomb_plant: round.bomb_plant !== '' ? round.bomb_plant : undefined
      };
    });
  } catch (error) {
    console.error('Error loading round data:', error);
    throw error;
  }
}

/**
 * Group rounds by match (team vs team on a specific map)
 */
export function groupRoundsByMatch(rounds: RoundData[]): Map<string, RoundData[]> {
  const matchMap = new Map<string, RoundData[]>();
  
  rounds.forEach(round => {
    const matchKey = `${round.ctTeam}_vs_${round.tTeam}_${round.map}`;
    if (!matchMap.has(matchKey)) {
      matchMap.set(matchKey, []);
    }
    matchMap.get(matchKey)?.push(round);
  });
  
  return matchMap;
}

/**
 * Calculate economy-related metrics for a team
 */
function calculateEconomyMetrics(rounds: RoundData[], teamName: string): {
  economyRating: number;
  economicEfficiency: number;
  forceRoundWinRate: number;
  ecoRoundWinRate: number;
  fullBuyWinRate: number;
  economicRecovery: number;
} {
  let ctRounds = 0, tRounds = 0;
  let ctWins = 0, tWins = 0;
  let ctSpent = 0, tSpent = 0;
  
  let forceRounds = 0, forceWins = 0;
  let ecoRounds = 0, ecoWins = 0;
  let fullBuyRounds = 0, fullBuyWins = 0;
  
  let lossRounds = 0, recoveryRounds = 0;
  
  rounds.forEach(round => {
    const isCT = round.ctTeam === teamName;
    const isT = round.tTeam === teamName;
    const isWinner = round.winnerTeam === teamName;
    
    if (isCT) {
      ctRounds++;
      ctSpent += round.ctEquipValue;
      if (isWinner) ctWins++;
      
      // Buy type analysis
      if (round.ctBuyType === 'Full Eco') {
        ecoRounds++;
        if (isWinner) ecoWins++;
      } else if (round.ctBuyType === 'Semi-Buy' || round.ctBuyType === 'Force Buy') {
        forceRounds++;
        if (isWinner) forceWins++;
      } else if (round.ctBuyType === 'Full Buy') {
        fullBuyRounds++;
        if (isWinner) fullBuyWins++;
      }
      
      // Recovery analysis
      if (round.ctLosingStreak > 0) {
        lossRounds++;
        if (isWinner) recoveryRounds++;
      }
    }
    
    if (isT) {
      tRounds++;
      tSpent += round.tEquipValue;
      if (isWinner) tWins++;
      
      // Buy type analysis
      if (round.tBuyType === 'Full Eco') {
        ecoRounds++;
        if (isWinner) ecoWins++;
      } else if (round.tBuyType === 'Semi-Buy' || round.tBuyType === 'Force Buy') {
        forceRounds++;
        if (isWinner) forceWins++;
      } else if (round.tBuyType === 'Full Buy') {
        fullBuyRounds++;
        if (isWinner) fullBuyWins++;
      }
      
      // Recovery analysis
      if (round.tLosingStreak > 0) {
        lossRounds++;
        if (isWinner) recoveryRounds++;
      }
    }
  });
  
  // Calculate total results
  const totalWins = ctWins + tWins;
  const totalRounds = ctRounds + tRounds;
  const totalSpent = ctSpent + tSpent;
  
  // Economic efficiency = wins / money spent (normalized)
  const econEfficiencyRatio = totalSpent > 0 ? (totalWins / totalSpent) * 100000 : 0;
  
  // Win rates by buy type
  const forceRoundWinRate = forceRounds > 0 ? forceWins / forceRounds : 0;
  const ecoRoundWinRate = ecoRounds > 0 ? ecoWins / ecoRounds : 0;
  const fullBuyWinRate = fullBuyRounds > 0 ? fullBuyWins / fullBuyRounds : 0;
  
  // Economic recovery
  const economicRecoveryIndex = lossRounds > 0 ? recoveryRounds / lossRounds : 0;
  
  // Calculate overall economy rating (0-1 scale)
  const economyRating = (
    (econEfficiencyRatio / 10) + 
    (forceRoundWinRate * 0.8) + 
    (ecoRoundWinRate * 0.7) + 
    (fullBuyWinRate * 0.9) + 
    (economicRecoveryIndex * 0.6)
  ) / 5;
  
  return {
    economyRating,
    economicEfficiency: econEfficiencyRatio,
    forceRoundWinRate,
    ecoRoundWinRate, 
    fullBuyWinRate,
    economicRecovery: economicRecoveryIndex
  };
}

/**
 * Calculate strategic metrics for a team
 */
function calculateStrategicMetrics(rounds: RoundData[], teamName: string): {
  strategyRating: number;
  aPreference: number;
  bPreference: number;
  bombPlantRate: number;
  postPlantWinRate: number;
  retakeSuccessRate: number;
} {
  let tRounds = 0;
  let aSiteAttacks = 0;
  let bSiteAttacks = 0;
  let bombPlants = 0;
  let postPlantWins = 0;
  let bombPlantedAgainst = 0;
  let retakeSuccess = 0;
  
  rounds.forEach(round => {
    const isCT = round.ctTeam === teamName;
    const isT = round.tTeam === teamName;
    const isWinner = round.winnerTeam === teamName;
    
    // T-side statistics
    if (isT) {
      tRounds++;
      
      if (round.bombPlant) {
        bombPlants++;
        if (round.bombSite === 'bombsite_a') aSiteAttacks++;
        if (round.bombSite === 'bombsite_b') bSiteAttacks++;
        if (isWinner) postPlantWins++;
      }
    }
    
    // CT-side retake statistics
    if (isCT && round.bombPlant) {
      bombPlantedAgainst++;
      if (isWinner) retakeSuccess++;
    }
  });
  
  const siteAttacks = aSiteAttacks + bSiteAttacks;
  const aPreference = siteAttacks > 0 ? aSiteAttacks / siteAttacks : 0.5;
  const bPreference = siteAttacks > 0 ? bSiteAttacks / siteAttacks : 0.5;
  
  const bombPlantRate = tRounds > 0 ? bombPlants / tRounds : 0;
  const postPlantWinRate = bombPlants > 0 ? postPlantWins / bombPlants : 0;
  const retakeSuccessRate = bombPlantedAgainst > 0 ? retakeSuccess / bombPlantedAgainst : 0;
  
  // Calculate overall strategy rating (0-1 scale)
  const strategyRating = (
    (bombPlantRate * 0.7) + 
    (postPlantWinRate * 0.9) + 
    (retakeSuccessRate * 0.8) + 
    (Math.abs(aPreference - 0.5) * 0.6) // Higher score for clear site preferences
  ) / 4;
  
  return {
    strategyRating,
    aPreference,
    bPreference,
    bombPlantRate,
    postPlantWinRate,
    retakeSuccessRate
  };
}

/**
 * Calculate momentum-related metrics for a team
 */
function calculateMomentumMetrics(rounds: RoundData[], teamName: string): {
  pistolRoundWinRate: number;
  followUpRoundWinRate: number;
  comebackFactor: number;
  closingFactor: number;
} {
  let pistolRounds = 0;
  let pistolWins = 0;
  let followUpRounds = 0;
  let followUpWins = 0;
  
  let losingStreakRounds = 0;
  let comebackRounds = 0;
  
  let advantageRounds = 0;
  let advantageWins = 0;
  
  // Sort rounds by number to ensure chronological order
  const sortedRounds = [...rounds].sort((a, b) => a.roundNum - b.roundNum);
  
  sortedRounds.forEach((round, index) => {
    const isCT = round.ctTeam === teamName;
    const isT = round.tTeam === teamName;
    const isWinner = round.winnerTeam === teamName;
    
    // Pistol rounds (1, potentially 16 in old format or 13 in new format)
    if (round.roundNum === 1 || round.roundNum === 13) {
      pistolRounds++;
      if (isWinner) pistolWins++;
    }
    
    // Follow-up rounds after pistol
    if ((round.roundNum === 2 || round.roundNum === 3 || round.roundNum === 14 || round.roundNum === 15) && 
        index > 0 && sortedRounds[index-1].winnerTeam === teamName) {
      followUpRounds++;
      if (isWinner) followUpWins++;
    }
    
    // Comeback analysis
    const losingStreak = isCT ? round.ctLosingStreak : (isT ? round.tLosingStreak : 0);
    if (losingStreak >= 2) {
      losingStreakRounds++;
      if (isWinner) comebackRounds++;
    }
    
    // Advantage analysis - did team convert 5v4 advantage?
    const hasAdvantage = (isCT && round.firstAdvantage === 'ct') || (isT && round.firstAdvantage === 't');
    if (hasAdvantage) {
      advantageRounds++;
      if (isWinner) advantageWins++;
    }
  });
  
  const pistolRoundWinRate = pistolRounds > 0 ? pistolWins / pistolRounds : 0;
  const followUpRoundWinRate = followUpRounds > 0 ? followUpWins / followUpRounds : 0;
  const comebackFactor = losingStreakRounds > 0 ? comebackRounds / losingStreakRounds : 0;
  const closingFactor = advantageRounds > 0 ? advantageWins / advantageRounds : 0;
  
  return {
    pistolRoundWinRate,
    followUpRoundWinRate,
    comebackFactor,
    closingFactor
  };
}

/**
 * Calculate map-specific performance for a team
 */
function calculateMapPerformance(rounds: RoundData[], teamName: string): {
  [mapName: string]: {
    ctWinRate: number;
    tWinRate: number;
    bombsitesPreference: {
      a: number;
      b: number;
    }
  }
} {
  const mapStats: {
    [mapName: string]: {
      ctRounds: number;
      ctWins: number;
      tRounds: number;
      tWins: number;
      aSiteAttacks: number;
      bSiteAttacks: number;
    }
  } = {};
  
  rounds.forEach(round => {
    const isCT = round.ctTeam === teamName;
    const isT = round.tTeam === teamName;
    const isWinner = round.winnerTeam === teamName;
    const map = round.map;
    
    if (!mapStats[map]) {
      mapStats[map] = {
        ctRounds: 0,
        ctWins: 0,
        tRounds: 0,
        tWins: 0,
        aSiteAttacks: 0,
        bSiteAttacks: 0
      };
    }
    
    if (isCT) {
      mapStats[map].ctRounds++;
      if (isWinner) mapStats[map].ctWins++;
    }
    
    if (isT) {
      mapStats[map].tRounds++;
      if (isWinner) mapStats[map].tWins++;
      
      if (round.bombSite === 'bombsite_a') mapStats[map].aSiteAttacks++;
      if (round.bombSite === 'bombsite_b') mapStats[map].bSiteAttacks++;
    }
  });
  
  // Calculate map performance metrics
  const mapPerformance: {
    [mapName: string]: {
      ctWinRate: number;
      tWinRate: number;
      bombsitesPreference: {
        a: number;
        b: number;
      }
    }
  } = {};
  
  Object.entries(mapStats).forEach(([map, stats]) => {
    const ctWinRate = stats.ctRounds > 0 ? stats.ctWins / stats.ctRounds : 0;
    const tWinRate = stats.tRounds > 0 ? stats.tWins / stats.tRounds : 0;
    
    const totalSiteAttacks = stats.aSiteAttacks + stats.bSiteAttacks;
    const aPreference = totalSiteAttacks > 0 ? stats.aSiteAttacks / totalSiteAttacks : 0.5;
    const bPreference = totalSiteAttacks > 0 ? stats.bSiteAttacks / totalSiteAttacks : 0.5;
    
    mapPerformance[map] = {
      ctWinRate,
      tWinRate,
      bombsitesPreference: {
        a: aPreference,
        b: bPreference
      }
    };
  });
  
  return mapPerformance;
}

/**
 * Calculate all round-based metrics for a team
 */
export function calculateTeamRoundMetrics(rounds: RoundData[], teamName: string): TeamRoundMetrics {
  const economyMetrics = calculateEconomyMetrics(rounds, teamName);
  const strategicMetrics = calculateStrategicMetrics(rounds, teamName);
  const momentumMetrics = calculateMomentumMetrics(rounds, teamName);
  const mapPerformance = calculateMapPerformance(rounds, teamName);
  
  return {
    id: teamName.toLowerCase().replace(/\s+/g, '-'),
    name: teamName,
    ...economyMetrics,
    ...strategicMetrics,
    ...momentumMetrics,
    mapPerformance
  };
}

/**
 * Process all round data and calculate team metrics
 */
export async function processRoundData(): Promise<Map<string, TeamRoundMetrics>> {
  try {
    const rounds = await loadRoundData();
    const teamRoundMetrics = new Map<string, TeamRoundMetrics>();
    
    // Get unique team names
    const teamNames = new Set<string>();
    rounds.forEach(round => {
      teamNames.add(round.ctTeam);
      teamNames.add(round.tTeam);
    });
    
    // Calculate metrics for each team
    teamNames.forEach(teamName => {
      const teamRounds = rounds.filter(round => 
        round.ctTeam === teamName || round.tTeam === teamName
      );
      
      const metrics = calculateTeamRoundMetrics(teamRounds, teamName);
      teamRoundMetrics.set(teamName, metrics);
    });
    
    return teamRoundMetrics;
  } catch (error) {
    console.error('Error processing round data:', error);
    throw error;
  }
}

/**
 * Enhance match predictions with round-based metrics
 */
export function enhanceMatchPrediction(
  team1: TeamWithTIR,
  team2: TeamWithTIR,
  team1RoundMetrics: TeamRoundMetrics,
  team2RoundMetrics: TeamRoundMetrics,
  map: string
): {
  team1WinProbability: number;
  team2WinProbability: number;
  insights: string[];
  mapPickAdvantage: number; // 1 = team1, 2 = team2, 0 = neutral
  keyRoundFactors: {
    name: string;
    team1Value: number;
    team2Value: number; 
    advantage: number; // 1 = team1, 2 = team2, 0 = neutral
  }[];
  mapBreakdown: Record<string, any>;
} {
  // Base win probability from existing TIR calculation
  let team1WinProbability = 0.5 + (team1.tir - team2.tir) * 0.05;
  
  // Adjust with round-based metrics
  const adjustments: {factor: number, reason: string, category: string}[] = [];
  
  // Store key round factors for visualization
  const keyRoundFactors: {
    name: string;
    team1Value: number;
    team2Value: number;
    advantage: number;
  }[] = [];
  
  // 1. Economy management adjustments
  const econDiff = team1RoundMetrics.economicEfficiency - team2RoundMetrics.economicEfficiency;
  const econAdjustment = econDiff * 0.005;
  adjustments.push({
    factor: econAdjustment,
    reason: econAdjustment > 0 
      ? `${team1.name} has ${Math.round(econDiff * 100) / 100} better economy efficiency`
      : `${team2.name} has ${Math.round(-econDiff * 100) / 100} better economy efficiency`,
    category: 'economy'
  });
  
  keyRoundFactors.push({
    name: "Economy Efficiency",
    team1Value: team1RoundMetrics.economicEfficiency * 100,
    team2Value: team2RoundMetrics.economicEfficiency * 100,
    advantage: econDiff > 0 ? 1 : econDiff < 0 ? 2 : 0
  });
  
  // 2. Force buy success adjustment
  const forceBuyDiff = team1RoundMetrics.forceRoundWinRate - team2RoundMetrics.forceRoundWinRate;
  const forceBuyAdjustment = forceBuyDiff * 0.03;
  if (Math.abs(forceBuyDiff) > 0.1) {
    adjustments.push({
      factor: forceBuyAdjustment,
      reason: forceBuyDiff > 0 
        ? `${team1.name} has ${Math.round(forceBuyDiff * 100)}% higher force buy success rate`
        : `${team2.name} has ${Math.round(-forceBuyDiff * 100)}% higher force buy success rate`,
      category: 'economy'
    });
  }
  
  keyRoundFactors.push({
    name: "Force Buy Success",
    team1Value: team1RoundMetrics.forceRoundWinRate * 100,
    team2Value: team2RoundMetrics.forceRoundWinRate * 100,
    advantage: forceBuyDiff > 0.1 ? 1 : forceBuyDiff < -0.1 ? 2 : 0
  });
  
  // 3. Full eco win rate comparison (bonus rounds)
  const ecoDiff = team1RoundMetrics.ecoRoundWinRate - team2RoundMetrics.ecoRoundWinRate;
  const ecoAdjustment = ecoDiff * 0.04; // Eco wins are impactful
  
  if (Math.abs(ecoDiff) > 0.05) { // Even small eco win differences are significant
    adjustments.push({
      factor: ecoAdjustment,
      reason: ecoDiff > 0 
        ? `${team1.name} wins ${Math.round(ecoDiff * 100)}% more eco rounds`
        : `${team2.name} wins ${Math.round(-ecoDiff * 100)}% more eco rounds`,
      category: 'economy'
    });
    
    keyRoundFactors.push({
      name: "Eco Round Success",
      team1Value: team1RoundMetrics.ecoRoundWinRate * 100,
      team2Value: team2RoundMetrics.ecoRoundWinRate * 100,
      advantage: ecoDiff > 0.05 ? 1 : ecoDiff < -0.05 ? 2 : 0
    });
  }
  
  // 4. Map-specific adjustments
  const team1MapStats = team1RoundMetrics.mapPerformance[map];
  const team2MapStats = team2RoundMetrics.mapPerformance[map];
  
  // Determine map pick advantage based on performance
  let mapPickAdvantage = 0; // 0 = neutral, 1 = team1, 2 = team2
  
  if (team1MapStats && team2MapStats) {
    // Calculate overall map win rate for each team
    const team1MapWinRate = (team1MapStats.ctWinRate + team1MapStats.tWinRate) / 2;
    const team2MapWinRate = (team2MapStats.ctWinRate + team2MapStats.tWinRate) / 2;
    
    // Map pick advantage based on win rate difference
    const mapWinRateDiff = team1MapWinRate - team2MapWinRate;
    
    if (mapWinRateDiff > 0.1) {
      mapPickAdvantage = 1; // Team 1 advantage
    } else if (mapWinRateDiff < -0.1) {
      mapPickAdvantage = 2; // Team 2 advantage
    }
    
    // CT win rate difference
    const ctWinRateDiff = team1MapStats.ctWinRate - team2MapStats.ctWinRate;
    const ctAdjustment = ctWinRateDiff * 0.04;
    
    // T win rate difference
    const tWinRateDiff = team1MapStats.tWinRate - team2MapStats.tWinRate;
    const tAdjustment = tWinRateDiff * 0.04;
    
    adjustments.push({
      factor: ctAdjustment,
      reason: ctWinRateDiff > 0 
        ? `${team1.name} has ${Math.round(ctWinRateDiff * 100)}% higher CT win rate on ${map}`
        : `${team2.name} has ${Math.round(-ctWinRateDiff * 100)}% higher CT win rate on ${map}`,
      category: 'map'
    });
    
    adjustments.push({
      factor: tAdjustment,
      reason: tWinRateDiff > 0 
        ? `${team1.name} has ${Math.round(tWinRateDiff * 100)}% higher T win rate on ${map}`
        : `${team2.name} has ${Math.round(-tWinRateDiff * 100)}% higher T win rate on ${map}`,
      category: 'map'
    });
    
    keyRoundFactors.push({
      name: `${map} CT Win Rate`,
      team1Value: team1MapStats.ctWinRate * 100,
      team2Value: team2MapStats.ctWinRate * 100,
      advantage: ctWinRateDiff > 0.05 ? 1 : ctWinRateDiff < -0.05 ? 2 : 0
    });
    
    keyRoundFactors.push({
      name: `${map} T Win Rate`,
      team1Value: team1MapStats.tWinRate * 100,
      team2Value: team2MapStats.tWinRate * 100,
      advantage: tWinRateDiff > 0.05 ? 1 : tWinRateDiff < -0.05 ? 2 : 0
    });
    
    // Site control adjustments
    if (team1MapStats.bombsitesPreference && team2MapStats.bombsitesPreference) {
      // Compare A site preference
      const aSiteDiff = team1MapStats.bombsitesPreference.a - team2MapStats.bombsitesPreference.a;
      
      // T vs CT site preference matching
      // Example: Team1 prefers A site on T, but Team2 is strongest defending A site
      // This would be a Team2 advantage
      if (Math.abs(aSiteDiff) > 0.2) {
        const sitePrefAdjustment = aSiteDiff * 0.03;
        adjustments.push({
          factor: sitePrefAdjustment,
          reason: aSiteDiff > 0 
            ? `${team1.name} shows ${Math.round(aSiteDiff * 100)}% higher A site preference on ${map}`
            : `${team2.name} shows ${Math.round(-aSiteDiff * 100)}% higher A site preference on ${map}`,
          category: 'strategy'
        });
      }
    }
  }
  
  // 5. Pistol round win adjustments
  const pistolDiff = team1RoundMetrics.pistolRoundWinRate - team2RoundMetrics.pistolRoundWinRate;
  const pistolAdjustment = pistolDiff * 0.05; // Increased weight to emphasize pistol rounds in CS2
  if (Math.abs(pistolDiff) > 0.15) {
    adjustments.push({
      factor: pistolAdjustment,
      reason: pistolDiff > 0 
        ? `${team1.name} has ${Math.round(pistolDiff * 100)}% higher pistol round win rate`
        : `${team2.name} has ${Math.round(-pistolDiff * 100)}% higher pistol round win rate`,
      category: 'momentum'
    });
  }
  
  keyRoundFactors.push({
    name: "Pistol Round Win Rate",
    team1Value: team1RoundMetrics.pistolRoundWinRate * 100,
    team2Value: team2RoundMetrics.pistolRoundWinRate * 100,
    advantage: pistolDiff > 0.15 ? 1 : pistolDiff < -0.15 ? 2 : 0
  });
  
  // 6. Comeback factor adjustments
  const comebackDiff = team1RoundMetrics.comebackFactor - team2RoundMetrics.comebackFactor;
  const comebackAdjustment = comebackDiff * 0.025; // Slight increase in weight for comebacks
  if (Math.abs(comebackDiff) > 0.1) {
    adjustments.push({
      factor: comebackAdjustment,
      reason: comebackDiff > 0 
        ? `${team1.name} has ${Math.round(comebackDiff * 100)}% better comeback ability`
        : `${team2.name} has ${Math.round(-comebackDiff * 100)}% better comeback ability`,
      category: 'momentum'
    });
  }
  
  keyRoundFactors.push({
    name: "Comeback Factor",
    team1Value: team1RoundMetrics.comebackFactor * 100,
    team2Value: team2RoundMetrics.comebackFactor * 100,
    advantage: comebackDiff > 0.1 ? 1 : comebackDiff < -0.1 ? 2 : 0
  });
  
  // 7. Closing out advantages adjustments
  const closingDiff = team1RoundMetrics.closingFactor - team2RoundMetrics.closingFactor;
  const closingAdjustment = closingDiff * 0.04;
  if (Math.abs(closingDiff) > 0.1) {
    adjustments.push({
      factor: closingAdjustment,
      reason: closingDiff > 0 
        ? `${team1.name} converts ${Math.round(closingDiff * 100)}% more 5v4 advantages`
        : `${team2.name} converts ${Math.round(-closingDiff * 100)}% more 5v4 advantages`,
      category: 'advantage'
    });
  }
  
  keyRoundFactors.push({
    name: "Man Advantage Conversion",
    team1Value: team1RoundMetrics.closingFactor * 100,
    team2Value: team2RoundMetrics.closingFactor * 100, 
    advantage: closingDiff > 0.1 ? 1 : closingDiff < -0.1 ? 2 : 0
  });
  
  // 8. NEW: Post-plant win rate comparison
  const postPlantDiff = 
    (team1RoundMetrics.postPlantWinRate || 0.5) - 
    (team2RoundMetrics.postPlantWinRate || 0.5);
  
  const postPlantAdjustment = postPlantDiff * 0.03;
  if (Math.abs(postPlantDiff) > 0.1) {
    adjustments.push({
      factor: postPlantAdjustment,
      reason: postPlantDiff > 0 
        ? `${team1.name} wins ${Math.round(postPlantDiff * 100)}% more post-plant situations`
        : `${team2.name} wins ${Math.round(-postPlantDiff * 100)}% more post-plant situations`,
      category: 'strategy'
    });
    
    keyRoundFactors.push({
      name: "Post-Plant Win Rate",
      team1Value: (team1RoundMetrics.postPlantWinRate || 0.5) * 100,
      team2Value: (team2RoundMetrics.postPlantWinRate || 0.5) * 100,
      advantage: postPlantDiff > 0.1 ? 1 : postPlantDiff < -0.1 ? 2 : 0
    });
  }
  
  // 9. NEW: Retake success rate comparison
  const retakeDiff = 
    (team1RoundMetrics.retakeSuccessRate || 0.5) - 
    (team2RoundMetrics.retakeSuccessRate || 0.5);
  
  const retakeAdjustment = retakeDiff * 0.03;
  if (Math.abs(retakeDiff) > 0.1) {
    adjustments.push({
      factor: retakeAdjustment,
      reason: retakeDiff > 0 
        ? `${team1.name} has ${Math.round(retakeDiff * 100)}% higher retake success rate`
        : `${team2.name} has ${Math.round(-retakeDiff * 100)}% higher retake success rate`,
      category: 'strategy'
    });
    
    keyRoundFactors.push({
      name: "Retake Success Rate",
      team1Value: (team1RoundMetrics.retakeSuccessRate || 0.5) * 100,
      team2Value: (team2RoundMetrics.retakeSuccessRate || 0.5) * 100,
      advantage: retakeDiff > 0.1 ? 1 : retakeDiff < -0.1 ? 2 : 0
    });
  }
  
  // Apply all adjustments
  let totalAdjustment = 0;
  adjustments.forEach(adj => {
    totalAdjustment += adj.factor;
  });
  
  // Limit total adjustment to +/- 0.30 (increased maximum effect)
  totalAdjustment = Math.max(-0.30, Math.min(0.30, totalAdjustment));
  
  // Apply final adjustment
  team1WinProbability += totalAdjustment;
  
  // Ensure probabilities are between 0.05 and 0.95
  team1WinProbability = Math.max(0.05, Math.min(0.95, team1WinProbability));
  const team2WinProbability = 1 - team1WinProbability;
  
  // Generate insights from significant adjustments
  const insights = adjustments
    .filter(adj => Math.abs(adj.factor) > 0.015) // Slightly higher threshold
    .sort((a, b) => Math.abs(b.factor) - Math.abs(a.factor))
    .slice(0, 5)
    .map(adj => adj.reason);
  
  // Sort key factors by their impact (advantage difference)
  keyRoundFactors.sort((a, b) => {
    const aAdvDiff = Math.abs(a.team1Value - a.team2Value);
    const bAdvDiff = Math.abs(b.team1Value - b.team2Value);
    return bAdvDiff - aAdvDiff;
  });
  
  // Create map-specific predictions for multi-map series (BO3/BO5)
  const mapBreakdown: Record<string, any> = {};
  
  // Only for the current map in this prediction
  mapBreakdown[map] = {
    mapName: map,
    team1WinChance: team1WinProbability,
    team2WinChance: team2WinProbability,
    advantage: mapPickAdvantage,
    keyFactors: [
      `${mapPickAdvantage === 1 ? team1.name : mapPickAdvantage === 2 ? team2.name : 'Neither team'} has a historical advantage on ${map}`,
      `${team1RoundMetrics.pistolRoundWinRate > team2RoundMetrics.pistolRoundWinRate ? team1.name : team2.name} has better pistol round performance`,
      `${team1RoundMetrics.economicEfficiency > team2RoundMetrics.economicEfficiency ? team1.name : team2.name} has better economy management`
    ]
  };

  return {
    team1WinProbability,
    team2WinProbability,
    insights,
    mapPickAdvantage,
    keyRoundFactors: keyRoundFactors.slice(0, 8), // Return top 8 factors
    mapBreakdown
  };
}