import { RoundData } from './types';

/**
 * Calculate Eco/Force Round Conversion Rate for a team
 */
export function calculateEcoForceConversion(rounds: RoundData[], teamName: string): number {
  const teamRounds = rounds.filter(round => 
    round.ctTeamClanName === teamName || round.tTeamClanName === teamName
  );
  
  let ecoForceRounds = 0;
  let ecoForceWins = 0;
  
  teamRounds.forEach(round => {
    const isCtTeam = round.ctTeamClanName === teamName;
    const buyType = isCtTeam ? round.ctBuyType : round.tBuyType;
    
    // Eco = Full Eco, Force = Semi-Buy/Semi-Eco
    if (buyType === 'Full Eco' || buyType === 'Semi-Buy' || buyType === 'Semi-Eco') {
      ecoForceRounds++;
      if (round.winnerClanName === teamName) {
        ecoForceWins++;
      }
    }
  });
  
  return ecoForceRounds > 0 ? ecoForceWins / ecoForceRounds : 0;
}

/**
 * Calculate 5v4 Advantage Conversion Rate for a team
 */
export function calculate5v4Conversion(rounds: RoundData[], teamName: string): number {
  const teamRounds = rounds.filter(round => 
    round.ctTeamClanName === teamName || round.tTeamClanName === teamName
  );
  
  let advantageRounds = 0;
  let advantageWins = 0;
  
  teamRounds.forEach(round => {
    const isCtTeam = round.ctTeamClanName === teamName;
    const hasAdvantage = (isCtTeam && round.advantage5v4 === 'ct') || 
                        (!isCtTeam && round.advantage5v4 === 't');
    
    if (hasAdvantage) {
      advantageRounds++;
      if (round.winnerClanName === teamName) {
        advantageWins++;
      }
    }
  });
  
  return advantageRounds > 0 ? advantageWins / advantageRounds : 0;
}

/**
 * Calculate Rifle Round Win Rate for a team
 */
export function calculateRifleRoundWinRate(rounds: RoundData[], teamName: string): number {
  const teamRounds = rounds.filter(round => 
    round.ctTeamClanName === teamName || round.tTeamClanName === teamName
  );
  
  let rifleRounds = 0;
  let rifleWins = 0;
  
  teamRounds.forEach(round => {
    const isCtTeam = round.ctTeamClanName === teamName;
    const buyType = isCtTeam ? round.ctBuyType : round.tBuyType;
    
    if (buyType === 'Full Buy') {
      rifleRounds++;
      if (round.winnerClanName === teamName) {
        rifleWins++;
      }
    }
  });
  
  return rifleRounds > 0 ? rifleWins / rifleRounds : 0;
}

/**
 * Calculate Economic Efficiency (wins per equipment value spent)
 */
export function calculateEconomicEfficiency(rounds: RoundData[], teamName: string): number {
  const teamRounds = rounds.filter(round => 
    round.ctTeamClanName === teamName || round.tTeamClanName === teamName
  );
  
  let totalEquipValue = 0;
  let totalWins = 0;
  
  teamRounds.forEach(round => {
    const isCtTeam = round.ctTeamClanName === teamName;
    const equipValue = isCtTeam ? round.ctTeamCurrentEquipValue : round.tTeamCurrentEquipValue;
    
    totalEquipValue += equipValue;
    if (round.winnerClanName === teamName) {
      totalWins++;
    }
  });
  
  return totalEquipValue > 0 ? totalWins / (totalEquipValue / 1000) : 0; // Normalized per 1000 units
}