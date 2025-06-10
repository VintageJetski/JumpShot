import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import XYZPositionalAnalysis from "@/components/data-visualization/XYZPositionalAnalysis";
import { PlayerWithPIV } from "@shared/types";

interface XYZPlayerData {
  health: number;
  flashDuration: number;
  place: string;
  armor: number;
  side: 't' | 'ct';
  pitch: number;
  X: number;
  yaw: number;
  Y: number;
  velocityX: number;
  Z: number;
  velocityY: number;
  velocityZ: number;
  tick: number;
  userSteamid: string;
  name: string;
  roundNum: number;
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

  // Fetch XYZ positional data
  const { data: xyzData = [], isLoading: isLoadingXYZ } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  // Fetch positional metrics
  const { data: positionalMetrics = [], isLoading: isLoadingMetrics } = useQuery<PositionalMetrics[]>({
    queryKey: ['/api/xyz/metrics'],
  });

  const isLoading = isLoadingXYZ || isLoadingMetrics;

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
            <XYZPositionalAnalysis 
              xyzData={xyzData} 
              positionalMetrics={positionalMetrics} 
            />
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="glassmorphism border-white/10">
            <CardContent className="pt-6">
              <h3 className="text-white font-semibold mb-2">T-Side Positioning</h3>
              <p className="text-blue-200 text-sm">
                Analyze attacking positions and effectiveness for entry fraggers, AWPers, and support players
              </p>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism border-white/10">
            <CardContent className="pt-6">
              <h3 className="text-white font-semibold mb-2">CT-Side Positioning</h3>
              <p className="text-blue-200 text-sm">
                Evaluate defensive setups, anchor positions, and rotation patterns
              </p>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism border-white/10">
            <CardContent className="pt-6">
              <h3 className="text-white font-semibold mb-2">Role-Based Analysis</h3>
              <p className="text-blue-200 text-sm">
                Compare positioning effectiveness across different player roles and maps
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}