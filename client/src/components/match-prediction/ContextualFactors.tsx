import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain } from 'lucide-react';
import KeyFactorsList from './KeyFactorsList';

interface ContextualFactorsProps {
  insights: string[];
  keyFactors?: {
    name: string;
    team1Value: number;
    team2Value: number;
    advantage: number; // 1 = team1, 2 = team2, 0 = neutral
  }[];
  team1Name?: string;
  team2Name?: string;
  className?: string;
}

export const ContextualFactors: React.FC<ContextualFactorsProps> = ({
  insights,
  keyFactors = [],
  team1Name,
  team2Name,
  className
}) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center">
          <Brain className="mr-2 h-5 w-5" />
          Key Strategic Factors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Match Insights:</h4>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <Badge className="mt-0.5 mr-2">{index + 1}</Badge>
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {keyFactors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Performance Metrics:</h4>
              <KeyFactorsList 
                factors={keyFactors} 
                team1Name={team1Name}
                team2Name={team2Name}
              />
            </div>
          )}
          
          {insights.length === 0 && keyFactors.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Select two teams and a map to see strategic factors
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-1 text-xs text-muted-foreground">
        <p>Based on round-by-round analysis from previous matches</p>
      </CardFooter>
    </Card>
  );
};

export default ContextualFactors;