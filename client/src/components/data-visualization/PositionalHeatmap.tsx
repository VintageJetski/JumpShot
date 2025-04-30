import { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { PlayerWithPIV, PlayerRole } from '@shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SiCounterstrike } from 'react-icons/si';

interface PositionalHeatmapProps {
  players: PlayerWithPIV[];
}

// Available maps for CS2
const availableMaps = [
  { id: 'de_inferno', name: 'Inferno' },
  { id: 'de_mirage', name: 'Mirage' },
  { id: 'de_nuke', name: 'Nuke' },
  { id: 'de_overpass', name: 'Overpass' },
  { id: 'de_ancient', name: 'Ancient' },
  { id: 'de_anubis', name: 'Anubis' },
  { id: 'de_vertigo', name: 'Vertigo' }
];

// Define positions on maps
interface Position {
  id: string;
  name: string;
  side: 'T' | 'CT';
  description: string;
}

// Define positions for Inferno map
const infernoPositions: Position[] = [
  { id: 'inf-a-site', name: 'A Site', side: 'CT', description: 'A bombsite area' },
  { id: 'inf-a-pit', name: 'Pit', side: 'T', description: 'Deep area near A site' },
  { id: 'inf-a-apartments', name: 'Apartments', side: 'T', description: 'Apartments leading to A site' },
  { id: 'inf-mid', name: 'Mid', side: 'T', description: 'Middle area of the map' },
  { id: 'inf-banana', name: 'Banana', side: 'T', description: 'Pathway leading to B site' },
  { id: 'inf-b-site', name: 'B Site', side: 'CT', description: 'B bombsite area' },
  { id: 'inf-ct-spawn', name: 'CT Spawn', side: 'CT', description: 'Counter-Terrorist starting area' },
  { id: 'inf-t-spawn', name: 'T Spawn', side: 'T', description: 'Terrorist starting area' }
];

// Role-based position preferences
const rolePositionPreferences: Record<PlayerRole, string[]> = {
  [PlayerRole.IGL]: ['inf-mid', 'inf-b-site'],
  [PlayerRole.AWP]: ['inf-mid', 'inf-banana', 'inf-a-pit'],
  [PlayerRole.Lurker]: ['inf-a-apartments', 'inf-t-spawn'],
  [PlayerRole.Spacetaker]: ['inf-banana', 'inf-a-apartments'],
  [PlayerRole.Support]: ['inf-mid', 'inf-banana'],
  [PlayerRole.Anchor]: ['inf-b-site', 'inf-a-site'],
  [PlayerRole.Rotator]: ['inf-mid', 'inf-ct-spawn']
};

// Heatmap options
type HeatmapMetric = 'kills' | 'deaths' | 'utility' | 'preference';
type HeatmapSide = 'T' | 'CT' | 'Both';

export default function PositionalHeatmap({ players }: PositionalHeatmapProps) {
  const [selectedMap, setSelectedMap] = useState('de_inferno');
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('preference');
  const [mapSide, setMapSide] = useState<HeatmapSide>('Both');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(players.length > 0 ? players[0].id : null);

  // Function to calculate position score based on player role
  const getPositionScoreForRole = (position: Position, role: PlayerRole): number => {
    const preferredPositions = rolePositionPreferences[role] || [];
    if (preferredPositions.includes(position.id)) {
      return preferredPositions.indexOf(position.id) === 0 ? 1.0 : 0.7;
    }
    
    // Check if the position side matches role tendency
    if ((role === PlayerRole.Anchor || role === PlayerRole.Rotator) && position.side === 'CT') {
      return 0.5;
    }
    
    if ((role === PlayerRole.Lurker || role === PlayerRole.Spacetaker) && position.side === 'T') {
      return 0.5;
    }
    
    return 0.2;
  };

  // Generate heatmap data
  const generateHeatmapData = () => {
    // Get selected player
    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return [];
    
    // Get positions for the selected map
    const positions = selectedMap === 'de_inferno' ? infernoPositions : [];
    
    // Calculate heatmap values based on selection
    return positions
      .filter(pos => mapSide === 'Both' || pos.side === mapSide)
      .map(position => {
        let score = 0;
        
        if (heatmapMetric === 'preference') {
          // Role-based position preferences
          score = getPositionScoreForRole(position, player.role);
          
          // Adjust for T/CT specific roles
          if (position.side === 'T' && player.tRole) {
            score = Math.max(score, getPositionScoreForRole(position, player.tRole));
          } else if (position.side === 'CT' && player.ctRole) {
            score = Math.max(score, getPositionScoreForRole(position, player.ctRole));
          }
        } else {
          // For actual stats, we'd use real data - this is a placeholder
          // In a real implementation, you'd pull data from match history
          score = Math.random(); // Placeholder for demo purposes
        }
        
        return {
          ...position,
          score,
          intensity: Math.floor(score * 5) // 0-4 intensity levels for visualization
        };
      });
  };

  // Get currently active map positions
  const currentMapPositions = selectedMap === 'de_inferno' ? infernoPositions : [];
  
  // Heatmap data
  const heatmapData = generateHeatmapData();
  
  // Get the current player
  const currentPlayer = players.find(p => p.id === selectedPlayer);

  // Render a position indicator on the heatmap
  const renderPositionIndicator = (positionId: string) => {
    const position = heatmapData.find(p => p.id === positionId);
    if (!position) return null;
    
    const intensityClass = [
      'bg-blue-500/20',
      'bg-blue-500/40',
      'bg-blue-500/60',
      'bg-blue-500/80',
      'bg-blue-500'
    ][position.intensity] || 'bg-blue-500/20';
    
    return (
      <div 
        className={`absolute rounded-full w-8 h-8 ${intensityClass} flex items-center justify-center text-xs font-medium text-white border-2 border-white/50 shadow-md transition-all hover:scale-110`}
        style={{
          // Positioning would be more accurate on a real implementation
          top: `${20 + Math.random() * 60}%`,
          left: `${20 + Math.random() * 60}%`,
        }}
        title={position.name}
      >
        {position.name.substring(0, 1)}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Map</label>
          <Select 
            value={selectedMap}
            onValueChange={setSelectedMap}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select map" />
            </SelectTrigger>
            <SelectContent>
              {availableMaps.map((map) => (
                <SelectItem key={map.id} value={map.id}>
                  {map.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Player</label>
          <Select 
            value={selectedPlayer || ''}
            onValueChange={setSelectedPlayer}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name} ({player.team})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Metric</label>
          <Tabs 
            value={heatmapMetric}
            onValueChange={(value) => setHeatmapMetric(value as HeatmapMetric)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="preference" className="text-xs">Preference</TabsTrigger>
              <TabsTrigger value="kills" className="text-xs">Kills</TabsTrigger>
              <TabsTrigger value="deaths" className="text-xs">Deaths</TabsTrigger>
              <TabsTrigger value="utility" className="text-xs">Utility</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Alert variant="default" className="bg-muted">
            <AlertDescription className="flex gap-2 items-center">
              <SiCounterstrike className="h-4 w-4" />
              <span>
                {heatmapMetric === 'preference'
                  ? 'Showing position preferences based on player role'
                  : `Showing ${heatmapMetric} data for ${currentPlayer?.name || 'selected player'}`}
              </span>
            </AlertDescription>
          </Alert>
          
          <div className="bg-card rounded-md border p-4 mt-4">
            <div className="relative w-full aspect-square bg-muted rounded-md overflow-hidden">
              {selectedMap === 'de_inferno' ? (
                <div className="absolute inset-0 opacity-40 bg-cover bg-center"
                     style={{ backgroundImage: `url('@assets/de_inferno.gif')` }}></div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  Map image not available
                </div>
              )}
              
              {/* Position Indicators */}
              <div className="absolute inset-0">
                {currentMapPositions.map(pos => (
                  renderPositionIndicator(pos.id)
                ))}
              </div>
              
              {/* Map Side Toggle */}
              <div className="absolute top-2 right-2">
                <Tabs 
                  value={mapSide}
                  onValueChange={(value) => setMapSide(value as HeatmapSide)}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="T" className="text-xs">T Side</TabsTrigger>
                    <TabsTrigger value="CT" className="text-xs">CT Side</TabsTrigger>
                    <TabsTrigger value="Both" className="text-xs">Both</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Map Controls */}
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    // Regenerate data with random seeds
                    setHeatmapMetric(prev => prev);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Position Analysis</h3>
              {currentPlayer ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">{currentPlayer.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentPlayer.team} - {currentPlayer.role}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Role Distribution</h4>
                    <div className="flex gap-2">
                      <div className="bg-muted rounded p-2 text-xs flex-1 text-center">
                        <p>T Side</p>
                        <p className="font-medium">{currentPlayer.tRole}</p>
                      </div>
                      <div className="bg-muted rounded p-2 text-xs flex-1 text-center">
                        <p>CT Side</p>
                        <p className="font-medium">{currentPlayer.ctRole}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Preferred Positions</h4>
                    <div className="space-y-2">
                      {heatmapData
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5)
                        .map((position, idx) => (
                          <div 
                            key={position.id} 
                            className="flex justify-between items-center p-2 rounded bg-muted"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{position.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({position.side} Side)
                              </span>
                            </div>
                            <div className="flex items-center">
                              <div className="h-2 bg-primary rounded-full" 
                                   style={{ width: `${position.score * 50}px` }}></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {heatmapMetric === 'preference' && (
                    <div className="text-xs text-muted-foreground">
                      <p>Position preferences are calculated based on player role and side preferences.</p>
                      <p className="mt-1">
                        {currentPlayer.role === PlayerRole.AWP && "AWPers typically prefer long sightlines and defensive positions."}
                        {currentPlayer.role === PlayerRole.IGL && "IGLs often position for map control and information gathering."}
                        {currentPlayer.role === PlayerRole.Lurker && "Lurkers favor flanking routes and positions to catch opponents off-guard."}
                        {currentPlayer.role === PlayerRole.Support && "Support players typically position to assist teammates with utility."}
                        {currentPlayer.role === PlayerRole.Spacetaker && "Entry fraggers position for aggressive pushes into contested areas."}
                        {currentPlayer.role === PlayerRole.Anchor && "Anchors hold defensive positions to secure bombsites."}
                        {currentPlayer.role === PlayerRole.Rotator && "Rotators position between sites for quick response to enemy movements."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Select a player to view position analysis</p>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Intensity Legend</h3>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-500/20 border border-white/30"></div>
              <div className="h-4 w-4 rounded-full bg-blue-500/40 border border-white/30"></div>
              <div className="h-4 w-4 rounded-full bg-blue-500/60 border border-white/30"></div>
              <div className="h-4 w-4 rounded-full bg-blue-500/80 border border-white/30"></div>
              <div className="h-4 w-4 rounded-full bg-blue-500 border border-white/30"></div>
              <span className="text-xs text-muted-foreground">Low to High</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-muted-foreground text-xs px-4">
        <p>
          Note: This is a conceptual visualization based on role preferences. 
          In a production environment, this would use actual positional data from matches.
        </p>
      </div>
    </div>
  );
}