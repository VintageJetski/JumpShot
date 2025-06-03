import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { PlayerWithPIV, TeamWithTIR } from '../../shared/schema';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Grid, Plus, Save, Trash2 } from 'lucide-react';
import { PlayerCombobox } from '@/components/ui/player-combobox';
import { TeamCombobox } from '@/components/ui/team-combobox';

// Import widget components
import TopPlayersByPIVIncrease from '@/components/dashboard/widgets/TopPlayersByPIVIncrease';
import DetailedPlayerInfo from '@/components/dashboard/widgets/DetailedPlayerInfo';
import TopPlayersByRole from '@/components/dashboard/widgets/TopPlayersByRole';
import TeamUpcomingMatches from '@/components/dashboard/widgets/TeamUpcomingMatches';
import DetailedTeamInfo from '@/components/dashboard/widgets/DetailedTeamInfo';

// Widget types
const WIDGET_TYPES = {
  TOP_PLAYERS_PIV_INCREASE: 'top_players_piv_increase',
  DETAILED_PLAYER_INFO: 'detailed_player_info',
  TOP_PLAYERS_BY_ROLE: 'top_players_by_role',
  TEAM_UPCOMING_MATCHES: 'team_upcoming_matches',
  DETAILED_TEAM_INFO: 'detailed_team_info',
};

// Widget info for the UI
const WIDGET_INFO = {
  [WIDGET_TYPES.TOP_PLAYERS_PIV_INCREASE]: {
    name: 'Top Players by PIV Increase',
    description: 'Shows the top 10 players with the best increase in PIV',
  },
  [WIDGET_TYPES.DETAILED_PLAYER_INFO]: {
    name: 'Detailed Player Information',
    description: 'Shows detailed information about a selected player',
  },
  [WIDGET_TYPES.TOP_PLAYERS_BY_ROLE]: {
    name: 'Top Players by Role',
    description: 'Shows the top 10 players in a selected role',
  },
  [WIDGET_TYPES.TEAM_UPCOMING_MATCHES]: {
    name: 'Team Upcoming Matches',
    description: 'Shows upcoming matches for a team with predictions',
  },
  [WIDGET_TYPES.DETAILED_TEAM_INFO]: {
    name: 'Detailed Team Information',
    description: 'Shows detailed information about a selected team',
  },
};

// Default dashboard structure
const DEFAULT_DASHBOARD = {
  name: 'Default Dashboard',
  layout: [
    {
      id: 'top-players-piv-increase-1',
      type: WIDGET_TYPES.TOP_PLAYERS_PIV_INCREASE,
      config: { limit: 10 },
      col: 1,
      row: 1,
      colSpan: 1,
      rowSpan: 2,
    },
    {
      id: 'detailed-player-info-1',
      type: WIDGET_TYPES.DETAILED_PLAYER_INFO,
      config: { playerId: null },
      col: 2,
      row: 1,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'top-players-by-role-1',
      type: WIDGET_TYPES.TOP_PLAYERS_BY_ROLE,
      config: { role: 'AWP', limit: 10 },
      col: 3,
      row: 1,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'team-upcoming-matches-1',
      type: WIDGET_TYPES.TEAM_UPCOMING_MATCHES,
      config: { teamId: null, limit: 5 },
      col: 2,
      row: 2,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'detailed-team-info-1',
      type: WIDGET_TYPES.DETAILED_TEAM_INFO,
      config: { teamId: null },
      col: 3,
      row: 2,
      colSpan: 1,
      rowSpan: 1,
    },
  ],
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
    'default': DEFAULT_DASHBOARD
  });

  // Active dashboard state
  const [activeDashboardId, setActiveDashboardId] = useLocalStorage<string>('cs2-active-dashboard', 'default');
  
  // State for adding/editing widgets
  const [showAddWidgetDialog, setShowAddWidgetDialog] = useState(false);
  const [showDashboardDialog, setShowDashboardDialog] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [dashboardAction, setDashboardAction] = useState<'new' | 'rename' | 'delete'>('new');
  const [selectedWidgetType, setSelectedWidgetType] = useState(WIDGET_TYPES.TOP_PLAYERS_PIV_INCREASE);
  const [widgetConfig, setWidgetConfig] = useState<Record<string, any>>({});
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

  // Active dashboard with fallback to default
  const activeDashboard = dashboards[activeDashboardId] || dashboards['default'] || DEFAULT_DASHBOARD;

  // Generate a unique ID for widgets
  const generateWidgetId = () => `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add a widget to the dashboard
  const addWidget = () => {
    console.log('Current widget config before saving:', widgetConfig);
    
    // If editing, update existing widget
    if (editingWidgetId) {
      console.log('Editing widget ID:', editingWidgetId);
      
      // Create a deep copy of the current layout
      let foundWidget = false;
      const updatedLayout = activeDashboard.layout.map((widget: any) => {
        if (widget.id === editingWidgetId) {
          foundWidget = true;
          console.log('Found widget to update:', widget);
          
          // Create a new widget object with updated config
          const updatedWidget = {
            ...widget,
            config: { ...widgetConfig },
          };
          
          console.log('Updated widget:', updatedWidget);
          return updatedWidget;
        }
        return widget;
      });
      
      if (!foundWidget) {
        console.error('Widget not found for ID:', editingWidgetId);
        toast({
          title: 'Error',
          description: 'Could not find the widget to update.',
          variant: 'destructive',
        });
        return;
      }

      setDashboards({
        ...dashboards,
        [activeDashboardId]: {
          ...activeDashboard,
          layout: updatedLayout,
          updatedAt: new Date().toISOString(),
        }
      });

      toast({
        title: 'Widget Updated',
        description: `Updated the widget configuration.`,
      });
    } else {
      // Add new widget to the end
      const newWidget = {
        id: generateWidgetId(),
        type: selectedWidgetType,
        config: widgetConfig,
        col: 1,
        row: activeDashboard.layout.length + 1,
        colSpan: 1,
        rowSpan: 1,
      };

      setDashboards({
        ...dashboards,
        [activeDashboardId]: {
          ...activeDashboard,
          layout: [...activeDashboard.layout, newWidget],
          updatedAt: new Date().toISOString(),
        }
      });

      toast({
        title: 'Widget Added',
        description: `Added new ${WIDGET_INFO[selectedWidgetType]?.name || 'Widget'} widget to your dashboard.`,
      });
    }

    // Reset state and close dialog
    setWidgetConfig({});
    setEditingWidgetId(null);
    setShowAddWidgetDialog(false);
  };

  // Delete a widget from the dashboard
  const deleteWidget = (widgetId: string) => {
    const updatedLayout = activeDashboard.layout.filter((widget: any) => widget.id !== widgetId);
    
    setDashboards({
      ...dashboards,
      [activeDashboardId]: {
        ...activeDashboard,
        layout: updatedLayout,
        updatedAt: new Date().toISOString(),
      }
    });

    toast({
      title: 'Widget Removed',
      description: 'Widget has been removed from your dashboard.',
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

    const dashboardExists = Object.values(dashboards).some(
      (d: any) => d.name === newDashboardName
    );
    
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
        name: newDashboardName,
        layout: [],
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
        ...activeDashboard,
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
    if (activeDashboardId === 'default') {
      toast({
        title: 'Cannot Delete Default',
        description: 'The default dashboard cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }

    const { [activeDashboardId]: _, ...remainingDashboards } = dashboards;
    setDashboards(remainingDashboards);
    setActiveDashboardId('default');
    setShowDashboardDialog(false);

    toast({
      title: 'Dashboard Deleted',
      description: `Deleted dashboard "${activeDashboard.name}".`,
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

  // Edit an existing widget
  const editWidget = (widget: any) => {
    console.log('Editing widget:', widget);
    
    // Ensure we have a config object
    const safeConfig = widget.config || {};
    console.log('Initial widget config:', safeConfig);
    
    // Set the widget type first
    setSelectedWidgetType(widget.type);
    
    // Use timeout to ensure state updates happen in order
    setTimeout(() => {
      // Set widget config and editing ID
      setWidgetConfig(safeConfig);
      setEditingWidgetId(widget.id);
      setShowAddWidgetDialog(true);
      
      console.log('Widget config set to:', safeConfig);
    }, 0);
  };

  // Render a widget based on its type and configuration
  const renderWidget = (widget: any) => {
    const { type, config } = widget;

    switch (type) {
      case WIDGET_TYPES.TOP_PLAYERS_PIV_INCREASE: {
        return <TopPlayersByPIVIncrease limit={config.limit || 10} />;
      }
      
      case WIDGET_TYPES.DETAILED_PLAYER_INFO: {
        return <DetailedPlayerInfo playerId={config.playerId} />;
      }
      
      case WIDGET_TYPES.TOP_PLAYERS_BY_ROLE: {
        return <TopPlayersByRole role={config.role || 'AWP'} limit={config.limit || 10} />;
      }
      
      case WIDGET_TYPES.TEAM_UPCOMING_MATCHES: {
        return <TeamUpcomingMatches teamId={config.teamId} limit={config.limit || 5} />;
      }
      
      case WIDGET_TYPES.DETAILED_TEAM_INFO: {
        return <DetailedTeamInfo teamId={config.teamId} />;
      }
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Unknown widget type</p>
          </div>
        );
    }
  };

  // Widget configuration form
  const renderWidgetConfigForm = () => {
    switch (selectedWidgetType) {
      case WIDGET_TYPES.DETAILED_PLAYER_INFO:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-select">Select Player</Label>
              <PlayerCombobox
                players={players}
                selectedPlayerId={widgetConfig.playerId || null}
                onSelect={(value) => setWidgetConfig({ ...widgetConfig, playerId: value })}
                placeholder="Search for a player..."
              />
            </div>
          </div>
        );
      
      case WIDGET_TYPES.TOP_PLAYERS_PIV_INCREASE:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="limit-select">Limit</Label>
              <Input
                id="limit-select"
                type="number"
                value={widgetConfig.limit || 10}
                min={1}
                max={20}
                onChange={(e) => setWidgetConfig({ ...widgetConfig, limit: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>
        );
      
      case WIDGET_TYPES.TOP_PLAYERS_BY_ROLE:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-select">Select Role</Label>
              <Select 
                onValueChange={(value) => setWidgetConfig({ ...widgetConfig, role: value })}
                value={widgetConfig.role || "AWP"}
              >
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AWP">AWP</SelectItem>
                  <SelectItem value="IGL">IGL</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Lurker">Lurker</SelectItem>
                  <SelectItem value="Spacetaker">Spacetaker</SelectItem>
                  <SelectItem value="Anchor">Anchor</SelectItem>
                  <SelectItem value="Rotator">Rotator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="players-limit">Number of Players</Label>
              <Input
                id="players-limit"
                type="number"
                value={widgetConfig.limit || 10}
                min={1}
                max={20}
                onChange={(e) => setWidgetConfig({ ...widgetConfig, limit: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>
        );
      
      case WIDGET_TYPES.TEAM_UPCOMING_MATCHES:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-select">Select Team</Label>
              <TeamCombobox
                teams={teams}
                selectedTeamId={widgetConfig.teamId || null}
                onSelect={(value) => setWidgetConfig({ ...widgetConfig, teamId: value })}
                placeholder="Search for a team..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matches-limit">Number of Matches</Label>
              <Input
                id="matches-limit"
                type="number"
                value={widgetConfig.limit || 5}
                min={1}
                max={10}
                onChange={(e) => setWidgetConfig({ ...widgetConfig, limit: parseInt(e.target.value) || 5 })}
              />
            </div>
          </div>
        );
      
      case WIDGET_TYPES.DETAILED_TEAM_INFO:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-select">Select Team</Label>
              <TeamCombobox
                teams={teams}
                selectedTeamId={widgetConfig.teamId || null}
                onSelect={(value) => {
                  console.log('Team combobox (Detailed Info) selected:', value);
                  
                  // Update the widget config state with the new team ID
                  const newConfig = { ...widgetConfig, teamId: value };
                  console.log('New widget config:', newConfig);
                  
                  // Immediately update the state to ensure it's captured
                  setWidgetConfig(newConfig);
                  
                  // Force a re-render
                  setTimeout(() => {
                    // Double check our config was updated 
                    console.log('Current widget config after team selection:', newConfig);
                  }, 0);
                }}
                placeholder="Search for a team..."
              />
            </div>
          </div>
        );
      
      default:
        return <div>No configuration needed for this widget.</div>;
    }
  };

  // Show loading spinner while fetching data
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
              {activeDashboard.name || 'My Dashboard'}
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
              setNewDashboardName(activeDashboard.name || '');
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
          
          <Dialog open={showAddWidgetDialog} onOpenChange={setShowAddWidgetDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setSelectedWidgetType(WIDGET_TYPES.TOP_PLAYERS_PIV_INCREASE);
                  setWidgetConfig({});
                  setEditingWidgetId(null);
                  setShowAddWidgetDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingWidgetId ? 'Edit Widget' : 'Add Widget'}
                </DialogTitle>
                <DialogDescription>
                  {editingWidgetId 
                    ? 'Configure the widget settings.' 
                    : 'Select a widget type and configure its settings.'}
                </DialogDescription>
              </DialogHeader>
              
              {!editingWidgetId && (
                <div className="grid grid-cols-2 gap-2 py-4">
                  {Object.entries(WIDGET_TYPES).map(([key, value]) => (
                    <Card 
                      key={key} 
                      className={`cursor-pointer ${selectedWidgetType === value ? 'border-blue-500 bg-blue-950/30' : 'border-gray-700'}`}
                      onClick={() => setSelectedWidgetType(value)}
                    >
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{WIDGET_INFO[value].name}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <p className="text-xs text-muted-foreground">
                          {WIDGET_INFO[value].description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="py-4">
                {renderWidgetConfigForm()}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddWidgetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addWidget}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingWidgetId ? 'Update Widget' : 'Add Widget'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="border border-blue-900/30 rounded-lg p-4 bg-blue-950/40">
        {activeDashboard.layout.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Grid className="h-12 w-12 mb-4 text-blue-500 opacity-50" />
            <h3 className="text-xl font-medium text-blue-200 mb-2">Your dashboard is empty</h3>
            <p className="text-blue-300 max-w-md mb-6">
              Add widgets to create your custom analytics view with player cards, team comparisons, and performance charts.
            </p>
            <Button onClick={() => setShowAddWidgetDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Widget
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {activeDashboard.layout.map((widget: any) => (
              <Card 
                key={widget.id}
                className="h-[28rem] overflow-hidden relative"
                style={{ 
                  gridColumn: `span ${widget.colSpan}`,
                  gridRow: `span ${widget.rowSpan}`,
                }}
              >
                <CardHeader className="pb-1 pt-2 px-3 flex flex-row justify-between items-center">
                  <CardTitle className="text-sm truncate max-w-[70%]">
                    {WIDGET_INFO[widget.type]?.name || "Widget"}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => editWidget(widget)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => deleteWidget(widget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-2.1rem)] overflow-y-auto custom-scrollbar">
                  <div className="p-3 pb-12">
                    {renderWidget(widget)}
                    <div className="absolute right-3 bottom-4 text-blue-400 bg-blue-900/50 p-1.5 rounded-full shadow-md animate-pulse border border-blue-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}