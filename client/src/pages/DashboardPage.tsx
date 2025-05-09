import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { motion } from 'framer-motion';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { PlayerWithPIV, TeamWithTIR } from '@shared/schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Sliders, Save, RotateCcw, Grid, MoveHorizontal } from 'lucide-react';

// Import widget components
import PlayerCard from '@/components/dashboard/widgets/PlayerCard';
import TeamComparison from '@/components/dashboard/widgets/TeamComparison';
import PIVChart from '@/components/dashboard/widgets/PIVChart';
import MatchPrediction from '@/components/dashboard/widgets/MatchPrediction';
import RoleDistribution from '@/components/dashboard/widgets/RoleDistribution';
import PlayerPerformance from '@/components/dashboard/widgets/PlayerPerformance';
import TeamOverview from '@/components/dashboard/widgets/TeamOverview';
import UpcomingMatches from '@/components/dashboard/widgets/UpcomingMatches';

// Configure the responsive grid layout
const ResponsiveGridLayout = WidthProvider(Responsive);

// Define the widget types
const WIDGET_TYPES = {
  PLAYER_CARD: 'player_card',
  TEAM_COMPARISON: 'team_comparison',
  PIV_CHART: 'piv_chart',
  MATCH_PREDICTION: 'match_prediction',
  ROLE_DISTRIBUTION: 'role_distribution',
  PLAYER_PERFORMANCE: 'player_performance',
  TEAM_OVERVIEW: 'team_overview',
  UPCOMING_MATCHES: 'upcoming_matches',
};

// Define widget metadata
const WIDGET_METADATA = {
  [WIDGET_TYPES.PLAYER_CARD]: {
    name: 'Player Card',
    description: 'Shows a player\'s basic information and PIV rating',
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    defaultW: 2,
    defaultH: 2,
  },
  [WIDGET_TYPES.TEAM_COMPARISON]: {
    name: 'Team Comparison',
    description: 'Compare two teams across various metrics',
    minW: 3,
    minH: 4,
    maxW: 6,
    maxH: 6,
    defaultW: 4,
    defaultH: 4,
  },
  [WIDGET_TYPES.PIV_CHART]: {
    name: 'PIV Comparison Chart',
    description: 'Compare PIV ratings of multiple players',
    minW: 4,
    minH: 3,
    maxW: 12,
    maxH: 6,
    defaultW: 6,
    defaultH: 3,
  },
  [WIDGET_TYPES.MATCH_PREDICTION]: {
    name: 'Match Prediction',
    description: 'Shows the prediction for a match between two teams',
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 5,
    defaultW: 4,
    defaultH: 3,
  },
  [WIDGET_TYPES.ROLE_DISTRIBUTION]: {
    name: 'Role Distribution',
    description: 'Shows the role distribution within a team',
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 5,
    defaultW: 4,
    defaultH: 3,
  },
  [WIDGET_TYPES.PLAYER_PERFORMANCE]: {
    name: 'Player Performance',
    description: 'Detailed performance metrics for a player',
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 5,
    defaultW: 4,
    defaultH: 3,
  },
  [WIDGET_TYPES.TEAM_OVERVIEW]: {
    name: 'Team Overview',
    description: 'Comprehensive overview of a team',
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 5,
    defaultW: 4,
    defaultH: 3,
  },
  [WIDGET_TYPES.UPCOMING_MATCHES]: {
    name: 'Upcoming Matches',
    description: 'List of upcoming matches',
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 5,
    defaultW: 4,
    defaultH: 3,
  },
};

// Default configurations for new dashboards
const DEFAULT_DASHBOARD_CONFIG = {
  layouts: {
    lg: [],
    md: [],
    sm: [],
    xs: [],
    xxs: [],
  },
  widgets: {},
  name: 'New Dashboard',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function DashboardPage() {
  // Fetch players and teams for the widget configurations
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
  });

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
  });

  // Load dashboards from local storage
  const [dashboards, setDashboards] = useLocalStorage<Record<string, any>>('cs2-dashboards', {
    'default': { 
      ...DEFAULT_DASHBOARD_CONFIG,
      name: 'Default Dashboard'
    }
  });

  // Active dashboard state
  const [activeDashboardId, setActiveDashboardId] = useLocalStorage<string>('cs2-active-dashboard', 'default');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddWidgetDialog, setShowAddWidgetDialog] = useState(false);
  const [showDashboardDialog, setShowDashboardDialog] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [dashboardAction, setDashboardAction] = useState<'new' | 'rename' | 'delete'>('new');

  // Widget configuration state
  const [selectedWidgetType, setSelectedWidgetType] = useState(WIDGET_TYPES.PLAYER_CARD);
  const [widgetConfig, setWidgetConfig] = useState<Record<string, any>>({});

  // Get the active dashboard configuration
  const activeDashboard = dashboards[activeDashboardId] || dashboards['default'];

  // Function to generate a unique ID for widgets
  const generateWidgetId = () => `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle layout changes
  const handleLayoutChange = (layout: any[], layouts: any) => {
    setDashboards({
      ...dashboards,
      [activeDashboardId]: {
        ...dashboards[activeDashboardId],
        layouts: layouts,
        updatedAt: new Date().toISOString()
      }
    });
  };

  // Add a new widget to the dashboard
  const addWidget = () => {
    const widgetId = generateWidgetId();
    const widgetType = selectedWidgetType;
    const metadata = WIDGET_METADATA[widgetType];

    // Add the widget to the layouts and widgets
    const newDashboard = {
      ...dashboards[activeDashboardId],
      layouts: {
        ...dashboards[activeDashboardId].layouts,
        lg: [
          ...dashboards[activeDashboardId].layouts.lg,
          {
            i: widgetId,
            x: 0,
            y: Infinity, // Add to the bottom
            w: metadata.defaultW,
            h: metadata.defaultH,
            minW: metadata.minW,
            minH: metadata.minH,
            maxW: metadata.maxW,
            maxH: metadata.maxH,
            isDraggable: true,
            isResizable: true,
          }
        ]
      },
      widgets: {
        ...dashboards[activeDashboardId].widgets,
        [widgetId]: {
          type: widgetType,
          config: widgetConfig,
        }
      },
      updatedAt: new Date().toISOString()
    };

    setDashboards({
      ...dashboards,
      [activeDashboardId]: newDashboard
    });

    // Reset state and close dialog
    setWidgetConfig({});
    setShowAddWidgetDialog(false);
    
    toast({
      title: 'Widget Added',
      description: `Added new ${metadata.name} widget to your dashboard.`,
    });
  };

  // Remove a widget from the dashboard
  const removeWidget = (widgetId: string) => {
    const newDashboard = {
      ...dashboards[activeDashboardId],
      layouts: {
        ...dashboards[activeDashboardId].layouts,
        lg: dashboards[activeDashboardId].layouts.lg.filter((item: any) => item.i !== widgetId),
        md: dashboards[activeDashboardId].layouts.md.filter((item: any) => item.i !== widgetId),
        sm: dashboards[activeDashboardId].layouts.sm.filter((item: any) => item.i !== widgetId),
        xs: dashboards[activeDashboardId].layouts.xs.filter((item: any) => item.i !== widgetId),
        xxs: dashboards[activeDashboardId].layouts.xxs.filter((item: any) => item.i !== widgetId),
      },
      widgets: Object.fromEntries(
        Object.entries(dashboards[activeDashboardId].widgets).filter(([id]) => id !== widgetId)
      ),
      updatedAt: new Date().toISOString()
    };

    setDashboards({
      ...dashboards,
      [activeDashboardId]: newDashboard
    });

    toast({
      title: 'Widget Removed',
      description: `Removed widget from your dashboard.`,
    });
  };

  // Create a new dashboard
  const createDashboard = () => {
    if (!newDashboardName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your dashboard.',
        variant: 'destructive',
      });
      return;
    }

    // Check if dashboard with that name already exists
    const dashboardExists = Object.values(dashboards).some(d => d.name === newDashboardName);
    if (dashboardExists) {
      toast({
        title: 'Dashboard Already Exists',
        description: 'A dashboard with that name already exists.',
        variant: 'destructive',
      });
      return;
    }

    const dashboardId = `dashboard-${Date.now()}`;
    setDashboards({
      ...dashboards,
      [dashboardId]: {
        ...DEFAULT_DASHBOARD_CONFIG,
        name: newDashboardName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
    setActiveDashboardId(dashboardId);
    setNewDashboardName('');
    setShowDashboardDialog(false);

    toast({
      title: 'Dashboard Created',
      description: `Created new dashboard "${newDashboardName}".`,
    });
  };

  // Rename the current dashboard
  const renameDashboard = () => {
    if (!newDashboardName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your dashboard.',
        variant: 'destructive',
      });
      return;
    }

    setDashboards({
      ...dashboards,
      [activeDashboardId]: {
        ...dashboards[activeDashboardId],
        name: newDashboardName,
        updatedAt: new Date().toISOString(),
      }
    });
    setNewDashboardName('');
    setShowDashboardDialog(false);

    toast({
      title: 'Dashboard Renamed',
      description: `Renamed dashboard to "${newDashboardName}".`,
    });
  };

  // Delete the current dashboard
  const deleteDashboard = () => {
    // Don't allow deleting the default dashboard
    if (activeDashboardId === 'default') {
      toast({
        title: 'Cannot Delete Default',
        description: 'The default dashboard cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }

    const { [activeDashboardId]: deletedDashboard, ...remainingDashboards } = dashboards;
    setDashboards(remainingDashboards);
    setActiveDashboardId('default');
    setShowDashboardDialog(false);

    toast({
      title: 'Dashboard Deleted',
      description: `Deleted dashboard "${dashboards[activeDashboardId].name}".`,
    });
  };

  // Handle dashboard dialog actions
  const handleDashboardAction = () => {
    switch(dashboardAction) {
      case 'new':
        createDashboard();
        break;
      case 'rename':
        renameDashboard();
        break;
      case 'delete':
        deleteDashboard();
        break;
    }
  };

  // Reset dashboard to defaults
  const resetDashboard = () => {
    setDashboards({
      ...dashboards,
      [activeDashboardId]: {
        ...DEFAULT_DASHBOARD_CONFIG,
        name: dashboards[activeDashboardId].name,
        createdAt: dashboards[activeDashboardId].createdAt,
        updatedAt: new Date().toISOString(),
      }
    });

    toast({
      title: 'Dashboard Reset',
      description: `Reset "${dashboards[activeDashboardId].name}" to default settings.`,
    });
  };

  // Render the widget component based on its type and configuration
  const renderWidget = (widgetId: string) => {
    const widget = dashboards[activeDashboardId].widgets[widgetId];
    if (!widget) return null;

    const { type, config } = widget;

    switch (type) {
      case WIDGET_TYPES.PLAYER_CARD:
        const player = players.find(p => p.id === config.playerId);
        return player ? <PlayerCard player={player} /> : <div className="p-4">Player not found.</div>;
      
      case WIDGET_TYPES.TEAM_COMPARISON:
        const team1 = teams.find(t => t.name === config.team1Id);
        const team2 = teams.find(t => t.name === config.team2Id);
        return (team1 && team2) ? <TeamComparison team1={team1} team2={team2} /> : <div className="p-4">Team(s) not found.</div>;
      
      case WIDGET_TYPES.PIV_CHART:
        const selectedPlayers = (config.playerIds || [])
          .map((id: string) => players.find(p => p.id === id))
          .filter(Boolean) as PlayerWithPIV[];
        return <PIVChart players={selectedPlayers} />;
      
      case WIDGET_TYPES.MATCH_PREDICTION:
        const predTeam1 = teams.find(t => t.name === config.team1Id);
        const predTeam2 = teams.find(t => t.name === config.team2Id);
        return (predTeam1 && predTeam2) ? <MatchPrediction team1={predTeam1} team2={predTeam2} /> : <div className="p-4">Team(s) not found.</div>;
      
      case WIDGET_TYPES.ROLE_DISTRIBUTION:
        const roleTeam = teams.find(t => t.name === config.teamId);
        return roleTeam ? <RoleDistribution team={roleTeam} /> : <div className="p-4">Team not found.</div>;
      
      case WIDGET_TYPES.PLAYER_PERFORMANCE:
        const perfPlayer = players.find(p => p.id === config.playerId);
        return perfPlayer ? <PlayerPerformance player={perfPlayer} /> : <div className="p-4">Player not found.</div>;
      
      case WIDGET_TYPES.TEAM_OVERVIEW:
        const overviewTeam = teams.find(t => t.name === config.teamId);
        return overviewTeam ? <TeamOverview team={overviewTeam} /> : <div className="p-4">Team not found.</div>;
      
      case WIDGET_TYPES.UPCOMING_MATCHES:
        return <UpcomingMatches limit={config.limit || 3} />;
      
      default:
        return <div className="p-4">Unknown widget type.</div>;
    }
  };

  // Widget configuration form based on the selected widget type
  const renderWidgetConfigForm = () => {
    switch (selectedWidgetType) {
      case WIDGET_TYPES.PLAYER_CARD:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-select">Select Player</Label>
              <Select 
                onValueChange={(value) => setWidgetConfig({ ...widgetConfig, playerId: value })}
                value={widgetConfig.playerId || ""}
              >
                <SelectTrigger id="player-select">
                  <SelectValue placeholder="Select a player" />
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
          </div>
        );
      
      case WIDGET_TYPES.TEAM_COMPARISON:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team1-select">Team 1</Label>
              <Select 
                onValueChange={(value) => setWidgetConfig({ ...widgetConfig, team1Id: value })}
                value={widgetConfig.team1Id || ""}
              >
                <SelectTrigger id="team1-select">
                  <SelectValue placeholder="Select first team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.name} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team2-select">Team 2</Label>
              <Select 
                onValueChange={(value) => setWidgetConfig({ ...widgetConfig, team2Id: value })}
                value={widgetConfig.team2Id || ""}
              >
                <SelectTrigger id="team2-select">
                  <SelectValue placeholder="Select second team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.name} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case WIDGET_TYPES.PIV_CHART:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Players (up to 5)</Label>
              <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                {players.map(player => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <Switch
                      id={`player-switch-${player.id}`}
                      checked={(widgetConfig.playerIds || []).includes(player.id)}
                      onCheckedChange={(checked) => {
                        let newPlayerIds = [...(widgetConfig.playerIds || [])];
                        if (checked) {
                          // Add if not already included
                          if (!newPlayerIds.includes(player.id)) {
                            newPlayerIds.push(player.id);
                          }
                        } else {
                          // Remove if included
                          newPlayerIds = newPlayerIds.filter(id => id !== player.id);
                        }
                        setWidgetConfig({ ...widgetConfig, playerIds: newPlayerIds });
                      }}
                    />
                    <Label htmlFor={`player-switch-${player.id}`} className="text-sm">
                      {player.name} ({player.team})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case WIDGET_TYPES.MATCH_PREDICTION:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pred-team1-select">Team 1</Label>
              <Select 
                onValueChange={(value) => setWidgetConfig({ ...widgetConfig, team1Id: value })}
                value={widgetConfig.team1Id || ""}
              >
                <SelectTrigger id="pred-team1-select">
                  <SelectValue placeholder="Select first team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.name} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pred-team2-select">Team 2</Label>
              <Select 
                onValueChange={(value) => setWidgetConfig({ ...widgetConfig, team2Id: value })}
                value={widgetConfig.team2Id || ""}
              >
                <SelectTrigger id="pred-team2-select">
                  <SelectValue placeholder="Select second team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.name} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case WIDGET_TYPES.ROLE_DISTRIBUTION:
      case WIDGET_TYPES.TEAM_OVERVIEW:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-select">Select Team</Label>
              <Select 
                onValueChange={(value) => setWidgetConfig({ ...widgetConfig, teamId: value })}
                value={widgetConfig.teamId || ""}
              >
                <SelectTrigger id="team-select">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.name} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case WIDGET_TYPES.PLAYER_PERFORMANCE:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-select">Select Player</Label>
              <Select 
                onValueChange={(value) => setWidgetConfig({ ...widgetConfig, playerId: value })}
                value={widgetConfig.playerId || ""}
              >
                <SelectTrigger id="player-select">
                  <SelectValue placeholder="Select a player" />
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
          </div>
        );
      
      case WIDGET_TYPES.UPCOMING_MATCHES:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matches-limit">Number of Matches</Label>
              <Input
                id="matches-limit"
                type="number"
                value={widgetConfig.limit || 3}
                min={1}
                max={10}
                onChange={(e) => setWidgetConfig({ ...widgetConfig, limit: parseInt(e.target.value) || 3 })}
              />
            </div>
          </div>
        );
      
      default:
        return <div>No configuration needed for this widget.</div>;
    }
  };

  // If loading data, show a loading spinner
  if (isLoadingPlayers || isLoadingTeams) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-screen-2xl">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-50 flex items-center">
            <Grid className="mr-2 h-5 w-5 text-blue-400" />
            <span>
              {dashboards[activeDashboardId]?.name || 'My Dashboard'}
            </span>
          </h1>
          <p className="text-sm text-blue-300 mt-1">
            Your customizable analytics hub
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Select
            value={activeDashboardId}
            onValueChange={(value) => setActiveDashboardId(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Dashboard" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dashboards).map(([id, dashboard]) => (
                <SelectItem key={id} value={id}>
                  {dashboard.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={showDashboardDialog} onOpenChange={setShowDashboardDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDashboardAction('new');
                  setNewDashboardName('');
                  setShowDashboardDialog(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {dashboardAction === 'new' ? 'Create New Dashboard' : 
                   dashboardAction === 'rename' ? 'Rename Dashboard' : 
                   'Delete Dashboard'}
                </DialogTitle>
                <DialogDescription>
                  {dashboardAction === 'new' ? 'Create a new dashboard with a custom name.' : 
                   dashboardAction === 'rename' ? 'Enter a new name for your dashboard.' : 
                   'Are you sure you want to delete this dashboard? This action cannot be undone.'}
                </DialogDescription>
              </DialogHeader>
              
              {dashboardAction !== 'delete' && (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-name">Dashboard Name</Label>
                    <Input
                      id="dashboard-name"
                      placeholder="Enter dashboard name"
                      value={newDashboardName}
                      onChange={(e) => setNewDashboardName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDashboardDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleDashboardAction}
                  variant={dashboardAction === 'delete' ? 'destructive' : 'default'}
                >
                  {dashboardAction === 'new' ? 'Create' : 
                   dashboardAction === 'rename' ? 'Rename' : 
                   'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDashboardAction('rename');
              setNewDashboardName(dashboards[activeDashboardId]?.name || '');
              setShowDashboardDialog(true);
            }}
          >
            Rename
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDashboardAction('delete');
              setShowDashboardDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetDashboard}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
          
          <Button
            variant={isEditMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Sliders className="mr-1 h-4 w-4" />
            {isEditMode ? "Done Editing" : "Edit Layout"}
          </Button>
        </div>
      </div>
      
      {/* Dashboard Grid */}
      <div className={`
        border border-blue-900/30 rounded-lg p-4 bg-blue-950/40
        transition-all duration-200
        ${isEditMode ? 'bg-blue-950/60 shadow-inner' : ''}
      `}>
        {/* Edit mode instructions */}
        {isEditMode && (
          <div className="mb-4 p-3 bg-blue-900/20 rounded-md flex items-center text-sm">
            <MoveHorizontal className="h-4 w-4 mr-2 text-blue-400" />
            <p className="text-blue-200">
              Drag widgets to rearrange them or resize by pulling the bottom-right corner. Add new widgets using the button below.
            </p>
          </div>
        )}
        
        {/* Add widget button (only in edit mode) */}
        {isEditMode && (
          <Dialog open={showAddWidgetDialog} onOpenChange={setShowAddWidgetDialog}>
            <DialogTrigger asChild>
              <Button className="mb-4" onClick={() => {
                setSelectedWidgetType(WIDGET_TYPES.PLAYER_CARD);
                setWidgetConfig({});
                setShowAddWidgetDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Widget</DialogTitle>
                <DialogDescription>
                  Select the type of widget to add to your dashboard.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue={WIDGET_TYPES.PLAYER_CARD} onValueChange={(value) => {
                setSelectedWidgetType(value);
                setWidgetConfig({});
              }}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value={WIDGET_TYPES.PLAYER_CARD}>Player</TabsTrigger>
                  <TabsTrigger value={WIDGET_TYPES.TEAM_COMPARISON}>Team</TabsTrigger>
                  <TabsTrigger value={WIDGET_TYPES.PIV_CHART}>Chart</TabsTrigger>
                  <TabsTrigger value={WIDGET_TYPES.MATCH_PREDICTION}>Match</TabsTrigger>
                </TabsList>
                
                {/* Player widgets */}
                <TabsContent value={WIDGET_TYPES.PLAYER_CARD} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className={`cursor-pointer border ${selectedWidgetType === WIDGET_TYPES.PLAYER_CARD ? 'border-blue-500 bg-blue-950/50' : 'border-gray-700'}`}
                      onClick={() => setSelectedWidgetType(WIDGET_TYPES.PLAYER_CARD)}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Player Card</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <CardDescription className="text-xs">
                          Shows a player's basic information and PIV rating
                        </CardDescription>
                      </CardContent>
                    </Card>
                    
                    <Card className={`cursor-pointer border ${selectedWidgetType === WIDGET_TYPES.PLAYER_PERFORMANCE ? 'border-blue-500 bg-blue-950/50' : 'border-gray-700'}`}
                      onClick={() => setSelectedWidgetType(WIDGET_TYPES.PLAYER_PERFORMANCE)}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Player Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <CardDescription className="text-xs">
                          Detailed performance metrics for a player
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {renderWidgetConfigForm()}
                </TabsContent>
                
                {/* Team widgets */}
                <TabsContent value={WIDGET_TYPES.TEAM_COMPARISON} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className={`cursor-pointer border ${selectedWidgetType === WIDGET_TYPES.TEAM_COMPARISON ? 'border-blue-500 bg-blue-950/50' : 'border-gray-700'}`}
                      onClick={() => setSelectedWidgetType(WIDGET_TYPES.TEAM_COMPARISON)}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Team Comparison</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <CardDescription className="text-xs">
                          Compare two teams across various metrics
                        </CardDescription>
                      </CardContent>
                    </Card>
                    
                    <Card className={`cursor-pointer border ${selectedWidgetType === WIDGET_TYPES.TEAM_OVERVIEW ? 'border-blue-500 bg-blue-950/50' : 'border-gray-700'}`}
                      onClick={() => setSelectedWidgetType(WIDGET_TYPES.TEAM_OVERVIEW)}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Team Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <CardDescription className="text-xs">
                          Comprehensive overview of a team
                        </CardDescription>
                      </CardContent>
                    </Card>
                    
                    <Card className={`cursor-pointer border ${selectedWidgetType === WIDGET_TYPES.ROLE_DISTRIBUTION ? 'border-blue-500 bg-blue-950/50' : 'border-gray-700'}`}
                      onClick={() => setSelectedWidgetType(WIDGET_TYPES.ROLE_DISTRIBUTION)}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Role Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <CardDescription className="text-xs">
                          Shows the role distribution within a team
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {renderWidgetConfigForm()}
                </TabsContent>
                
                {/* Chart widgets */}
                <TabsContent value={WIDGET_TYPES.PIV_CHART} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Card className={`cursor-pointer border ${selectedWidgetType === WIDGET_TYPES.PIV_CHART ? 'border-blue-500 bg-blue-950/50' : 'border-gray-700'}`}
                      onClick={() => setSelectedWidgetType(WIDGET_TYPES.PIV_CHART)}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">PIV Comparison Chart</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <CardDescription className="text-xs">
                          Compare PIV ratings of multiple players
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {renderWidgetConfigForm()}
                </TabsContent>
                
                {/* Match widgets */}
                <TabsContent value={WIDGET_TYPES.MATCH_PREDICTION} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className={`cursor-pointer border ${selectedWidgetType === WIDGET_TYPES.MATCH_PREDICTION ? 'border-blue-500 bg-blue-950/50' : 'border-gray-700'}`}
                      onClick={() => setSelectedWidgetType(WIDGET_TYPES.MATCH_PREDICTION)}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Match Prediction</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <CardDescription className="text-xs">
                          Shows the prediction for a match between two teams
                        </CardDescription>
                      </CardContent>
                    </Card>
                    
                    <Card className={`cursor-pointer border ${selectedWidgetType === WIDGET_TYPES.UPCOMING_MATCHES ? 'border-blue-500 bg-blue-950/50' : 'border-gray-700'}`}
                      onClick={() => setSelectedWidgetType(WIDGET_TYPES.UPCOMING_MATCHES)}>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Upcoming Matches</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <CardDescription className="text-xs">
                          List of upcoming matches
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {renderWidgetConfigForm()}
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddWidgetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addWidget}>
                  Add Widget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Empty state when no widgets */}
        {(!activeDashboard.layouts.lg || activeDashboard.layouts.lg.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Grid className="h-12 w-12 mb-4 text-blue-500 opacity-50" />
            <h3 className="text-xl font-medium text-blue-200 mb-2">Your dashboard is empty</h3>
            <p className="text-blue-300 max-w-md mb-6">
              Add widgets to create your custom analytics view with player cards, team comparisons, and performance charts.
            </p>
            {isEditMode ? (
              <Button onClick={() => setShowAddWidgetDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Widget
              </Button>
            ) : (
              <Button onClick={() => setIsEditMode(true)}>
                <Sliders className="mr-2 h-4 w-4" />
                Enter Edit Mode
              </Button>
            )}
          </div>
        )}
        
        {/* Grid layout */}
        {(activeDashboard.layouts.lg && activeDashboard.layouts.lg.length > 0) && (
          <ResponsiveGridLayout
            className="layout"
            layouts={activeDashboard.layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            onLayoutChange={(layout, layouts) => handleLayoutChange(layout, layouts)}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            useCSSTransforms={true}
          >
            {activeDashboard.layouts.lg.map((layout) => (
              <div key={layout.i} className="rounded-lg overflow-hidden border border-blue-900/30 bg-blue-950/50 shadow-md">
                {isEditMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={() => removeWidget(layout.i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {renderWidget(layout.i)}
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
    </div>
  );
}