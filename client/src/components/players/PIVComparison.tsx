import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PIVComparisonProps {
  player: {
    name: string;
    piv: number;
    PIV_v14?: number;
    role?: string;
  };
}

/**
 * Component to compare PIV v1.3 and PIV v1.4 values
 */
export function PIVComparison({ player }: PIVComparisonProps) {
  // If PIV v1.4 is not available, just show v1.3
  if (!player.PIV_v14) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Player Impact Value</CardTitle>
          <CardDescription>PIV v1.3</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">PIV v1.3</span>
            <span className="font-bold text-lg">{player.piv.toFixed(2)}</span>
          </div>
          <Progress
            value={Math.min(player.piv / 3 * 100, 100)}
            className="h-3"
          />
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-0">
          PIV is a single value representing player's overall impact
        </CardFooter>
      </Card>
    );
  }

  // Both PIV v1.3 and v1.4 are available, show comparison
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Player Impact Value Comparison</CardTitle>
        <CardDescription>
          {player.role ? `${player.role} Role PIV Values` : 'PIV v1.3 vs v1.4'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* PIV v1.3 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">PIV v1.3</span>
              <span className="font-bold text-lg">{player.piv.toFixed(2)}</span>
            </div>
            <Progress
              value={Math.min(player.piv / 3 * 100, 100)}
              className="h-2.5"
            />
          </div>
          
          {/* PIV v1.4 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">PIV v1.4</span>
              <span className="font-bold text-lg">{player.PIV_v14.toFixed(2)}</span>
            </div>
            <Progress
              value={Math.min(player.PIV_v14 / 3 * 100, 100)}
              className="h-2.5"
            />
          </div>
          
          {/* Difference */}
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="font-medium">Difference</span>
              <span className={`font-bold ${player.PIV_v14 >= player.piv ? 'text-green-500' : 'text-red-500'}`}>
                {player.PIV_v14 >= player.piv ? '+' : ''}
                {(player.PIV_v14 - player.piv).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground pt-0">
        <p>
          <span className="font-semibold">v1.4 changes:</span> Additive contributions, tanh-capped multipliers, dynamic role weighting
        </p>
      </CardFooter>
    </Card>
  );
}
