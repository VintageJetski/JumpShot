import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map } from 'lucide-react';

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
}

const MapPickAdvantage: React.FC<MapPickAdvantageProps> = ({
  mapName,
  team1Name = 'Team 1',
  team2Name = 'Team 2',
  keyFactors = [],
  mapPickAdvantage = 0
}) => {
  // Filter for map-specific factors
  const mapFactors = keyFactors.filter(factor => 
    factor.name.includes(mapName) || 
    factor.name.includes('Site') || 
    factor.name.includes('Post-Plant') ||
    factor.name.includes('Retake')
  );
  
  // Get most relevant factor for this map
  const primaryFactor = mapFactors[0] || { 
    name: `${mapName} Performance`, 
    team1Value: 50, 
    team2Value: 50,
    advantage: 0
  };
  
  // Get team with map advantage
  const advantageTeam = mapPickAdvantage === 1 ? team1Name : 
                        mapPickAdvantage === 2 ? team2Name : null;
  
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Map className="h-5 w-5 mr-2 text-blue-400" />
            <span className="font-medium">{mapName}</span>
          </div>
          
          {advantageTeam && (
            <Badge className={mapPickAdvantage === 1 ? 'bg-blue-500' : 'bg-red-500'}>
              {advantageTeam}'s Pick
            </Badge>
          )}
        </div>
        
        <div className="space-y-3">
          {mapFactors.slice(0, 3).map((factor, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-400">{factor.name}</span>
                <div className="flex items-center space-x-2 text-xs">
                  <span className={factor.advantage === 1 ? 'text-blue-400 font-medium' : ''}>
                    {Math.round(factor.team1Value)}%
                  </span>
                  <span className="text-gray-500">vs</span>
                  <span className={factor.advantage === 2 ? 'text-red-400 font-medium' : ''}>
                    {Math.round(factor.team2Value)}%
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-blue-500 h-2" 
                  style={{ width: `${(factor.team1Value / (factor.team1Value + factor.team2Value)) * 100}%` }}
                />
                <div 
                  className="bg-red-500 h-2" 
                  style={{ width: `${(factor.team2Value / (factor.team1Value + factor.team2Value)) * 100}%` }}
                />
              </div>
            </div>
          ))}
          
          {mapFactors.length === 0 && (
            <div className="text-center py-4 text-gray-400">
              No specific map data available
            </div>
          )}
        </div>
        
        {advantageTeam && (
          <div className="mt-3 text-xs text-gray-400">
            {mapPickAdvantage === 1 ? team1Name : team2Name} has a statistical advantage on {mapName}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapPickAdvantage;