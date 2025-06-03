import { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlayerWithPIV, PlayerRole } from '../../../shared/types';

interface PositionalHeatmapProps {
  players: PlayerWithPIV[];
}

// Map positions/roles to general areas of the map
const ROLE_POSITIONS = {
  [PlayerRole.IGL]: {
    name: 'In-Game Leader',
    description: 'Strategic mid-map presence with focus on team coordination',
    tSidePositions: ['Mid Control', 'Default Setup', 'Coordinated Executes'],
    ctSidePositions: ['Rotator', 'Site Overseer', 'Info Gathering']
  },
  [PlayerRole.AWP]: {
    name: 'AWP',
    description: 'Holds long angles and creates initial picks for the team',
    tSidePositions: ['Long Angles', 'Entry Picks', 'Trade Support'],
    ctSidePositions: ['Long Angles', 'Site Anchor', 'Defensive AWPing']
  },
  [PlayerRole.Spacetaker]: {
    name: 'Spacetaker',
    description: 'Aggressive entry player that creates space for teammates',
    tSidePositions: ['Entry Fragger', 'First Contact', 'Map Control'],
    ctSidePositions: ['Aggressive Off-Angles', 'Information Plays', 'Early Rotations']
  },
  [PlayerRole.Lurker]: {
    name: 'Lurker',
    description: 'Operates away from main team, creating distractions and flanks',
    tSidePositions: ['Flank Control', 'Split Pressure', 'Late Lurks'],
    ctSidePositions: ['Flank Watch', 'Unexpected Positions', 'Information Gathering']
  },
  [PlayerRole.Support]: {
    name: 'Support',
    description: 'Provides utility support and trades for core players',
    tSidePositions: ['Utility Support', 'Trade Fragger', 'Site Establishment'],
    ctSidePositions: ['Site Support', 'Utility Usage', 'Retake Support']
  },
  [PlayerRole.Anchor]: {
    name: 'Anchor',
    description: 'Holds bombsites and defensive positions firmly',
    tSidePositions: ['Site Control', 'Post-plant Positions', 'Defensive Setup'],
    ctSidePositions: ['Site Anchor', 'Defensive Positioning', 'Hold Specialist']
  },
  [PlayerRole.Rotator]: {
    name: 'Rotator',
    description: 'Flexibly moves between positions based on information',
    tSidePositions: ['Flexible Entry', 'Mid-round Adaptations', 'Reactive Play'],
    ctSidePositions: ['Quick Rotation', 'Mid Control', 'Adaptive Defense']
  },
};

// Role effectiveness by map area (arbitrary values for visualization)
const ROLE_EFFECTIVENESS = {
  [PlayerRole.IGL]: {
    'A Site': 65,
    'B Site': 65,
    'Mid': 85,
    'Long': 60,
    'Connector': 80,
  },
  [PlayerRole.AWP]: {
    'A Site': 70,
    'B Site': 70,
    'Mid': 90,
    'Long': 95,
    'Connector': 60,
  },
  [PlayerRole.Spacetaker]: {
    'A Site': 85,
    'B Site': 85,
    'Mid': 80,
    'Long': 70,
    'Connector': 75,
  },
  [PlayerRole.Lurker]: {
    'A Site': 60,
    'B Site': 65,
    'Mid': 70,
    'Long': 75,
    'Connector': 90,
  },
  [PlayerRole.Support]: {
    'A Site': 80,
    'B Site': 80,
    'Mid': 65,
    'Long': 70,
    'Connector': 75,
  },
  [PlayerRole.Anchor]: {
    'A Site': 95,
    'B Site': 95,
    'Mid': 60,
    'Long': 70,
    'Connector': 50,
  },
  [PlayerRole.Rotator]: {
    'A Site': 75,
    'B Site': 75,
    'Mid': 85,
    'Long': 65,
    'Connector': 80,
  },
};

// Map areas for different maps
const MAP_AREAS = {
  'dust2': ['A Site', 'B Site', 'Mid', 'Long', 'Tunnel', 'Catwalk', 'T Spawn', 'CT Spawn'],
  'mirage': ['A Site', 'B Site', 'Mid', 'Palace', 'Apartments', 'Connector', 'Jungle', 'CT Spawn'],
  'inferno': ['A Site', 'B Site', 'Mid', 'Banana', 'Apartments', 'Pit', 'CT Spawn', 'T Spawn'],
  'nuke': ['A Site', 'B Site', 'Outside', 'Ramp', 'Lobby', 'Secret', 'Heaven', 'Vents'],
  'overpass': ['A Site', 'B Site', 'Long', 'Connector', 'Bathrooms', 'Monster', 'Heaven', 'Bank'],
};

// Sample player positions based on role (for visualization)
const generateHeatmapData = (role: PlayerRole, map: string, side: 'T' | 'CT') => {
  const areas = MAP_AREAS[map as keyof typeof MAP_AREAS] || Object.keys(ROLE_EFFECTIVENESS[role]);
  
  // Generate heatmap data with normalized values
  return areas.map(area => {
    // Base value from role effectiveness for this area
    let baseValue = ROLE_EFFECTIVENESS[role][area as keyof typeof ROLE_EFFECTIVENESS[typeof role]] || 50;
    
    // Adjust based on side (T or CT)
    if (side === 'T') {
      // T side favors certain roles in certain areas
      if (role === PlayerRole.Spacetaker) baseValue += 15;
      if (role === PlayerRole.Lurker && (area.includes('Connector') || area.includes('Flank'))) baseValue += 20;
      if (role === PlayerRole.IGL && area.includes('Mid')) baseValue += 10;
    } else {
      // CT side adjustments
      if (role === PlayerRole.Anchor && (area.includes('Site'))) baseValue += 20;
      if (role === PlayerRole.AWP && (area.includes('Long') || area.includes('Mid'))) baseValue += 15;
      if (role === PlayerRole.Rotator) baseValue += 10;
    }
    
    // Clamp value between 0-100
    const value = Math.min(100, Math.max(0, baseValue));
    
    return {
      area,
      value,
      intensity: value >= 80 ? 'high' : value >= 50 ? 'medium' : 'low'
    };
  });
};

export default function PositionalHeatmap({ players }: PositionalHeatmapProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(players[0]?.id || null);
  const [selectedMap, setSelectedMap] = useState<string>('dust2');
  const [selectedSide, setSelectedSide] = useState<'T' | 'CT'>('T');
  
  // Get the currently selected player data
  const player = useMemo(() => {
    return players.find(p => p.id === selectedPlayer) || null;
  }, [players, selectedPlayer]);
  
  // Get the appropriate role for the selected side
  const effectiveRole = useMemo(() => {
    if (!player) return null;
    
    if (selectedSide === 'T') {
      return player.tRole;
    } else {
      return player.ctRole;
    }
  }, [player, selectedSide]);
  
  // Generate heatmap data for visualization
  const heatmapData = useMemo(() => {
    if (!player || !effectiveRole) return [];
    
    return generateHeatmapData(effectiveRole, selectedMap, selectedSide);
  }, [player, effectiveRole, selectedMap, selectedSide]);
  
  // Calculate color based on value (heat)
  const getHeatColor = (value: number) => {
    if (value >= 80) return 'bg-red-500/80';
    if (value >= 65) return 'bg-orange-500/70';
    if (value >= 50) return 'bg-yellow-500/60';
    if (value >= 35) return 'bg-blue-500/50';
    return 'bg-blue-300/40';
  };
  
  // Get position descriptions based on role and side
  const positionDescriptions = useMemo(() => {
    if (!effectiveRole) return [];
    
    const roleInfo = ROLE_POSITIONS[effectiveRole];
    return selectedSide === 'T' ? roleInfo.tSidePositions : roleInfo.ctSidePositions;
  }, [effectiveRole, selectedSide]);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Control Panel */}
        <Card className="lg:w-1/3">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold mb-4">Positional Analysis</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Select Player</label>
                <Select 
                  value={selectedPlayer || ''} 
                  onValueChange={setSelectedPlayer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map(player => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} ({player.team})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Map</label>
                <Select value={selectedMap} onValueChange={setSelectedMap}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select map" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dust2">Dust II</SelectItem>
                    <SelectItem value="mirage">Mirage</SelectItem>
                    <SelectItem value="inferno">Inferno</SelectItem>
                    <SelectItem value="nuke">Nuke</SelectItem>
                    <SelectItem value="overpass">Overpass</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Side</label>
                <Tabs value={selectedSide} onValueChange={(value) => setSelectedSide(value as 'T' | 'CT')}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="T">T Side</TabsTrigger>
                    <TabsTrigger value="CT">CT Side</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {player && effectiveRole && (
                <div className="mt-6">
                  <h4 className="font-medium">Player Profile</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Player:</span>
                      <span className="text-sm font-medium">{player.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Team:</span>
                      <span className="text-sm font-medium">{player.team}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <span className="text-sm font-medium">{ROLE_POSITIONS[effectiveRole].name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Side:</span>
                      <span className="text-sm font-medium">{selectedSide === 'T' ? 'Terrorist' : 'Counter-Terrorist'}</span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Role Description:</span>
                      <p className="text-sm">{ROLE_POSITIONS[effectiveRole].description}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Common Positions:</span>
                      <ul className="text-sm list-disc pl-5">
                        {positionDescriptions.map((pos, idx) => (
                          <li key={idx}>{pos}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Heatmap Visualization */}
        <Card className="lg:w-2/3">
          <CardHeader>
            <CardTitle>
              {selectedMap.charAt(0).toUpperCase() + selectedMap.slice(1)} - {selectedSide === 'T' ? 'T Side' : 'CT Side'} Positioning
            </CardTitle>
            <CardDescription>
              Showing positional effectiveness for {player?.name || 'selected player'} as a {effectiveRole ? ROLE_POSITIONS[effectiveRole].name : 'player'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!player ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Select a player to view positional analysis</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heatmapData.map((area, index) => (
                    <div 
                      key={index} 
                      className="border rounded-md p-4 flex flex-col items-center justify-center transition-all hover:shadow-md"
                    >
                      <div className="text-sm font-medium">{area.area}</div>
                      <div 
                        className={`w-full h-4 mt-2 rounded-full ${getHeatColor(area.value)}`} 
                        style={{ width: '100%' }}
                      ></div>
                      <div className="text-xs mt-1 text-muted-foreground">
                        {area.value}% effectiveness
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-center mt-4 space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-300/40 mr-1"></div>
                    <span className="text-xs">Low</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60 mr-1"></div>
                    <span className="text-xs">Medium</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 mr-1"></div>
                    <span className="text-xs">High</span>
                  </div>
                </div>
                
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <p>This visualization shows predicted positioning effectiveness based on player role and playstyle.</p>
                  <p className="text-xs mt-1">Data is derived from role analysis and typical positioning patterns.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}