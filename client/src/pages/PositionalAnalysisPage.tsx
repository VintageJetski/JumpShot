import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SimpleTacticalMap } from "@/components/data-visualization/SimpleTacticalMap";
import { PlayerWithPIV } from "@shared/types";

interface XYZPlayerData {
  health: number;
  flash_duration: number;
  place?: string;
  armor: number;
  side: 't' | 'ct';
  pitch: number;
  X: number;
  yaw: number;
  Y: number;
  velocity_X: number;
  Z: number;
  velocity_Y: number;
  velocity_Z: number;
  tick: number;
  user_steamid: string;
  name: string;
  round_num: number;
}

interface PositionalMetrics {
  playerId: string;
  playerName: string;
  team: string;
  roundNum: number;
  totalDistance: number;
  averageVelocity: number;
  maxVelocity: number;
  mapControl: {
    areasCovered: string[];
    timeInEachArea: Record<string, number>;
    dominantArea: string;
  };
  hotZones: {
    x: number;
    y: number;
    intensity: number;
    timeSpent: number;
  }[];
  rotations: {
    from: string;
    to: string;
    timeToRotate: number;
    distanceTraveled: number;
  }[];
  utilityUsage: {
    smokes: { x: number; y: number; z: number; effectiveness: number }[];
    flashes: { x: number; y: number; z: number; effectiveness: number }[];
    nades: { x: number; y: number; z: number; effectiveness: number }[];
    molotovs: { x: number; y: number; z: number; effectiveness: number }[];
  };
}

export default function PositionalAnalysisPage() {
  const [, setLocation] = useLocation();

  // Start with a specific round to prevent initial loading timeout
  const [selectedRound, setSelectedRound] = useState<string>('4');
  
  // Fetch XYZ positional data with round filtering for performance
  const { data: xyzResponse, isLoading: isLoadingXYZ, error: xyzError } = useQuery<{
    data: XYZPlayerData[];
    metadata: { totalRecords: number; roundFilter: string; availableRounds: number[] };
  }>({
    queryKey: ['/api/xyz/raw', { round: selectedRound }],
    retry: 1,
    retryDelay: 2000,
    staleTime: 300000,
    gcTime: 600000,
  });

  const xyzData = xyzResponse?.data || [];
  const metadata = xyzResponse?.metadata;

  // Fetch positional metrics (optional - don't block on this)
  const { data: positionalMetrics = [] } = useQuery<PositionalMetrics[]>({
    queryKey: ['/api/xyz/metrics'],
    retry: 1,
    retryDelay: 1000,
    staleTime: 60000,
    enabled: false, // Disable for now to prevent blocking
  });

  const isLoading = isLoadingXYZ;
  const hasError = xyzError;

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glassmorphism rounded-xl p-8 text-center">
            <div className="text-lg text-red-400 mb-2">Error loading data</div>
            <div className="text-sm text-muted-foreground">Please refresh the page to try again</div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glassmorphism rounded-xl p-8 animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-4"></div>
            <div className="h-4 bg-white/10 rounded mb-8 w-2/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-white/10 rounded"></div>
              <div className="lg:col-span-2 h-96 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/data-visualization')}
            className="mb-4 text-blue-200 hover:text-blue-100 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Data Visualization
          </Button>
          
          <div className="glassmorphism rounded-xl p-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Positional Analysis
            </h1>
            <p className="text-blue-200">
              Analyze player positioning effectiveness across different maps and roles
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="glassmorphism border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Map Positioning & Role Effectiveness</CardTitle>
            <CardDescription className="text-blue-200">
              Interactive heatmap showing where players perform best based on their roles and side selection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metadata && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg text-sm text-blue-200 border border-white/10">
                <div className="flex items-center justify-between">
                  <span>
                    <strong className="text-white">Round {selectedRound}:</strong> {metadata.totalRecords.toLocaleString()} positions
                  </span>
                  {metadata.availableRounds && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Available rounds:</span>
                      <select 
                        value={selectedRound} 
                        onChange={(e) => setSelectedRound(e.target.value)}
                        className="bg-white/10 text-white border border-white/20 rounded px-2 py-1 text-sm"
                      >
                        {metadata.availableRounds.map(round => (
                          <option key={round} value={round.toString()} className="bg-slate-800">
                            Round {round}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
            <SimpleTacticalMap 
              xyzData={xyzData}
              selectedRound={selectedRound}
              onRoundChange={setSelectedRound}
            />
          </CardContent>
        </Card>

        {/* Real-time Data Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="glassmorphism border-white/10">
            <CardContent className="pt-6">
              <h3 className="text-white font-semibold mb-2">Real Coordinate Data</h3>
              <p className="text-blue-200 text-sm">
                Analysis powered by actual XYZ coordinates from CS2 demo files with {xyzData.length.toLocaleString()} position records
              </p>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism border-white/10">
            <CardContent className="pt-6">
              <h3 className="text-white font-semibold mb-2">Movement Analytics</h3>
              <p className="text-blue-200 text-sm">
                Track player rotations, hot zones, velocity patterns, and territory control using real positioning data
              </p>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism border-white/10">
            <CardContent className="pt-6">
              <h3 className="text-white font-semibold mb-2">Utility Effectiveness</h3>
              <p className="text-blue-200 text-sm">
                Analyze smoke placements, flash effectiveness, and grenade impact using precise coordinate tracking
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}