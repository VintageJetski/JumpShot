import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { Loader2Icon, ArrowRightIcon } from 'lucide-react';

// Import our prediction components
import MapSelector from '@/components/match-prediction/MapSelector';
import TeamSelect from '@/components/match-prediction/TeamSelect';
import MapPickAdvantage from '@/components/match-prediction/MapPickAdvantage';
import ContextualFactors from '@/components/match-prediction/ContextualFactors';
import TeamLineup from '@/components/match-prediction/TeamLineup';

const MatchPredictorPage: React.FC = () => {
  // State for user selections
  const [selectedMap, setSelectedMap] = useState('');
  const [team1Id, setTeam1Id] = useState<string | undefined>();
  const [team2Id, setTeam2Id] = useState<string | undefined>();
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  // Fetch teams data
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/teams'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for match prediction
  const predictionMutation = useMutation({
    mutationFn: async (data: { team1Id: string; team2Id: string; map: string }) => {
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
    if (!team1Id || !team2Id || !selectedMap) {
      toast({
        title: 'Missing Information',
        description: 'Please select two teams and a map first',
        variant: 'destructive',
      });
      return;
    }

    predictionMutation.mutate({
      team1Id,
      team2Id,
      map: selectedMap
    });
  };

  // Get the prediction result
  const prediction = predictionMutation.data?.prediction;
  const team1Name = team1Id;
  const team2Name = team2Id;

  // Calculate win probabilities for visualization
  const team1Chance = prediction?.team1WinProbability 
    ? Math.round(prediction.team1WinProbability * 100) 
    : null;
  const team2Chance = prediction?.team2WinProbability 
    ? Math.round(prediction.team2WinProbability * 100) 
    : null;

  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Match Predictor | CS2 Analytics Platform</title>
      </Helmet>

      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Match Predictor</h1>
        <p className="text-muted-foreground">
          Predict match outcomes based on team performance and round-by-round analysis
        </p>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left column - Team select */}
        <div className="space-y-6 md:col-span-1">
          <TeamSelect 
            teams={teams}
            team1Id={team1Id}
            team2Id={team2Id}
            onTeam1Change={setTeam1Id}
            onTeam2Change={setTeam2Id}
          />
          
          <MapSelector 
            selectedMap={selectedMap}
            onMapChange={setSelectedMap}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-mode"
                checked={showAdvancedDetails}
                onCheckedChange={setShowAdvancedDetails}
              />
              <label
                htmlFor="advanced-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show advanced details
              </label>
            </div>
            
            <Button 
              onClick={handleRunPrediction} 
              disabled={!team1Id || !team2Id || !selectedMap || predictionMutation.isPending}
            >
              {predictionMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  Run Prediction
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Middle column - Results */}
        <div className="md:col-span-1">
          {prediction ? (
            <div className="bg-card rounded-lg border p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Prediction Results</h2>
              
              <div className="relative h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500"
                  style={{ width: `${team1Chance}%` }}
                >
                </div>
                <div 
                  className="absolute top-0 right-0 h-full bg-yellow-500"
                  style={{ width: `${team2Chance}%` }}
                >
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <span className="font-semibold text-white text-shadow">
                    {team1Chance}%
                  </span>
                  <span className="font-semibold text-white text-shadow">
                    {team2Chance}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="text-center">
                  <h3 className="font-medium">{team1Name}</h3>
                  <div className={`text-xl font-bold mt-1 ${team1Chance && team1Chance > team2Chance ? 'text-blue-500' : ''}`}>
                    {team1Chance}%
                  </div>
                </div>
                
                <div className="text-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <span className="text-sm font-medium">vs</span>
                </div>
                
                <div className="text-center">
                  <h3 className="font-medium">{team2Name}</h3>
                  <div className={`text-xl font-bold mt-1 ${team2Chance && team2Chance > team1Chance ? 'text-yellow-500' : ''}`}>
                    {team2Chance}%
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Key Insights:</h3>
                <ul className="space-y-1 text-sm">
                  {prediction.insights && prediction.insights.length > 0 ? (
                    prediction.insights.map((insight: string, index: number) => (
                      <li key={index} className="list-disc ml-5">{insight}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground italic">No specific insights available</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-card rounded-lg border p-6 shadow-sm">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Select two teams and a map, then run the prediction to see results
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Contextual factors */}
        <div className="space-y-6 md:col-span-2 lg:col-span-1">
          {prediction && (
            <>
              <MapPickAdvantage
                mapName={selectedMap}
                team1Name={team1Name}
                team2Name={team2Name}
                keyFactors={prediction.keyRoundFactors}
                mapPickAdvantage={prediction.mapPickAdvantage}
              />
              
              {showAdvancedDetails && (
                <ContextualFactors
                  insights={prediction.insights || []}
                  keyFactors={prediction.keyRoundFactors}
                  team1Name={team1Name}
                  team2Name={team2Name}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Team lineups section */}
      {(team1Id || team2Id) && (
        <>
          <Separator className="my-6" />
          <h2 className="text-2xl font-bold mb-4">Team Lineups</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {team1Id && (
              <TeamLineup teamName={team1Id} />
            )}
            {team2Id && (
              <TeamLineup teamName={team2Id} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MatchPredictorPage;