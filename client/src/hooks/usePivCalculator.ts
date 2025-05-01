import { useWeights } from './useWeights';

// Default weights used when learned weights are not available
const DEFAULT_WEIGHTS = {
  kd: 0.25,
  adr: 0.2,
  flash_assists: 0.15,
  utility_dmg: 0.1,
  trade_success: 0.15,
  entry_success: 0.15,
};

/**
 * Hook to calculate PIV using the latest learned weights
 */
export function usePivCalculator() {
  const { weights, isLoading } = useWeights();
  
  // Function to calculate PIV for a player
  const calculatePiv = (playerStats: Record<string, number>): number => {
    const weightsToUse = isLoading || Object.keys(weights).length === 0 
      ? DEFAULT_WEIGHTS 
      : weights;
      
    let pivScore = 0;
    let totalWeight = 0;
    
    // Apply each weight to the corresponding stat
    for (const [metric, weight] of Object.entries(weightsToUse)) {
      // Only use the weight if player has this stat
      if (metric in playerStats) {
        pivScore += playerStats[metric] * weight;
        totalWeight += weight;
      }
    }
    
    // Normalize by total weight used
    return totalWeight > 0 ? pivScore / totalWeight : 0;
  };
  
  // Return the calculation function and weights being used
  return {
    calculatePiv,
    weights: isLoading ? DEFAULT_WEIGHTS : weights,
    isUsingLearned: !isLoading && Object.keys(weights).length > 0,
  };
}
