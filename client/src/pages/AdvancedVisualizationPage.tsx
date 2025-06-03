import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, BarChart3, TrendingUp, Users, Zap, Activity } from 'lucide-react';
import { PlayerWithPIV, TeamWithTIR } from '@shared/schema';

// Import all chart components
import PIVDistributionChart from '../components/charts/PIVDistributionChart';
import TeamSynergyChart from '../components/charts/TeamSynergyChart';
import PerformanceHeatmap from '../components/charts/PerformanceHeatmap';
import RoleBreakdownChart from '../components/charts/RoleBreakdownChart';
import MetricCorrelationChart from '../components/charts/MetricCorrelationChart';
import TeamPIVBarChart from '../components/charts/TeamPIVBarChart';
import TeamPerformanceOverview from '../components/charts/TeamPerformanceOverview';
import RoleDistributionChart from '../components/charts/RoleDistributionChart';

type VisualizationTab = 'overview' | 'performance' | 'teams' | 'correlations' | 'roles';

export default function AdvancedVisualizationPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<VisualizationTab>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'piv' | 'kd' | 'kills' | 'assists'>('piv');

  // Fetch players and teams data
  const { data: players = [], isLoading: playersLoading } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
  });

  const isLoading = playersLoading || teamsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Advanced Data Visualization</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics dashboard for CS2 performance data
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Players</p>
                <p className="text-2xl font-bold">{players.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Teams</p>
                <p className="text-2xl font-bold">{teams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg PIV</p>
                <p className="text-2xl font-bold">
                  {players.length > 0 ? (players.reduce((sum, p) => sum + p.piv, 0) / players.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Top PIV</p>
                <p className="text-2xl font-bold">
                  {players.length > 0 ? Math.max(...players.map(p => p.piv)).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualization Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as VisualizationTab)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PIVDistributionChart players={players} />
            <RoleDistributionChart players={players} />
            <div className="lg:col-span-2">
              <TeamPerformanceOverview teams={teams} />
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metric Selection</CardTitle>
                <div className="flex gap-4">
                  <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piv">PIV Score</SelectItem>
                      <SelectItem value="kd">K/D Ratio</SelectItem>
                      <SelectItem value="kills">Total Kills</SelectItem>
                      <SelectItem value="assists">Total Assists</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>
            
            <PerformanceHeatmap players={players} metric={selectedMetric} />
          </div>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-6">
          <div className="space-y-6">
            <TeamSynergyChart teams={teams.slice(0, 5)} />
            <TeamPerformanceOverview teams={teams} />
          </div>
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistical Analysis</CardTitle>
                <CardDescription>
                  Explore relationships between different performance metrics
                </CardDescription>
              </CardHeader>
            </Card>
            
            <MetricCorrelationChart players={players} />
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <div className="space-y-6">
            <RoleBreakdownChart players={players} />
            <RoleDistributionChart players={players} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Export and Controls */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Data Export & Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Export visualization data or generate reports
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}