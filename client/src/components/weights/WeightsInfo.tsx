import React from 'react';
import { useWeights } from '@/hooks/useWeights';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function WeightsInfo() {
  const { weights, metadata, isLoading, error } = useWeights();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-4/5" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle>Weights Unavailable</CardTitle>
          <CardDescription>
            Error loading learned weights: {error.toString()}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get top 5 weights by value
  const topWeights = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Model Weights</CardTitle>
          <Badge variant="outline">
            v{metadata?.version || 'unknown'}
          </Badge>
        </div>
        <CardDescription>
          Learned weights from {metadata?.samples || 0} samples
          {metadata?.date && ` (${metadata.date})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm font-medium">Top factors:</div>
          <ul className="space-y-1">
            {topWeights.map(([feature, weight]) => (
              <li key={feature} className="text-sm flex justify-between">
                <span>{feature}</span>
                <span className="font-medium text-primary">
                  {(weight * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
