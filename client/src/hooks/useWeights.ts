import { useQuery } from '@tanstack/react-query';
import { fetchWeights, WeightsResponse } from '@/services/weightsService';

/**
 * Hook to fetch and use the learned weights for PIV calculations
 */
export function useWeights() {
  const { data, error, isLoading } = useQuery<WeightsResponse>({
    queryKey: ['weights'],
    queryFn: fetchWeights,
    // Refetch weights only occasionally as they don't change often
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  return {
    weights: data?.weights || {},
    metadata: data?.metadata,
    error,
    isLoading,
  };
}
