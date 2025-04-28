import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { 
  GlobeIcon, 
  Loader2Icon, 
  ArrowRightIcon, 
  ActivityIcon,
  BarChart3Icon,
  ScaleIcon
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Define interfaces for the application
interface TeamWithTIR {
  id: string;
  name: string;
  tir: number;
  sumPIV?: number;
  synergy?: number;
  avgPIV?: number;
  topPlayerName?: string;
  topPlayerPIV?: number;
  players?: any[];
}

// Import prediction components
import MapSelector from '@/components/match-prediction/MapSelector';
import TeamSelect from '@/components/match-prediction/TeamSelect';
import MapPickAdvantage from '@/components/match-prediction/MapPickAdvantage';
import ContextualFactors from '@/components/match-prediction/ContextualFactors';
import TeamLineup from '@/components/match-prediction/TeamLineup';

// Define available maps for BO3
const availableMaps = [
  'ancient', 'anubis', 'inferno', 'mirage', 'nuke', 'overpass', 'vertigo'
];

const MatchPredictorPage: React.FC = () => {
  const { toast } = useToast();
  
  // State for user selections
  const [matchType, setMatchType] = useState<'bo1' | 'bo3'>('bo1');
  const [team1Id, setTeam1Id] = useState<string | undefined>();
  const [team2Id, setTeam2Id] = useState<string | undefined>();
  
  // BO1 state
  const [selectedMap, setSelectedMap] = useState<string>('');
  
  // BO3 state
  const [team1Picks, setTeam1Picks] = useState<string[]>([]);
  const [team2Picks, setTeam2Picks] = useState<string[]>([]);
  const [deciderMap, setDeciderMap] = useState<string>('');
  const [pickingTeam, setPickingTeam] = useState<'team1' | 'team2'>('team1');
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('setup');

  // Fetch teams data
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for match prediction
  const predictionMutation = useMutation({
    mutationFn: async (data: { team1Id: string; team2Id: string; map: string; isBO3?: boolean; maps?: string[] }) => {
      const response = await fetch('/api/match-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Prediction success:", data);
      toast({
        title: 'Prediction Complete',
        description: 'Match prediction analysis has been calculated',
      });
      setActiveTab('results');
    },
    onError: (error) => {
      console.error("Prediction error:", error);
      toast({
        title: 'Prediction Failed',
        description: 'There was an error generating the match prediction',
        variant: 'destructive',
      });
    },
  });

  // Handle prediction button click
  const handleRunPrediction = () => {
    if (!team1Id || !team2Id) {
      toast({
        title: 'Missing Teams',
        description: 'Please select two teams first',
        variant: 'destructive',
      });
      return;
    }

    if (matchType === 'bo1') {
      if (!selectedMap) {
        toast({
          title: 'Missing Map',
          description: 'Please select a map for the BO1',
          variant: 'destructive',
        });
        return;
      }
      
      predictionMutation.mutate({
        team1Id,
        team2Id,
        map: selectedMap,
        isBO3: false
      });
    } else {
      // BO3 mode
      if (team1Picks.length < 1 || team2Picks.length < 1 || !deciderMap) {
        toast({
          title: 'Missing Maps',
          description: 'Please complete the map picks for BO3',
          variant: 'destructive',
        });
        return;
      }
      
      const allMaps = [...team1Picks, ...team2Picks, deciderMap];
      
      predictionMutation.mutate({
        team1Id,
        team2Id,
        map: allMaps[0], // primary map
        isBO3: true,
        maps: allMaps
      });
    }
  };

  // Get the prediction result
  const prediction = predictionMutation.data?.prediction;
  const team1Name = team1Id;
  const team2Name = team2Id;
  
  // Helper to find a team by ID
  const getTeamById = (id?: string) => {
    if (!id) return null;
    return teams.find(team => team.id === id);
  };
  
  const team1 = getTeamById(team1Id);
  const team2 = getTeamById(team2Id);

  // Calculate win probabilities for visualization
  const team1Chance = prediction?.team1WinProbability 
    ? Math.round(prediction.team1WinProbability * 100) 
    : null;
  const team2Chance = prediction?.team2WinProbability 
    ? Math.round(prediction.team2WinProbability * 100) 
    : null;
    
  // Handle map picks for BO3
  const handleMapPick = (map: string) => {
    if (pickingTeam === 'team1') {
      if (team1Picks.length < 1) {
        setTeam1Picks([...team1Picks, map]);
        setPickingTeam('team2');
      }
    } else {
      if (team2Picks.length < 1) {
        setTeam2Picks([...team2Picks, map]);
        
        // Auto-select decider map (first remaining map)
        const selectedMaps = [...team1Picks, ...team2Picks, map];
        const remainingMaps = availableMaps.filter(m => !selectedMaps.includes(m));
        if (remainingMaps.length > 0) {
          setDeciderMap(remainingMaps[0]);
        }
      }
    }
  };
  
  // Reset map selections
  const resetMapSelections = () => {
    setTeam1Picks([]);
    setTeam2Picks([]);
    setDeciderMap('');
    setPickingTeam('team1');
  };

  // Is a map available to pick?
  const isMapAvailable = (map: string) => {
    const selectedMaps = [...team1Picks, ...team2Picks, deciderMap];
    return !selectedMaps.includes(map);
  };

  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Match Predictor | CS2 Analytics Platform</title>
      </Helmet>

      <div className="flex flex-col space-y-2 mb-6">
        <div className="flex items-center">
          <GlobeIcon className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Match Predictor</h1>
        </div>
        <p className="text-muted-foreground">
          Predict match outcomes based on team performance and round-by-round analysis
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Match Setup</TabsTrigger>
          <TabsTrigger value="teams" disabled={!team1Id && !team2Id}>Team Analysis</TabsTrigger>
          <TabsTrigger value="results" disabled={!prediction}>Prediction Results</TabsTrigger>
        </TabsList>
        
        {/* MATCH SETUP TAB */}
        <TabsContent value="setup" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team selection */}
            <Card>
              <CardHeader>
                <CardTitle>Team Selection</CardTitle>
                <CardDescription>Choose the teams competing in this match</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team 1</label>
                    <Select value={team1Id} onValueChange={setTeam1Id}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} (TIR: {Math.round(team.tir * 10)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team 2</label>
                    <Select value={team2Id} onValueChange={setTeam2Id}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team 2" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} (TIR: {Math.round(team.tir * 10)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Match configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Match Configuration</CardTitle>
                <CardDescription>Choose match type and map selections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Match Type</label>
                    <RadioGroup 
                      value={matchType} 
                      onValueChange={(value: string) => {
                        setMatchType(value as 'bo1' | 'bo3');
                        resetMapSelections();
                        setSelectedMap('');
                      }} 
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bo1" id="bo1" />
                        <label htmlFor="bo1">Best of 1</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bo3" id="bo3" />
                        <label htmlFor="bo3">Best of 3</label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {matchType === 'bo1' ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Map</label>
                      <Select value={selectedMap} onValueChange={setSelectedMap}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a map" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMaps.map((map) => (
                            <SelectItem key={map} value={map}>
                              {map.charAt(0).toUpperCase() + map.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Map Picks ({pickingTeam === 'team1' ? team1Id : team2Id} picking)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {availableMaps.map((map) => (
                            <Button
                              key={map}
                              variant={team1Picks.includes(map) ? "default" : team2Picks.includes(map) ? "secondary" : deciderMap === map ? "outline" : "ghost"}
                              size="sm"
                              disabled={!isMapAvailable(map) || (pickingTeam === 'team1' && team1Picks.length >= 1) || (pickingTeam === 'team2' && team2Picks.length >= 1)}
                              onClick={() => handleMapPick(map)}
                              className="text-xs capitalize justify-start"
                            >
                              {map}
                              {team1Picks.includes(map) && <Badge className="ml-auto bg-blue-500">Team 1</Badge>}
                              {team2Picks.includes(map) && <Badge className="ml-auto bg-yellow-500">Team 2</Badge>}
                              {deciderMap === map && <Badge className="ml-auto">Decider</Badge>}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{team1Id} pick: {team1Picks.join(' ')}</span>
                          <span>{team2Id} pick: {team2Picks.join(' ')}</span>
                        </div>
                        <div className="text-sm">
                          Decider map: {deciderMap}
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetMapSelections}
                        className="w-full"
                      >
                        Reset Map Picks
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleRunPrediction}
                  disabled={predictionMutation.isPending || !team1Id || !team2Id || 
                    (matchType === 'bo1' && !selectedMap) || 
                    (matchType === 'bo3' && (team1Picks.length === 0 || team2Picks.length === 0 || !deciderMap))}
                >
                  {predictionMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Calculating Prediction...
                    </>
                  ) : (
                    <>
                      Run {matchType.toUpperCase()} Prediction
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* TEAM ANALYSIS TAB */}
        <TabsContent value="teams" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team 1 Lineup */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-card/50 border-b pb-3">
                <CardTitle>
                  {team1?.name || 'Team 1'} Lineup
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {team1Id ? (
                  <TeamLineup teamName={team1Id} className="p-4" />
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>Select team 1 to view lineup</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Team 2 Lineup */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-card/50 border-b pb-3">
                <CardTitle>
                  {team2?.name || 'Team 2'} Lineup
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {team2Id ? (
                  <TeamLineup teamName={team2Id} className="p-4" />
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>Select team 2 to view lineup</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Maps Analysis */}
          {team1Id && team2Id && (matchType === 'bo1' ? selectedMap : team1Picks.length > 0 && team2Picks.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ActivityIcon className="mr-2 h-5 w-5 text-primary" />
                  Map Performance Comparison
                </CardTitle>
                <CardDescription>
                  Historical map performance between {team1Id} and {team2Id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {matchType === 'bo1' ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{selectedMap}</span>
                        <div className="flex space-x-2 text-sm">
                          <Badge variant="outline">{team1Id}</Badge>
                          <span>vs</span>
                          <Badge variant="outline">{team2Id}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                        <span>Win rates on {selectedMap}</span>
                        <span>Head-to-head: N/A</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                        <div className="bg-blue-500 h-full" style={{ width: '45%' }} />
                        <div className="bg-yellow-500 h-full" style={{ width: '55%' }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-500">45%</span>
                        <span className="text-yellow-500">55%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {[...team1Picks, ...team2Picks, deciderMap].filter(Boolean).map((map, index) => (
                        <div key={map} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize flex items-center">
                              {map}
                              {team1Picks.includes(map) && <Badge className="ml-2 bg-blue-500/20 text-blue-500">Team 1 Pick</Badge>}
                              {team2Picks.includes(map) && <Badge className="ml-2 bg-yellow-500/20 text-yellow-500">Team 2 Pick</Badge>}
                              {map === deciderMap && <Badge className="ml-2">Decider</Badge>}
                            </span>
                          </div>
                          <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                            <div 
                              className="bg-blue-500 h-full" 
                              style={{ width: '45%' }} 
                            />
                            <div 
                              className="bg-yellow-500 h-full" 
                              style={{ width: '55%' }} 
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-500">45%</span>
                            <span className="text-yellow-500">55%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleRunPrediction}
                  disabled={predictionMutation.isPending || !team1Id || !team2Id || 
                    (matchType === 'bo1' && !selectedMap) || 
                    (matchType === 'bo3' && (team1Picks.length === 0 || team2Picks.length === 0 || !deciderMap))}
                >
                  {predictionMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Calculating Prediction...
                    </>
                  ) : (
                    <>
                      Run {matchType.toUpperCase()} Prediction
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* PREDICTION RESULTS TAB */}
        <TabsContent value="results" className="space-y-6">
          {prediction ? (
            <>
              {/* Main prediction card */}
              <Card className="border-primary/20">
                <CardHeader className="bg-primary/5 border-b pb-3">
                  <CardTitle className="flex items-center">
                    <BarChart3Icon className="mr-2 h-5 w-5 text-primary" />
                    Match Prediction: {matchType.toUpperCase()}
                  </CardTitle>
                  <CardDescription>
                    {matchType === 'bo1' ? (
                      <>Single map: <span className="font-medium capitalize">{selectedMap}</span></>
                    ) : (
                      <>Maps: {[...team1Picks, ...team2Picks, deciderMap].join(', ')}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Win probability display */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                          <span className="font-medium">{team1Id}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">{team2Id}</span>
                          <div className="h-3 w-3 rounded-full bg-yellow-500 ml-2"></div>
                        </div>
                      </div>
                      
                      <div className="relative h-6 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all"
                          style={{ width: `${team1Chance || 50}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-blue-500">{team1Chance}%</span>
                        <span className="text-yellow-500">{team2Chance}%</span>
                      </div>
                      
                      <div className="text-center font-medium text-sm mt-2">
                        Predicted winner: <span className={team1Chance && team2Chance && team1Chance > team2Chance ? "text-blue-500" : "text-yellow-500"}>
                          {team1Chance && team2Chance && team1Chance > team2Chance ? team1Id : team2Id}
                        </span>
                      </div>
                    </div>

                    {/* Key factors & Map advantage */}
                    <div className="grid gap-4 md:grid-cols-2 pt-4">
                      <div>
                        <h3 className="text-base font-semibold mb-2 flex items-center">
                          <ScaleIcon className="mr-2 h-4 w-4" />
                          Key Performance Factors
                        </h3>
                        <ul className="space-y-1 text-sm">
                          {prediction.keyRoundFactors ? (
                            Object.entries(prediction.keyRoundFactors).map(([key, value]: [string, any], index) => (
                              <li key={index} className="flex justify-between">
                                <span>{key}</span>
                                <span className={
                                  value.team1Performance > value.team2Performance
                                    ? "text-blue-500" 
                                    : "text-yellow-500"
                                }>
                                  {value.team1Performance > value.team2Performance
                                    ? `${team1Id} +${Math.round((value.team1Performance - value.team2Performance) * 100)}%`
                                    : `${team2Id} +${Math.round((value.team2Performance - value.team1Performance) * 100)}%`
                                  }
                                </span>
                              </li>
                            ))
                          ) : (
                            <li className="text-muted-foreground italic">No key factors available</li>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-semibold mb-2">Key Insights</h3>
                        <ul className="space-y-1 text-sm">
                          {prediction.insights && prediction.insights.length > 0 ? (
                            prediction.insights.map((insight: string, index: number) => (
                              <li key={index} className="list-disc ml-5">{insight}</li>
                            ))
                          ) : (
                            <li className="text-muted-foreground italic">No insights available</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Detailed analysis cards */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Map pick advantage */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Map Advantage Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MapPickAdvantage
                      mapName={matchType === 'bo1' ? selectedMap : team1Picks[0]}
                      team1Name={team1Id}
                      team2Name={team2Id}
                      keyFactors={prediction.keyRoundFactors}
                      mapPickAdvantage={prediction.mapPickAdvantage}
                    />
                  </CardContent>
                </Card>
                
                {/* Contextual factors */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Contextual Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ContextualFactors
                      insights={prediction.insights || []}
                      keyFactors={prediction.keyRoundFactors}
                      team1Name={team1Id}
                      team2Name={team2Id}
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* Team lineups comparison */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Team Lineups Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {team1Id && (
                      <TeamLineup teamName={team1Id} />
                    )}
                    {team2Id && (
                      <TeamLineup teamName={team2Id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <BarChart3Icon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No prediction results yet</h3>
              <p className="text-muted-foreground mb-4">
                Select teams and maps, then run a prediction to see results here.
              </p>
              <Button onClick={() => setActiveTab('setup')}>
                Go to Match Setup
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchPredictorPage;