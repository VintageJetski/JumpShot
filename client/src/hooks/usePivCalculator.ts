import { useWeights } from './useWeights';
import { PlayerRole } from '@shared/schema';

/**
 * Hook to calculate PIV using the latest learned weights
 */
export function usePivCalculator() {
  const { data: weightsData, isLoading, error } = useWeights();

  /**
   * Calculate PIV for a player based on their stats and role using the machine-learned weights
   * @param playerStats The player's statistics
   * @param role The player's role
   * @returns Calculated PIV value
   */
  const calculatePiv = (playerStats: Record<string, number>, role: PlayerRole): number => {
    if (isLoading || error || !weightsData) {
      // Fallback to basic calculation if weights aren't available
      return basicPivCalculation(playerStats, role);
    }

    let piv = 0;
    const weights = weightsData.weights;

    // Apply weights to each stat
    for (const [stat, value] of Object.entries(playerStats)) {
      if (stat in weights) {
        piv += value * (weights[stat as keyof typeof weights] as number);
      }
    }

    // Apply role-specific multiplier if available
    const roleKey = `role_${role}`;
    if (roleKey in weights) {
      piv *= weights[roleKey as keyof typeof weights] as number;
    }

    return Math.max(0, Math.min(10, piv)); // Clamp between 0-10
  };

  /**
   * Basic fallback calculation when weights aren't available
   */
  const basicPivCalculation = (playerStats: Record<string, number>, role: PlayerRole): number => {
    // Basic calculation based on common metrics
    const kd = playerStats.kills / Math.max(1, playerStats.deaths) || 0;
    const adr = playerStats.adr || 0;
    const kast = playerStats.kast || 0;
    const impact = playerStats.impact || 0;

    let piv = 0;

    // Base contribution
    piv += kd * 2.5;
    piv += (adr / 100) * 3.5;
    piv += (kast / 100) * 2.5;
    piv += (impact / 2) * 1.5;

    // Role adjustments
    switch (role) {
      case PlayerRole.AWP:
        piv *= 1.1; // AWPers tend to have higher impact
        break;
      case PlayerRole.IGL:
        piv *= 1.15; // IGLs get a bonus for leadership
        break;
      case PlayerRole.Support:
        piv *= 1.05; // Support players get slight bonus
        break;
      default:
        break;
    }

    return Math.max(0, Math.min(10, piv / 2)); // Scale to 0-10 range
  };

  return {
    calculatePiv,
    isLoading,
    error,
  };
}
