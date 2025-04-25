import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  ArrowBigRightDash, 
  ArrowBigLeftDash,
  Scale 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import KeyFactorsList from './KeyFactorsList';

interface MapPickAdvantageProps {
  mapName: string;
  team1Name?: string;
  team2Name?: string;
  keyFactors?: {
    name: string;
    team1Value: number;
    team2Value: number;
    advantage: number; // 1 = team1, 2 = team2, 0 = neutral
  }[];
  mapPickAdvantage?: number; // 1 = team1, 2 = team2, 0 = neutral
  className?: string;
}

export const MapPickAdvantage: React.FC<MapPickAdvantageProps> = ({
  mapName,
  team1Name,
  team2Name,
  keyFactors = [],
  mapPickAdvantage = 0,
  className
}) => {
  // Filter out non-map-specific factors
  const mapFactors = keyFactors.filter(
    factor => factor.name.toLowerCase().includes(mapName.toLowerCase())
  );
  
  const getAdvantageText = () => {
    if (mapPickAdvantage === 1 && team1Name) {
      return `${team1Name} has the advantage on ${mapName}`;
    } else if (mapPickAdvantage === 2 && team2Name) {
      return `${team2Name} has the advantage on ${mapName}`;
    } else {
      return `No clear advantage on ${mapName}`;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex items-center">
          <Scale className="mr-2 h-5 w-5" />
          Map Pick Advantage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center py-2">
            {mapPickAdvantage === 1 ? (
              <div className="flex items-center text-blue-500">
                <ArrowBigLeftDash className="h-6 w-6 animate-pulse" />
                <span className="font-medium mx-2">Advantage</span>
              </div>
            ) : mapPickAdvantage === 2 ? (
              <div className="flex items-center justify-end text-yellow-500">
                <span className="font-medium mx-2">Advantage</span>
                <ArrowBigRightDash className="h-6 w-6 animate-pulse" />
              </div>
            ) : (
              <div className="text-gray-500 font-medium">Balanced</div>
            )}
          </div>
          
          <div className="py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-md">
            <p className="text-sm font-medium text-center">{getAdvantageText()}</p>
          </div>
          
          {mapFactors.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Map-Specific Factors:</h4>
                <KeyFactorsList 
                  factors={mapFactors}
                  team1Name={team1Name}
                  team2Name={team2Name}
                  excludeMapFactors={false}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-1 text-xs text-muted-foreground">
        <p>Based on {mapFactors.length} map-specific performance factors</p>
      </CardFooter>
    </Card>
  );
};

export default MapPickAdvantage;