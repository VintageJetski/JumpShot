import { useQuery } from '@tanstack/react-query';
import { fetchWeights, type WeightsResponse } from '@/services/weightsService';

/**
 * Custom hook to fetch and use the learned weights for PIV calculations
 * @returns Query result containing weights data
 */
export function useWeights() {
  return useQuery<WeightsResponse>({
    queryKey: ['/api/weights'],
    queryFn: fetchWeights,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
