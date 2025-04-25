import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamRoundMetrics } from '@shared/schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RoundMetricsCardProps {
  metrics: TeamRoundMetrics | null | undefined;
  isLoading: boolean;
}

// Custom formatter for tooltip values
const formatTooltipValue = (value: any): string => {
  if (typeof value === 'number') {
    return `${value.toFixed(1)}%`;
  }
  return `${value}%`;
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

  // Economy metrics data
  const economyData = [
    { name: 'Full Buy Win Rate', value: metrics.fullBuyWinRate * 100 },
    { name: 'Force Buy Win Rate', value: metrics.forceRoundWinRate * 100 },
    { name: 'Eco Win Rate', value: metrics.ecoRoundWinRate * 100 },
    { name: 'Economic Recovery', value: metrics.economicRecoveryIndex * 100 },
  ];

  // Strategic metrics data
  const strategicData = [
    { name: 'Bomb Plant Rate', value: metrics.bombPlantRate * 100 },
    { name: 'Post-Plant Win Rate', value: metrics.postPlantWinRate * 100 },
    { name: 'Retake Success Rate', value: metrics.retakeSuccessRate * 100 },
    { name: 'A Site Preference', value: metrics.aPreference * 100 },
    { name: 'B Site Preference', value: metrics.bPreference * 100 },
  ];

  // Momentum metrics data
  const momentumData = [
    { name: 'Pistol Win Rate', value: metrics.pistolRoundWinRate * 100 },
    { name: 'Follow-Up Win Rate', value: metrics.followUpRoundWinRate * 100 },
    { name: 'Comeback Factor', value: metrics.comebackFactor * 100 },
    { name: 'Closing Factor', value: metrics.closingFactor * 100 },
  ];

  // Map performance data
  const mapData = Object.entries(metrics.mapPerformance).map(([map, stats]) => ({
    name: map,
    CT: stats.ctWinRate * 100,
    T: stats.tWinRate * 100,
  }));

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
          
          <TabsContent value="economy" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={economyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip formatter={formatTooltipValue} />
                <Legend />
                <Bar dataKey="value" name="Success Rate (%)" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="strategic" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategicData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={130} />
                <Tooltip formatter={formatTooltipValue} />
                <Legend />
                <Bar dataKey="value" name="Rate (%)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="momentum" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={momentumData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={130} />
                <Tooltip formatter={formatTooltipValue} />
                <Legend />
                <Bar dataKey="value" name="Success Rate (%)" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="maps" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mapData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={formatTooltipValue} />
                <Legend />
                <Bar dataKey="CT" name="CT Win Rate (%)" fill="#3b82f6" />
                <Bar dataKey="T" name="T Win Rate (%)" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RoundMetricsCard;