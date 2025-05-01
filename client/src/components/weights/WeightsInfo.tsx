import { useWeights } from '@/hooks/useWeights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon, RefreshCwIcon } from 'lucide-react';

export function WeightsInfo() {
  const { data, isLoading, error } = useWeights();

  if (isLoading) {
    return (
      <Card className="bg-background-light rounded-lg border border-gray-700">
        <CardHeader>
          <CardTitle>Model Weights <Skeleton className="h-4 w-20 inline-block ml-2" /></CardTitle>
          <CardDescription>Loading weights information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-background-light rounded-lg border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5 text-red-500" />
            Error Loading Weights
          </CardTitle>
          <CardDescription>Unable to load the current weights information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format the weights for display
  const formattedWeights = Object.entries(data.weights)
    .sort(([, a], [, b]) => b - a) // Sort by weight value (descending)
    .slice(0, 10); // Show only top 10 weights

  return (
    <Card className="bg-background-light rounded-lg border border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Learned Weights</CardTitle>
          <Badge variant="outline" className="ml-2">
            v{data.metadata.version}
          </Badge>
        </div>
        <CardDescription className="flex items-center justify-between">
          <span>Machine learning model weights for PIV calculation</span>
          <span className="text-xs text-gray-400">Updated: {data.metadata.date}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Model Samples</span>
            <span className="text-xs text-gray-400">{data.metadata.samples.toLocaleString()}</span>
          </div>
          <Progress
            value={Math.min(100, (data.metadata.samples / 1000) * 100)}
            className="h-1"
          />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold border-b border-gray-700 pb-1">Top Influencing Factors</h4>
          {formattedWeights.map(([key, weight]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">{key}</span>
                <span className="text-xs text-gray-400">{(weight * 100).toFixed(2)}%</span>
              </div>
              <Progress
                value={weight * 100}
                className="h-1"
              />
            </div>
          ))}
        </div>

        {data.metadata.samples < 100 && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-md">
            <div className="flex items-start gap-2">
              <InfoIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-500">Limited Training Data</p>
                <p className="text-xs text-gray-400 mt-1">
                  The current model is based on a small sample size. Predictions may improve as more match data is collected.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
