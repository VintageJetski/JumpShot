import { useState, useEffect } from 'react';
import { RefreshCw, PlusCircle, Save, Download, Settings, Grid, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { PlayerWithPIV, TeamWithTIR } from '@shared/schema';
import { RGL, WidthProvider } from "react-grid-layout";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import widget components
import PlayerCard from '@/components/dashboard/widgets/PlayerCard';
import TeamComparison from '@/components/dashboard/widgets/TeamComparison';
import PIVChart from '@/components/dashboard/widgets/PIVChart';
import MatchPrediction from '@/components/dashboard/widgets/MatchPrediction';
import RoleDistribution from '@/components/dashboard/widgets/RoleDistribution';
import PlayerPerformance from '@/components/dashboard/widgets/PlayerPerformance';
import TeamOverview from '@/components/dashboard/widgets/TeamOverview';
import UpcomingMatches from '@/components/dashboard/widgets/UpcomingMatches';
import { useToast } from '@/hooks/use-toast';

// Widget wrapper that provides consistent styling and controls
const WidgetWrapper = ({ children, title, onRemove, id, isEditing }: {
  children: React.ReactNode;
  title: string;
  onRemove: () => void;
  id: string;
  isEditing: boolean;
}) => {
  return (
    <Card className="h-full flex flex-col bg-gray-800/50 border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-900/50">
        <h3 className="font-medium text-sm text-gray-200">{title}</h3>
        {isEditing && (
          <button
            onClick={onRemove}
            className="p-1 rounded-full hover:bg-red-900/30 text-red-400"
            aria-label="Remove widget"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex-1 p-1 sm:p-3 overflow-auto">
        {children}
      </div>
    </Card>
  );
};

// Define widget types
interface Widget {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: any;
}

// Dashboard layout configuration
interface DashboardConfig {
  name: string;
  widgets: Widget[];
}

// Default layouts for new users
const DEFAULT_LAYOUTS: DashboardConfig[] = [
  {
    name: "Player Focus",
    widgets: [
      { id: "player-1", type: "player-card", title: "Player Overview", x: 0, y: 0, w: 3, h: 8 },
      { id: "player-perf-1", type: "player-performance", title: "Player Performance", x: 3, y: 0, w: 9, h: 8 },
      { id: "piv-chart-1", type: "piv-chart", title: "PIV Comparison", x: 0, y: 8, w: 6, h: 8 },
      { id: "role-dist-1", type: "role-distribution", title: "Role Distribution", x: 6, y: 8, w: 6, h: 8 },
    ]
  },
  {
    name: "Team Analysis",
    widgets: [
      { id: "team-overview-1", type: "team-overview", title: "Team Stats", x: 0, y: 0, w: 6, h: 8 },
      { id: "team-comparison-1", type: "team-comparison", title: "Team Comparison", x: 6, y: 0, w: 6, h: 8 },
      { id: "match-prediction-1", type: "match-prediction", title: "Match Predictions", x: 0, y: 8, w: 12, h: 8 },
    ]
  },
  {
    name: "Empty Dashboard",
    widgets: []
  }
];

// Widget catalog for adding new widgets
const WIDGET_CATALOG = [
  { type: "player-card", title: "Player Card", description: "Displays key player information and stats", w: 3, h: 8 },
  { type: "player-performance", title: "Player Performance", description: "Detailed breakdown of player metrics", w: 9, h: 8 },
  { type: "piv-chart", title: "PIV Chart", description: "Player Impact Value comparison chart", w: 6, h: 8 },
  { type: "role-distribution", title: "Role Distribution", description: "Team role distribution analysis", w: 6, h: 8 },
  { type: "team-overview", title: "Team Overview", description: "Team statistics and performance metrics", w: 6, h: 8 },
  { type: "team-comparison", title: "Team Comparison", description: "Compare two teams head-to-head", w: 6, h: 8 },
  { type: "match-prediction", title: "Match Prediction", description: "Match outcome predictions with confidence ratings", w: 12, h: 8 },
  { type: "upcoming-matches", title: "Upcoming Matches", description: "List of upcoming matches with details", w: 6, h: 8 },
];

// Size constants
const ROW_HEIGHT = 40;
const COLS = 12;

// Main Dashboard Component
export default function DashboardPage() {
  const { toast } = useToast();
  
  // Dashboard state
  const [players, setPlayers] = useState<PlayerWithPIV[]>([]);
  const [teams, setTeams] = useState<TeamWithTIR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<string>('default');
  
  // Storage of user dashboard configurations
  const [dashboards, setDashboards] = useLocalStorage<DashboardConfig[]>('dashboard-configs', DEFAULT_LAYOUTS);
  const [activeDashboard, setActiveDashboard] = useState<DashboardConfig>(dashboards[0]);
  const [newDashboardName, setNewDashboardName] = useState("");
  
  // Layout component with width provider for responsiveness
  const ResponsiveGridLayout = WidthProvider(RGL);
  
  // Fetch data for dashboard widgets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, teamsRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/teams')
        ]);
        
        if (playersRes.ok && teamsRes.ok) {
          const playersData = await playersRes.json();
          const teamsData = await teamsRes.json();
          
          setPlayers(playersData);
          setTeams(teamsData);
        } else {
          console.error('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Layout change handler for drag and drop
  const handleLayoutChange = (layout: any) => {
    if (!isEditMode) return;
    
    // Map new positions back to widgets
    const updatedWidgets = activeDashboard.widgets.map(widget => {
      const layoutItem = layout.find((item: any) => item.i === widget.id);
      if (!layoutItem) return widget;
      
      return {
        ...widget,
        x: layoutItem.x,
        y: layoutItem.y,
        w: layoutItem.w,
        h: layoutItem.h
      };
    });
    
    // Update active dashboard
    const updatedDashboard = { ...activeDashboard, widgets: updatedWidgets };
    setActiveDashboard(updatedDashboard);
    
    // Update stored dashboards
    const updatedDashboards = dashboards.map(dashboard => 
      dashboard.name === updatedDashboard.name ? updatedDashboard : dashboard
    );
    setDashboards(updatedDashboards);
  };
  
  // Add new widget to dashboard
  const addWidget = (type: string) => {
    const catalog = WIDGET_CATALOG.find(w => w.type === type);
    if (!catalog) return;
    
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      title: catalog.title,
      x: 0, // Will be calculated by grid
      y: Infinity, // Place at bottom
      w: catalog.w,
      h: catalog.h
    };
    
    const updatedWidgets = [...activeDashboard.widgets, newWidget];
    const updatedDashboard = { ...activeDashboard, widgets: updatedWidgets };
    
    setActiveDashboard(updatedDashboard);
    
    // Update stored dashboards
    const updatedDashboards = dashboards.map(dashboard => 
      dashboard.name === updatedDashboard.name ? updatedDashboard : dashboard
    );
    setDashboards(updatedDashboards);
    
    setIsAddWidgetOpen(false);
    
    toast({
      title: "Widget added",
      description: `Added ${catalog.title} to your dashboard`,
    });
  };
  
  // Remove widget from dashboard
  const removeWidget = (id: string) => {
    const updatedWidgets = activeDashboard.widgets.filter(widget => widget.id !== id);
    const updatedDashboard = { ...activeDashboard, widgets: updatedWidgets };
    
    setActiveDashboard(updatedDashboard);
    
    // Update stored dashboards
    const updatedDashboards = dashboards.map(dashboard => 
      dashboard.name === updatedDashboard.name ? updatedDashboard : dashboard
    );
    setDashboards(updatedDashboards);
  };
  
  // Save current dashboard
  const saveDashboard = () => {
    const updatedDashboards = dashboards.map(dashboard => 
      dashboard.name === activeDashboard.name ? activeDashboard : dashboard
    );
    setDashboards(updatedDashboards);
    
    toast({
      title: "Dashboard saved",
      description: `Your dashboard "${activeDashboard.name}" has been saved.`,
    });
  };
  
  // Create new dashboard
  const createNewDashboard = () => {
    if (!newDashboardName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for your dashboard",
        variant: "destructive"
      });
      return;
    }
    
    // Check for name conflicts
    if (dashboards.some(d => d.name === newDashboardName)) {
      toast({
        title: "Error",
        description: "A dashboard with this name already exists",
        variant: "destructive"
      });
      return;
    }
    
    const newDashboard: DashboardConfig = {
      name: newDashboardName,
      widgets: []
    };
    
    setDashboards([...dashboards, newDashboard]);
    setActiveDashboard(newDashboard);
    setNewDashboardName("");
    
    toast({
      title: "Dashboard created",
      description: `Created new dashboard "${newDashboardName}"`,
    });
  };
  
  // Delete current dashboard
  const deleteDashboard = () => {
    if (dashboards.length <= 1) {
      toast({
        title: "Error",
        description: "You must have at least one dashboard",
        variant: "destructive"
      });
      return;
    }
    
    const updatedDashboards = dashboards.filter(d => d.name !== activeDashboard.name);
    setDashboards(updatedDashboards);
    setActiveDashboard(updatedDashboards[0]);
    
    toast({
      title: "Dashboard deleted",
      description: `Deleted dashboard "${activeDashboard.name}"`,
    });
  };
  
  // Change selected dashboard
  const changeDashboard = (name: string) => {
    const selected = dashboards.find(d => d.name === name);
    if (selected) {
      setActiveDashboard(selected);
    }
  };
  
  // Export dashboard as JSON
  const exportDashboard = () => {
    const dataStr = JSON.stringify(activeDashboard);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dashboard-${activeDashboard.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Dashboard exported",
      description: "Your dashboard configuration has been exported as JSON",
    });
  };

  // Render the appropriate widget based on type
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'player-card':
        return players.length > 0 ? <PlayerCard player={players[0]} /> : <div>Loading player data...</div>;
      
      case 'player-performance':
        return players.length > 0 ? <PlayerPerformance player={players[0]} /> : <div>Loading performance data...</div>;
      
      case 'piv-chart':
        return players.length > 0 ? <PIVChart players={players.slice(0, 5)} /> : <div>Loading PIV data...</div>;
      
      case 'role-distribution':
        return teams.length > 0 ? <RoleDistribution teams={teams} /> : <div>Loading role data...</div>;
      
      case 'team-overview':
        return teams.length > 0 ? <TeamOverview team={teams[0]} /> : <div>Loading team data...</div>;
      
      case 'team-comparison':
        return teams.length > 1 ? <TeamComparison team1={teams[0]} team2={teams[1]} /> : <div>Loading teams data...</div>;
      
      case 'match-prediction':
        return teams.length > 1 ? <MatchPrediction team1={teams[0]} team2={teams[1]} /> : <div>Loading prediction data...</div>;
      
      case 'upcoming-matches':
        return <UpcomingMatches />;
      
      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Custom Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Customize your CS2 Analytics view with drag-and-drop widgets
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Dashboard selector */}
          <Select 
            value={activeDashboard.name} 
            onValueChange={changeDashboard}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select dashboard" />
            </SelectTrigger>
            <SelectContent>
              {dashboards.map(dashboard => (
                <SelectItem key={dashboard.name} value={dashboard.name}>
                  {dashboard.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Dashboard actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Dashboard Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Dashboard Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Dashboard
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Dashboard</DialogTitle>
                    <DialogDescription>
                      Enter a name for your new dashboard configuration.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="dashboard-name">Dashboard Name</Label>
                    <Input 
                      id="dashboard-name" 
                      value={newDashboardName}
                      onChange={(e) => setNewDashboardName(e.target.value)}
                      placeholder="My Custom Dashboard"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={createNewDashboard}>Create Dashboard</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <DropdownMenuItem onClick={saveDashboard}>
                <Save className="h-4 w-4 mr-2" />
                Save Current Layout
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={exportDashboard}>
                <Download className="h-4 w-4 mr-2" />
                Export Dashboard
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-400"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Delete Dashboard
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this dashboard? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive" onClick={deleteDashboard}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Edit mode toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-mode" className="text-sm">Edit Mode</Label>
                  <Switch
                    id="edit-mode"
                    checked={isEditMode}
                    onCheckedChange={setIsEditMode}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Toggle edit mode to add, remove, or rearrange widgets
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Add widget button - only visible in edit mode */}
          {isEditMode && (
            <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Add Widget to Dashboard</DialogTitle>
                  <DialogDescription>
                    Choose a widget to add to your dashboard.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                  {WIDGET_CATALOG.map(widget => (
                    <Card 
                      key={widget.type}
                      className="p-4 cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => addWidget(widget.type)}
                    >
                      <h3 className="font-medium mb-1">{widget.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">{widget.description}</p>
                      <div className="text-xs text-gray-500">
                        Size: {widget.w}x{widget.h}
                      </div>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Refresh button */}
          <Button variant="outline" size="icon" className="ml-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Dashboard grid */}
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: activeDashboard.widgets.map(widget => ({
            i: widget.id,
            x: widget.x,
            y: widget.y,
            w: widget.w,
            h: widget.h,
            isDraggable: isEditMode,
            isResizable: isEditMode
          })) }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={ROW_HEIGHT}
          containerPadding={[0, 0]}
          margin={[16, 16]}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
        >
          {activeDashboard.widgets.map(widget => (
            <div key={widget.id}>
              <WidgetWrapper 
                title={widget.title}
                onRemove={() => removeWidget(widget.id)}
                id={widget.id}
                isEditing={isEditMode}
              >
                {renderWidget(widget)}
              </WidgetWrapper>
            </div>
          ))}
        </ResponsiveGridLayout>
        
        {/* Empty state */}
        {activeDashboard.widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 border border-dashed border-gray-700 rounded-lg">
            <Grid className="h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Your dashboard is empty</h3>
            <p className="text-gray-400 max-w-md mb-6">
              {isEditMode 
                ? "Click 'Add Widget' to start building your custom dashboard." 
                : "Enable edit mode and add widgets to build your custom dashboard."}
            </p>
            {isEditMode ? (
              <Button onClick={() => setIsAddWidgetOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Widget
              </Button>
            ) : (
              <Button onClick={() => setIsEditMode(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Enable Edit Mode
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}