import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamRoundMetrics } from '@shared/schema';
import { DollarSign, Target, Zap, Map } from 'lucide-react';

interface RoundMetricsCardProps {
  metrics: TeamRoundMetrics | null | undefined;
  isLoading: boolean;
}

interface MetricBoxProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
}

const MetricBox: React.FC<MetricBoxProps> = ({ title, value, icon, color = "bg-blue-500" }) => {
  // Format value as percentage
  const formattedValue = `${Math.round(value * 100)}%`;
  
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold mt-1">{formattedValue}</p>
          </div>
          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RoundMetricsCard: React.FC<RoundMetricsCardProps> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Round-Based Metrics</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse h-48 w-full bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle>Round-Based Metrics</CardTitle>
          <CardDescription>No round data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Round data has not been processed for this team</p>
        </CardContent>
      </Card>
    );
  }

  // Define types for map stats
  interface MapStats {
    ctWinRate: number;
    tWinRate: number;
    bombsitesPreference: {
      a: number;
      b: number;
    };
  }

  interface FormattedMapData {
    name: string;
    stats: MapStats;
  }

  // Transform map performance data with better formatted names
  const formattedMapPerformance: FormattedMapData[] = Object.entries(metrics.mapPerformance).map(([map, stats]) => {
    // If the map is p1, p2, p3, format as "Pick 1", "Pick 2", "Pick 3"
    const formattedName = map.startsWith('p') && !isNaN(parseInt(map.substring(1))) 
      ? `Pick ${map.substring(1)}` 
      : map.charAt(0).toUpperCase() + map.slice(1); // Capitalize regular map names
    
    // Cast the stats to the appropriate type
    const typedStats = stats as MapStats;
    
    return {
      name: formattedName,
      stats: typedStats
    };
  });

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Round-Based Metrics</CardTitle>
        <CardDescription>Tactical and strategic performance</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="economy">
          <TabsList className="mb-4">
            <TabsTrigger value="economy">Economy</TabsTrigger>
            <TabsTrigger value="strategic">Strategic</TabsTrigger>
            <TabsTrigger value="momentum">Momentum</TabsTrigger>
            <TabsTrigger value="maps">Maps</TabsTrigger>
          </TabsList>
          
          <TabsContent value="economy" className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <MetricBox 
                title="Full Buy Win Rate" 
                value={metrics.fullBuyWinRate} 
                icon={<DollarSign className="text-white w-5 h-5" />}
                color="bg-blue-500"
              />
              <MetricBox 
                title="Force Buy Win Rate" 
                value={metrics.forceRoundWinRate} 
                icon={<DollarSign className="text-white w-5 h-5" />}
                color="bg-purple-500"
              />
              <MetricBox 
                title="Eco Win Rate" 
                value={metrics.ecoRoundWinRate} 
                icon={<DollarSign className="text-white w-5 h-5" />}
                color="bg-green-500"
              />
              <MetricBox 
                title="Economic Recovery" 
                value={metrics.economicRecoveryIndex} 
                icon={<DollarSign className="text-white w-5 h-5" />}
                color="bg-amber-500"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="strategic" className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <MetricBox 
                title="Bomb Plant Rate" 
                value={metrics.bombPlantRate} 
                icon={<Target className="text-white w-5 h-5" />}
                color="bg-red-500"
              />
              <MetricBox 
                title="Post-Plant Win Rate" 
                value={metrics.postPlantWinRate} 
                icon={<Target className="text-white w-5 h-5" />}
                color="bg-amber-500"
              />
              <MetricBox 
                title="Retake Success Rate" 
                value={metrics.retakeSuccessRate} 
                icon={<Target className="text-white w-5 h-5" />}
                color="bg-green-500"
              />
              <MetricBox 
                title="A Site Preference" 
                value={metrics.aPreference} 
                icon={<Target className="text-white w-5 h-5" />}
                color="bg-blue-500"
              />
              <MetricBox 
                title="B Site Preference" 
                value={metrics.bPreference} 
                icon={<Target className="text-white w-5 h-5" />}
                color="bg-purple-500"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="momentum" className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricBox 
                title="Pistol Win Rate" 
                value={metrics.pistolRoundWinRate} 
                icon={<Zap className="text-white w-5 h-5" />}
                color="bg-yellow-500"
              />
              <MetricBox 
                title="Follow-Up Win Rate" 
                value={metrics.followUpRoundWinRate} 
                icon={<Zap className="text-white w-5 h-5" />}
                color="bg-green-500"
              />
              <MetricBox 
                title="Comeback Factor" 
                value={metrics.comebackFactor} 
                icon={<Zap className="text-white w-5 h-5" />}
                color="bg-blue-500"
              />
              <MetricBox 
                title="Closing Factor" 
                value={metrics.closingFactor} 
                icon={<Zap className="text-white w-5 h-5" />}
                color="bg-purple-500"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="maps" className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {formattedMapPerformance.map((item) => (
                <Card key={item.name} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center">
                      <Map className="h-4 w-4 mr-2 text-blue-400" />
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-400">CT Win Rate</span>
                        <span className="font-medium">{Math.round(item.stats.ctWinRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-400">T Win Rate</span>
                        <span className="font-medium">{Math.round(item.stats.tWinRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">A / B Preference</span>
                        <span className="font-medium">
                          {Math.round(item.stats.bombsitesPreference.a * 100)}% / {Math.round(item.stats.bombsitesPreference.b * 100)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RoundMetricsCard;