import { apiRequest } from '@/lib/queryClient';

// Types
export interface WeightMetadata {
  date: string;
  version: string;
  samples: number;
}

export interface Weights {
  [key: string]: number;
}

export interface WeightsResponse {
  weights: Weights;
  metadata: WeightMetadata;
  error?: string;
}

/**
 * Fetch the current learned weights from the API
 */
export const fetchWeights = async (): Promise<WeightsResponse> => {
  try {
    const response = await apiRequest<WeightsResponse>('/api/weights');
    return response;
  } catch (error) {
    console.error('Error fetching weights:', error);
    return {
      weights: {},
      metadata: {
        date: new Date().toISOString().split('T')[0],
        version: 'error',
        samples: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
