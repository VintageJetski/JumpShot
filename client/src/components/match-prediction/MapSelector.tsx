import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Triangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MapSelectorProps {
  maps: string[];
  selectedMap: string;
  onSelectMap: (map: string) => void;
  team1Name?: string;
  team2Name?: string;
  team1Performance?: Record<string, number>;
  team2Performance?: Record<string, number>;
  mapAdvantages?: Record<string, number>;
}

const MAP_ICONS: Record<string, string> = {
  'Inferno': '🔥',
  'Mirage': '🏜️',
  'Nuke': '☢️',
  'Ancient': '🏺',
  'Anubis': '🏺',
  'Vertigo': '🏙️',
  'Overpass': '🌉',
  'Dust2': '🏜️',
};

const MapSelector: React.FC<MapSelectorProps> = ({
  maps,
  selectedMap,
  onSelectMap,
  team1Name,
  team2Name,
  team1Performance,
  team2Performance,
  mapAdvantages
}) => {
  // Function to determine badge color based on map advantage
  const getAdvantageColor = (map: string): string => {
    if (!mapAdvantages) return 'bg-gray-600';
    
    const advantage = mapAdvantages[map];
    if (advantage === 1) return 'bg-blue-500';
    if (advantage === 2) return 'bg-red-500';
    return 'bg-gray-600';
  };
  
  // Function to display win rate difference
  const getWinRateDifference = (map: string): string => {
    if (!team1Performance || !team2Performance) return '';
    
    const team1Rate = Math.round((team1Performance[map] || 0.5) * 100);
    const team2Rate = Math.round((team2Performance[map] || 0.5) * 100);
    const diff = team1Rate - team2Rate;
    
    if (diff > 0) return `+${diff}%`;
    if (diff < 0) return `${diff}%`;
    return 'Even';
  };
  
  // Function to get the pick label
  const getPickLabel = (map: string): string => {
    if (!mapAdvantages) return '';
    
    const advantage = mapAdvantages[map];
    if (advantage === 1 && team1Name) return `${team1Name}'s pick`;
    if (advantage === 2 && team2Name) return `${team2Name}'s pick`;
    return 'Neutral';
  };

  return (
    <div className="mt-2">
      <div className="flex items-center mb-2">
        <Map className="h-4 w-4 mr-2 text-blue-400" />
        <span className="text-sm font-medium">Map Selection</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {maps.map(map => (
          <TooltipProvider key={map}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card 
                  className={`cursor-pointer transition-all hover:bg-gray-700 ${selectedMap === map ? 'border-blue-500 bg-gray-700' : 'border-gray-700 bg-gray-800'}`}
                  onClick={() => onSelectMap(map)}
                >
                  <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl mb-1">{MAP_ICONS[map] || '🗺️'}</div>
                    <span className="text-sm font-medium">{map}</span>
                    
                    {team1Performance && team2Performance && (
                      <div className="mt-2 flex justify-center">
                        <Badge 
                          className={getAdvantageColor(map)}
                          variant="outline"
                        >
                          {getWinRateDifference(map)}
                        </Badge>
                      </div>
                    )}
                    
                    {selectedMap === map && (
                      <div className="absolute -top-2 -right-2">
                        <Triangle className="h-4 w-4 text-blue-500 fill-blue-500" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top">
                {team1Name && team2Name && team1Performance && team2Performance ? (
                  <div className="text-sm">
                    <div className="flex justify-between gap-4">
                      <span>{team1Name}: {Math.round((team1Performance[map] || 0.5) * 100)}% win rate</span>
                      <span>{team2Name}: {Math.round((team2Performance[map] || 0.5) * 100)}% win rate</span>
                    </div>
                    <div className="mt-1 text-xs text-center text-gray-400">{getPickLabel(map)}</div>
                  </div>
                ) : (
                  <span>Select {map}</span>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default MapSelector;